"""
Model Matrix — maps (provider, use_case) → model_id
Mirrors the frontend data.js but only for supported backend providers.
"""

MODEL_MATRIX = {
    "Google": {
        "reasoning": "gemini-2.5-pro",
        "tool calling": "gemini-2.5-flash",
        "summarization": "gemini-2.5-flash-lite",
        "structured output": "gemini-2.5-pro",
        "rag": "gemini-2.5-pro",
        "vision": "gemini-2.5-pro",
        "multimodality": "gemini-2.5-pro",
    },
    "OpenAI": {
        "reasoning": "gpt-4o",
        "tool calling": "gpt-4o",
        "summarization": "gpt-4o-mini",
        "structured output": "gpt-4o",
        "rag": "gpt-4o-mini",
        "vision": "gpt-4o",
        "multimodality": "gpt-4o",
    },
    "Meta": {
        "reasoning": "meta/llama-3.3-70b-instruct-maas",
        "tool calling": "meta/llama-3.3-70b-instruct-maas",
        "summarization": "meta/llama-3.3-70b-instruct-maas",
        "structured output": "meta/llama-3.3-70b-instruct-maas",
        "rag": "meta/llama-3.3-70b-instruct-maas",
        "vision": "meta/llama-4-scout-17b-16e-instruct-maas",
        "multimodality": "meta/llama-4-scout-17b-16e-instruct-maas",
    },
    "Mistral AI": {
        "reasoning": "mistral.mistral-large-2402-v1:0",
        "tool calling": "mistral.mistral-small-2402-v1:0",
        "summarization": "mistral.mistral-small-2402-v1:0",
        "structured output": "mistral.mistral-large-2402-v1:0",
        "rag": "mistral.mistral-large-2402-v1:0",
        "vision": "us.mistral.pixtral-large-2502-v1:0",
        "multimodality": "us.mistral.pixtral-large-2502-v1:0",
    },
    "Amazon": {
        "reasoning": "amazon.nova-pro-v1:0",
        "tool calling": "amazon.nova-pro-v1:0",
        "summarization": "amazon.nova-lite-v1:0",
        "structured output": "amazon.nova-pro-v1:0",
        "rag": "amazon.nova-lite-v1:0",
        "vision": "amazon.nova-pro-v1:0",
        "multimodality": "amazon.nova-pro-v1:0",
    },
    "DeepSeek": {
        "reasoning": "deepseek-ai/deepseek-r1-0528-maas",
        "tool calling": "deepseek-ai/deepseek-v3.2-maas",
        "summarization": "deepseek-ai/deepseek-v3.2-maas",
        "structured output": "deepseek-ai/deepseek-v3.2-maas",
        "rag": "deepseek-ai/deepseek-v3.2-maas",
        "vision": "deepseek-ai/deepseek-v3.2-maas",
        "multimodality": "deepseek-ai/deepseek-v3.2-maas",
    },
}

# DeepSeek models need specific regions
MODEL_REGION_MAP = {
    "deepseek-ai/deepseek-v3.2-maas": "global",
    "deepseek-ai/deepseek-r1-0528-maas": "us-central1",
}


def get_model_id(provider: str, use_case: str) -> str:
    """Look up the model ID for a given provider and use case."""
    provider_models = MODEL_MATRIX.get(provider)
    if not provider_models:
        raise ValueError(f"Unsupported provider: {provider}")

    model_id = provider_models.get(use_case)
    if not model_id:
        raise ValueError(f"Unsupported use case '{use_case}' for provider '{provider}'")

    return model_id


def get_gateway(provider: str) -> str:
    """Determine which gateway/SDK to use for a provider."""
    if provider == "Google":
        return "vertex_genai"
    elif provider == "OpenAI":
        return "openai_direct"
    elif provider == "Meta":
        return "vertex_openai"
    elif provider in ("Mistral AI", "Amazon"):
        return "bedrock"
    elif provider == "DeepSeek":
        return "vertex_openai_deepseek"
    else:
        raise ValueError(f"No gateway configured for provider: {provider}")
