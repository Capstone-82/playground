from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from app.models.schemas import ChatRequest, ChatResponse
from app.core.model_matrix import get_model_id
from app.services.ai_service import ai_service
from app.services.pricing_service import PricingService
from app.services.supabase_service import supabase_service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Unified chat endpoint (text-only).
    """
    return await _process_chat(
        provider=request.provider,
        use_case=request.use_case,
        prompt=request.prompt,
        model_id=request.model_id,
    )


@router.post("/chat/vision", response_model=ChatResponse)
async def chat_vision(
    provider: str = Form(...),
    use_case: str = Form(default="vision"),
    prompt: str = Form(...),
    model_id: Optional[str] = Form(default=None),
    image: UploadFile = File(...),
):
    """
    Vision chat endpoint — accepts an image via multipart/form-data.
    Image is read into memory, passed to the model, and discarded. Nothing stored.
    """
    # Read image bytes into memory
    image_bytes = await image.read()
    mime_type = image.content_type or "image/png"

    return await _process_chat(
        provider=provider,
        use_case=use_case,
        prompt=prompt,
        model_id=model_id,
        image_bytes=image_bytes,
        mime_type=mime_type,
    )


async def _process_chat(
    provider: str,
    use_case: str,
    prompt: str,
    model_id: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    mime_type: Optional[str] = None,
) -> ChatResponse:
    """Shared logic for text and vision chat."""
    try:
        # Step 1: Resolve model
        resolved_model = model_id or get_model_id(provider, use_case)

        # Step 2: Call the AI provider
        result = await ai_service.generate(
            provider, resolved_model, prompt,
            image_bytes=image_bytes, mime_type=mime_type,
        )

        # Step 3: Calculate cost
        cost = PricingService.calculate_cost(
            resolved_model, result["input_tokens"], result["output_tokens"]
        )

        # Step 4: Log to Supabase (prompt only, NOT the image)
        telemetry_data = {
            "provider": provider,
            "model_id": resolved_model,
            "use_case": use_case,
            "prompt": prompt,
            "response": result["text"],
            "input_tokens": result["input_tokens"],
            "output_tokens": result["output_tokens"],
            "cost": cost,
            "latency_ms": result["latency_ms"],
        }

        try:
            supabase_service.log_telemetry(telemetry_data)
        except Exception as e:
            print(f"Warning: Failed to log telemetry: {e}")

        # Step 5: Return response
        return ChatResponse(
            response=result["text"],
            provider=provider,
            model_id=resolved_model,
            use_case=use_case,
            metrics={
                "input_tokens": result["input_tokens"],
                "output_tokens": result["output_tokens"],
                "cost": cost,
                "latency_ms": result["latency_ms"],
            },
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model invocation failed: {str(e)}")
