import os
import json
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

def inspect_model_response(model_id: str, prompt: str):
    print(f"\n{'='*50}")
    print(f"Inspecting Model: {model_id}")
    print(f"{'='*50}")
    
    client = genai.Client(
        vertexai=True, 
        project=PROJECT_ID, 
        location=LOCATION,
    )

    try:
        response = client.models.generate_content(
            model=model_id,
            contents=[prompt],
        )
        
        # Convert response to a simple dict for inspection
        # Usage metadata is key for our governance platform
        usage = response.usage_metadata
        
        result = {
            "model": model_id,
            "text_preview": response.text[:100] + "...",
            "metadata": {
                "input_tokens": usage.prompt_token_count,
                "output_tokens": usage.candidates_token_count,
                "total_tokens": usage.total_token_count,
            },
            "finish_reason": response.candidates[0].finish_reason if response.candidates else "unknown"
        }
        
        print(json.dumps(result, indent=2))
        return result

    except Exception as e:
        print(f"Error calling {model_id}: {e}")
        return None

if __name__ == "__main__":
    if not PROJECT_ID:
        print("Error: GOOGLE_CLOUD_PROJECT not found in .env")
    else:
        # Test a few common models
        models_to_test = [
            "gemini-1.5-flash",
            "gemini-1.5-pro"
        ]
        
        for m in models_to_test:
            inspect_model_response(m, "Define 'AI Governance' in one sentence.")
