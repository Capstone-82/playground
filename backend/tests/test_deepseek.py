import os
import dotenv
import google.auth
import google.auth.transport.requests
from openai import OpenAI

dotenv.load_dotenv()

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")

# Get OAuth2 access token
creds, _ = google.auth.default()
auth_req = google.auth.transport.requests.Request()
creds.refresh(auth_req)


def print_result(model, text, input_tokens, output_tokens):
    print(f"  Model: {model}")
    print(f"  Response: {text[:150]}...")
    print(f"  Input Tokens: {input_tokens}")
    print(f"  Output Tokens: {output_tokens}")
    print(f"  Status: OK\n")


def get_client(region):
    """Create OpenAI-compatible client for a specific region or global."""
    if region == "global":
        base_url = f"https://aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/global/endpoints/openapi"
    else:
        base_url = f"https://{region}-aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/{region}/endpoints/openapi"
    return OpenAI(base_url=base_url, api_key=creds.token)


def test_deepseek():
    print("=" * 60)
    print("DEEPSEEK (Vertex AI - OpenAI Compatible API)")
    print("=" * 60)

    # Try multiple regions: global first, then regional fallbacks
    regions_to_try = ["global", "us-central1", "us-east5", "europe-west4"]

    models_to_test = [
        "deepseek-ai/deepseek-v3.2-maas",
        "deepseek-ai/deepseek-r1-0528-maas",
    ]

    for model_id in models_to_test:
        success = False
        for region in regions_to_try:
            try:
                client = get_client(region)
                response = client.chat.completions.create(
                    model=model_id,
                    messages=[{"role": "user", "content": "Define AI Governance in one sentence."}],
                    max_tokens=256,
                )
                print(f"  ✅ Region: {region}")
                print_result(
                    model_id,
                    response.choices[0].message.content,
                    response.usage.prompt_tokens,
                    response.usage.completion_tokens,
                )
                success = True
                break
            except Exception as e:
                print(f"  ❌ [{model_id}] ({region}): {str(e)[:100]}")

        if not success:
            print(f"  [{model_id}] FAILED in all regions.\n")


if __name__ == "__main__":
    print("\n  AI CLOUD GOVERNANCE - DeepSeek Provider Test")
    print("  " + "=" * 55 + "\n")

    test_deepseek()

    print("\n  Test Complete.\n")
