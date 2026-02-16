import os
import json
import dotenv
import boto3

dotenv.load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Create Bedrock Runtime client
bedrock = boto3.client(
    service_name="bedrock-runtime",
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

def print_result(provider, model, text, input_tokens, output_tokens):
    print(f"  Model: {model}")
    print(f"  Response: {text[:120]}...")
    print(f"  Input Tokens: {input_tokens}")
    print(f"  Output Tokens: {output_tokens}")
    print(f"  Status: OK\n")

# ============================================================
# 1. MISTRAL via Bedrock (Converse API - unified across models)
# ============================================================
def test_mistral_bedrock():
    print("=" * 60)
    print("1. MISTRAL (AWS Bedrock)")
    print("=" * 60)

    models_to_test = [
        "mistral.mistral-small-2402-v1:0",
        "mistral.mistral-large-2402-v1:0",
    ]

    for model_id in models_to_test:
        try:
            response = bedrock.converse(
                modelId=model_id,
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": "Define AI Governance in one sentence."}]
                    }
                ],
                inferenceConfig={"maxTokens": 256},
            )

            text = response["output"]["message"]["content"][0]["text"]
            usage = response["usage"]
            print_result(
                "Mistral", model_id, text,
                usage["inputTokens"], usage["outputTokens"]
            )
        except Exception as e:
            print(f"  [{model_id}] Error: {e}\n")

# ============================================================
# 2. AMAZON NOVA via Bedrock (Converse API)
# ============================================================
def test_amazon_nova():
    print("=" * 60)
    print("2. AMAZON NOVA (AWS Bedrock)")
    print("=" * 60)

    models_to_test = [
        "amazon.nova-lite-v1:0",
        "amazon.nova-pro-v1:0",
    ]

    for model_id in models_to_test:
        try:
            response = bedrock.converse(
                modelId=model_id,
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": "Define AI Governance in one sentence."}]
                    }
                ],
                inferenceConfig={"maxTokens": 256},
            )

            text = response["output"]["message"]["content"][0]["text"]
            usage = response["usage"]
            print_result(
                "Amazon", model_id, text,
                usage["inputTokens"], usage["outputTokens"]
            )
        except Exception as e:
            print(f"  [{model_id}] Error: {e}\n")

# ============================================================
# RUN ALL TESTS
# ============================================================
if __name__ == "__main__":
    print("\n  AI CLOUD GOVERNANCE - AWS Bedrock Provider Test")
    print("  " + "=" * 55 + "\n")

    test_mistral_bedrock()
    test_amazon_nova()

    print("\n  Test Complete.\n")
