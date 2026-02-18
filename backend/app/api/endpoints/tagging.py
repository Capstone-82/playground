"""
Tagging & Model Selection API — workload classification + model recommendation.
"""
import json
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    ClassifyPromptRequest, ClassifyPromptResponse,
    RecommendModelRequest, RecommendModelResponse,
    ModelRegistryEntry,
)
from app.core.model_matrix import MODEL_REGISTRY, get_models_by_tags, recommend_model, CAPABILITY_KEYS
from app.services.ai_service import ai_service

router = APIRouter()


# ── System Prompt for Workload Classification ──────────────
WORKLOAD_CLASSIFIER_PROMPT = """You are a Prompt Workload Tagging Engine used inside an Enterprise AI Governance Platform.

Your task is to analyze the user's TEXT prompt and classify its primary intent into one or more of the following workload tags:

- reasoning
- summarization
- structured_output
- rag
- tool_calling

Tag Definitions:

reasoning:
Tasks involving logical analysis, explanation, decision-making, inference, comparisons or problem solving.

summarization:
Tasks requesting shortening, condensing or abstracting content.

structured_output:
Tasks where output must follow a defined format such as JSON, table, schema or key-value structure.

rag:
Tasks that require retrieving information from external knowledge bases, enterprise documents or company policies.

tool_calling:
Tasks that require execution of actions such as database lookup, API interaction or automation workflows.

Rules:

- Tag based only on prompt intent.
- Do NOT assume knowledge source unless explicitly mentioned.
- Multiple tags can be assigned if multiple tasks are requested.
- Ignore language complexity and focus on expected output.

Return output in JSON format ONLY, no extra text:

{"tags": ["tag1", "tag2"]}
"""


@router.get("/models/registry", response_model=list[ModelRegistryEntry])
async def list_models():
    """Return the full model registry for frontend consumption."""
    return MODEL_REGISTRY


@router.post("/tag/classify-prompt", response_model=ClassifyPromptResponse)
async def classify_prompt(request: ClassifyPromptRequest):
    """Classify a prompt into workload tags using a fast LLM."""
    try:
        # Use a fast, cheap model for classification
        result = await ai_service.generate(
            provider="Google",
            model_id="gemini-2.5-flash",
            prompt=f"{WORKLOAD_CLASSIFIER_PROMPT}\n\nUser Prompt:\n{request.prompt_text}",
        )
        
        # Parse JSON from the model response
        response_text = result["text"].strip()
        # Handle markdown code blocks
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        
        parsed = json.loads(response_text)
        tags = parsed.get("tags", [])
        
        # Validate tags against known capabilities
        valid_tags = [t for t in tags if t in CAPABILITY_KEYS]
        if not valid_tags:
            valid_tags = ["reasoning"]  # Fallback
        
        return ClassifyPromptResponse(tags=valid_tags)
    except json.JSONDecodeError:
        # If the model doesn't return valid JSON, default to reasoning
        return ClassifyPromptResponse(tags=["reasoning"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@router.post("/tag/recommend-model", response_model=RecommendModelResponse)
async def recommend(request: RecommendModelRequest):
    """Recommend the best model for the given workload tags."""
    try:
        # Normalize tag names
        normalized_tags = [t.replace(" ", "_") for t in request.tags]
        
        best = recommend_model(normalized_tags)
        if not best:
            raise HTTPException(
                status_code=404,
                detail=f"No model found supporting all tags: {request.tags}"
            )
        
        return RecommendModelResponse(
            recommended_model=best["model_id"],
            provider=best["provider"],
            display_name=best["display_name"],
            quality_score=best["quality_score"],
            cost_per_1k=best["cost_per_1k"],
            latency=best["latency"],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
