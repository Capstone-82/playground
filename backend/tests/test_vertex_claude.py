import os
from dotenv import load_dotenv
from anthropic import AnthropicVertex

# Load environment variables
load_dotenv()

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-east5") # Claude is often in us-east5 or europe-west1

def test_claude():
    print(f"--- Testing Claude (Project: {PROJECT_ID}, Location: {LOCATION}) ---")
    
    client = AnthropicVertex(region=LOCATION, project_id=PROJECT_ID)

    # Use a standard Claude 3 model ID available on Vertex
    model_id = "claude-3-5-sonnet@20240620" 
    
    try:
        message = client.messages.create(
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": "Why is model governance important for enterprises?",
                }
            ],
            model=model_id,
        )
        
        print(f"Model: {model_id}")
        print(f"Response: {message.content[0].text}")
        print("\nStructure breakdown:")
        print(f"Usage Info: {message.usage}")
        print(f"Input Tokens: {message.usage.input_tokens}")
        print(f"Output Tokens: {message.usage.output_tokens}")
        
    except Exception as e:
        print(f"Error testing Claude: {e}")
        print("Note: Ensure Claude is enabled in your Google Cloud Model Garden and that you are using a supported region.")

if __name__ == "__main__":
    if not PROJECT_ID:
        print("Error: GOOGLE_CLOUD_PROJECT not found in .env")
    else:
        test_claude()
