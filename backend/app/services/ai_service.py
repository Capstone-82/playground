import time
import base64
import google.auth
import google.auth.transport.requests
import boto3
from google import genai
from google.genai import types as genai_types
from openai import OpenAI
from app.core.config import settings
from app.core.model_matrix import get_gateway, MODEL_REGION_MAP

# Meta models need specific regions on Vertex AI
META_REGION_MAP = {
    "meta/llama-3.3-70b-instruct-maas": "us-central1",
    "meta/llama-4-scout-17b-16e-instruct-maas": "us-east5",
}


class AIService:
    """Unified AI service that routes requests to the correct provider SDK."""

    def __init__(self):
        # Google Gemini client (Vertex AI + API Key)
        self._vertex_genai_client = genai.Client(
            vertexai=True,
            api_key=settings.GOOGLE_API_KEY,
        )

        # OpenAI direct client
        self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Meta Llama client (Vertex AI OpenAI-compatible endpoint)
        self._meta_client = None  # Lazy init because OAuth token expires

        # AWS Bedrock client
        self._bedrock_client = boto3.client(
            service_name="bedrock-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    def _get_meta_client(self, model_id: str) -> OpenAI:
        """Create/refresh the Meta Llama client with fresh OAuth token and correct region."""
        creds, _ = google.auth.default()
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)

        region = META_REGION_MAP.get(model_id, "us-central1")
        return OpenAI(
            base_url=f"https://{region}-aiplatform.googleapis.com/v1beta1/projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/{region}/endpoints/openapi",
            api_key=creds.token,
        )

    async def generate(
        self, provider: str, model_id: str, prompt: str,
        image_bytes: bytes = None, mime_type: str = None
    ) -> dict:
        """
        Route to the correct provider and return a normalized response.
        
        Args:
            provider: Provider name
            model_id: Model identifier
            prompt: Text prompt
            image_bytes: Optional raw image bytes for vision tasks
            mime_type: Image MIME type (e.g. "image/png")
        
        Returns:
            {
                "text": str,
                "input_tokens": int,
                "output_tokens": int,
                "latency_ms": int,
            }
        """
        gateway = get_gateway(provider)
        start_time = time.time()

        if gateway == "vertex_genai":
            result = self._call_gemini(model_id, prompt, image_bytes, mime_type)
        elif gateway == "openai_direct":
            result = self._call_openai(model_id, prompt, image_bytes, mime_type)
        elif gateway == "vertex_openai":
            result = self._call_meta(model_id, prompt, image_bytes, mime_type)
        elif gateway == "bedrock":
            result = self._call_bedrock(model_id, prompt, image_bytes, mime_type)
        elif gateway == "vertex_openai_deepseek":
            result = self._call_deepseek(model_id, prompt)
        else:
            raise ValueError(f"Unknown gateway: {gateway}")

        elapsed_ms = int((time.time() - start_time) * 1000)
        result["latency_ms"] = elapsed_ms
        return result

    def _call_gemini(self, model_id: str, prompt: str, image_bytes: bytes = None, mime_type: str = None) -> dict:
        """Call Google Gemini via Vertex AI genai SDK. Supports vision with image bytes."""
        contents = []

        if image_bytes and mime_type:
            # Build multimodal content: image + text
            image_part = genai_types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            contents = [image_part, prompt]
        else:
            contents = prompt

        response = self._vertex_genai_client.models.generate_content(
            model=model_id,
            contents=contents,
        )
        usage = response.usage_metadata
        return {
            "text": response.text,
            "input_tokens": usage.prompt_token_count or 0,
            "output_tokens": usage.candidates_token_count or 0,
        }

    def _call_openai(self, model_id: str, prompt: str, image_bytes: bytes = None, mime_type: str = None) -> dict:
        """Call OpenAI directly. Supports vision with base64 image."""
        if image_bytes and mime_type:
            # Vision: encode image to base64 server-side and send in message
            b64_image = base64.b64encode(image_bytes).decode("utf-8")
            messages = [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{b64_image}",
                        },
                    },
                ],
            }]
        else:
            messages = [{"role": "user", "content": prompt}]

        response = self._openai_client.chat.completions.create(
            model=model_id,
            messages=messages,
        )
        return {
            "text": response.choices[0].message.content,
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
        }

    def _call_meta(self, model_id: str, prompt: str, image_bytes: bytes = None, mime_type: str = None) -> dict:
        """Call Meta Llama via Vertex AI OpenAI-compatible endpoint. Supports vision with Llama 4 Scout."""
        client = self._get_meta_client(model_id)

        if image_bytes and mime_type:
            # Vision: Llama 4 Scout supports OpenAI-style image_url with base64
            b64_image = base64.b64encode(image_bytes).decode("utf-8")
            messages = [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{b64_image}",
                        },
                    },
                ],
            }]
        else:
            messages = [{"role": "user", "content": prompt}]

        response = client.chat.completions.create(
            model=model_id,
            messages=messages,
            max_tokens=1024,
        )
        return {
            "text": response.choices[0].message.content,
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
        }

    def _call_bedrock(self, model_id: str, prompt: str, image_bytes: bytes = None, mime_type: str = None) -> dict:
        """Call Mistral/Amazon via AWS Bedrock Converse API. Supports vision with image bytes."""
        content = [{"text": prompt}]

        if image_bytes and mime_type:
            # Map MIME to Bedrock format (jpeg, png, gif, webp)
            fmt = mime_type.split("/")[-1]
            if fmt == "jpg":
                fmt = "jpeg"
            content.insert(0, {
                "image": {
                    "format": fmt,
                    "source": {"bytes": image_bytes},
                }
            })

        response = self._bedrock_client.converse(
            modelId=model_id,
            messages=[
                {
                    "role": "user",
                    "content": content,
                }
            ],
            inferenceConfig={"maxTokens": 1024},
        )
        text = response["output"]["message"]["content"][0]["text"]
        usage = response["usage"]
        return {
            "text": text,
            "input_tokens": usage["inputTokens"],
            "output_tokens": usage["outputTokens"],
        }

    def _call_deepseek(self, model_id: str, prompt: str) -> dict:
        """Call DeepSeek via Vertex AI OpenAI-compatible endpoint. No vision support."""
        creds, _ = google.auth.default()
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)

        region = MODEL_REGION_MAP.get(model_id, "global")
        if region == "global":
            base_url = f"https://aiplatform.googleapis.com/v1beta1/projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/global/endpoints/openapi"
        else:
            base_url = f"https://{region}-aiplatform.googleapis.com/v1beta1/projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/{region}/endpoints/openapi"

        client = OpenAI(base_url=base_url, api_key=creds.token)
        response = client.chat.completions.create(
            model=model_id,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
        )
        return {
            "text": response.choices[0].message.content,
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
        }


# Singleton instance
ai_service = AIService()
