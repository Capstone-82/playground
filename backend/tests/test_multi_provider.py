import os
import dotenv
from google import genai
from openai import OpenAI
import google.auth
import google.auth.transport.requests

dotenv.load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

# Vertex AI client for Gemini
vertex_client = genai.Client(vertexai=True, api_key=GOOGLE_API_KEY)

def print_result(provider, model, text, input_tokens, output_tokens):
    print(f"  Model: {model}")
    print(f"  Response: {text[:120]}...")
    print(f"  Input Tokens: {input_tokens}")
    print(f"  Output Tokens: {output_tokens}")
    print(f"  Status: OK\n")

# ============================================================
# 1. GOOGLE GEMINI — Vertex AI with API Key
# ============================================================
def test_google_gemini():
    print("=" * 60)
    print("1. GOOGLE GEMINI (Vertex AI + API Key)")
    print("=" * 60)

    models_to_test = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
    ]

    for model_id in models_to_test:
        try:
            response = vertex_client.models.generate_content(
                model=model_id,
                contents="Define AI Governance in one sentence.",
            )
            usage = response.usage_metadata
            print_result(
                "Google", model_id, response.text,
                usage.prompt_token_count, usage.candidates_token_count
            )
        except Exception as e:
            print(f"  [{model_id}] Error: {e}\n")

# ============================================================
# 2. META LLAMA — Vertex AI Model Garden (OpenAI-compatible API)
#    IMPORTANT: Llama uses /chat/completions endpoint, NOT generateContent
#    Region: us-central1 (not all regions support Llama)
#    You MUST enable the model in Model Garden first:
#    https://console.cloud.google.com/vertex-ai/publishers/meta/model-garden/llama-3.3-70b-instruct-maas
# ============================================================
def test_meta_llama():
    print("=" * 60)
    print("2. META LLAMA (Vertex AI - OpenAI Compatible API)")
    print("=" * 60)

    # Llama models on Vertex use OpenAI-compatible chat/completions endpoint
    # Region MUST be us-central1 for Llama 3.3
    llama_region = "us-central1"

    # Get access token from gcloud credentials
    creds, _ = google.auth.default()
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    access_token = creds.token

    # OpenAI-compatible client pointing to Vertex AI endpoint
    llama_client = OpenAI(
        base_url=f"https://{llama_region}-aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/{llama_region}/endpoints/openapi",
        api_key=access_token,  # Use OAuth2 access token as API key
    )

    models_to_test = [
        "meta/llama-3.3-70b-instruct-maas",
    ]

    for model_id in models_to_test:
        try:
            response = llama_client.chat.completions.create(
                model=model_id,
                messages=[{"role": "user", "content": "Define AI Governance in one sentence."}],
                max_tokens=256,
            )
            print_result(
                "Meta", model_id, response.choices[0].message.content,
                response.usage.prompt_tokens, response.usage.completion_tokens
            )
        except Exception as e:
            print(f"  [{model_id}] Error: {e}\n")

# ============================================================
# 3. MISTRAL — Vertex AI Model Garden (OpenAI-compatible API)
#    Same approach as Llama - uses /chat/completions
# ============================================================
def test_mistral():
    print("=" * 60)
    print("3. MISTRAL (Vertex AI - OpenAI Compatible API)")
    print("=" * 60)

    # Mistral models also use OpenAI-compatible endpoint
    mistral_region = "us-central1"

    creds, _ = google.auth.default()
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    access_token = creds.token

    mistral_client = OpenAI(
        base_url=f"https://{mistral_region}-aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/{mistral_region}/endpoints/openapi",
        api_key=access_token,
    )

    models_to_test = [
        "mistralai/mistral-small-2503",
        "mistralai/mistral-medium-3",
    ]

    for model_id in models_to_test:
        try:
            response = mistral_client.chat.completions.create(
                model=model_id,
                messages=[{"role": "user", "content": "Define AI Governance in one sentence."}],
                max_tokens=256,
            )
            print_result(
                "Mistral", model_id, response.choices[0].message.content,
                response.usage.prompt_tokens, response.usage.completion_tokens
            )
        except Exception as e:
            print(f"  [{model_id}] Error: {e}\n")

# ============================================================
# 4. OPENAI — Direct API (already working)
# ============================================================
def test_openai():
    print("=" * 60)
    print("4. OPENAI (Direct API)")
    print("=" * 60)

    client = OpenAI(api_key=OPENAI_API_KEY)

    models_to_test = [
        "gpt-4o-mini",
        "gpt-4o",
    ]

    for model_id in models_to_test:
        try:
            response = client.chat.completions.create(
                model=model_id,
                messages=[{"role": "user", "content": "Define AI Governance in one sentence."}],
            )
            print_result(
                "OpenAI", model_id, response.choices[0].message.content,
                response.usage.prompt_tokens, response.usage.completion_tokens
            )
        except Exception as e:
            print(f"  [{model_id}] Error: {e}\n")

# ============================================================
# RUN ALL TESTS
# ============================================================
if __name__ == "__main__":
    print("\n  AI CLOUD GOVERNANCE - Provider Connectivity Test")
    print("  " + "=" * 55 + "\n")

    # test_google_gemini()
    # test_openai()
    # test_meta_llama()
    test_mistral()

    print("\n  Test Complete.\n")
