"""
Model Registry — capability-flagged model catalog for the AI Governance Platform.

Each entry contains:
  - model_id / provider / display_name
  - Capability booleans: reasoning, tool_calling, summarization, structured_output, rag, vision, multimodality
  - Performance metadata: latency (ms), cost_per_1k tokens, quality_score (0-5)
  - context_window (tokens)
"""

MODEL_REGISTRY = [
    # ── Google ──────────────────────────────────────────────
    {
        "model_id": "gemini-2.5-pro",
        "provider": "Google",
        "display_name": "Gemini 2.5 Pro",
        "reasoning": True,
        "coding": True,
        "tool_calling": True,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": True,
        "multimodality": True,
        "latency": 2200,
        "cost_per_1k": 0.01125,
        "quality_score": 4.7,
        "context_window": 1048576,
    },
    {
        "model_id": "gemini-2.5-flash",
        "provider": "Google",
        "display_name": "Gemini 2.5 Flash",
        "reasoning": True,
        "coding": True,
        "tool_calling": True,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": True,
        "multimodality": True,
        "latency": 800,
        "cost_per_1k": 0.0015,
        "quality_score": 4.2,
        "context_window": 1048576,
    },
    {
        "model_id": "gemini-1.5-flash-8b",
        "provider": "Google",
        "display_name": "Gemini 1.5 Flash-8B",
        "reasoning": False,
        "coding": False,
        "tool_calling": False,
        "summarization": True,
        "structured_output": True,
        "rag": False,
        "vision": False,
        "multimodality": False,
        "latency": 400,
        "cost_per_1k": 0.0003,
        "quality_score": 3.5,
        "context_window": 1048576,
    },
    # ── OpenAI ──────────────────────────────────────────────
    {
        "model_id": "gpt-4o",
        "provider": "OpenAI",
        "display_name": "GPT-4o",
        "reasoning": True,
        "coding": True,
        "tool_calling": True,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": True,
        "multimodality": True,
        "latency": 1500,
        "cost_per_1k": 0.01,
        "quality_score": 4.5,
        "context_window": 128000,
    },
    {
        "model_id": "gpt-4o-mini",
        "provider": "OpenAI",
        "display_name": "GPT-4o Mini",
        "reasoning": True,
        "coding": True,
        "tool_calling": True,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": True,
        "multimodality": False,
        "latency": 600,
        "cost_per_1k": 0.00015,
        "quality_score": 3.8,
        "context_window": 128000,
    },
    {
        "model_id": "o1-preview",
        "provider": "OpenAI",
        "display_name": "o1 Preview",
        "reasoning": True,
        "coding": True,
        "tool_calling": False,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": False,
        "multimodality": False,
        "latency": 5000,
        "cost_per_1k": 0.015,
        "quality_score": 4.8,
        "context_window": 128000,
    },
    {
        "model_id": "o1-mini",
        "provider": "OpenAI",
        "display_name": "o1 Mini",
        "reasoning": True,
        "coding": True,
        "tool_calling": False,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": False,
        "multimodality": False,
        "latency": 1500,
        "cost_per_1k": 0.003,
        "quality_score": 4.4,
        "context_window": 128000,
    },
    # ── Meta ────────────────────────────────────────────────
    {
        "model_id": "meta/llama-3.3-70b-instruct-maas",
        "provider": "Meta",
        "display_name": "Llama 3.3 70B Instruct",
        "reasoning": True,
        "coding": True,
        "tool_calling": True,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": False,
        "multimodality": False,
        "latency": 1200,
        "cost_per_1k": 0.0006,
        "quality_score": 4.0,
        "context_window": 131072,
    },
    {
        "model_id": "meta/llama-4-scout-17b-16e-instruct-maas",
        "provider": "Meta",
        "display_name": "Llama 4 Scout 17B",
        "reasoning": True,
        "coding": True,
        "tool_calling": False,
        "summarization": True,
        "structured_output": False,
        "rag": False,
        "vision": True,
        "multimodality": True,
        "latency": 900,
        "cost_per_1k": 0.0004,
        "quality_score": 3.6,
        "context_window": 131072,
    },
    # ── Amazon ──────────────────────────────────────────────
    {
        "model_id": "amazon.nova-pro-v1:0",
        "provider": "Amazon",
        "display_name": "Nova Pro",
        "reasoning": True,
        "coding": True,
        "tool_calling": True,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": True,
        "multimodality": True,
        "latency": 1400,
        "cost_per_1k": 0.0008,
        "quality_score": 4.1,
        "context_window": 128000,
    },
    {
        "model_id": "amazon.nova-lite-v1:0",
        "provider": "Amazon",
        "display_name": "Nova Lite",
        "reasoning": False,
        "tool_calling": False,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": True,
        "multimodality": False,
        "latency": 500,
        "cost_per_1k": 0.0002,
        "quality_score": 3.4,
        "context_window": 128000,
    },
    {
        "model_id": "amazon.nova-micro-v1:0",
        "provider": "Amazon",
        "display_name": "Nova Micro",
        "reasoning": False,
        "tool_calling": False,
        "summarization": True,
        "structured_output": False,
        "rag": False,
        "vision": False,
        "multimodality": False,
        "latency": 300,
        "cost_per_1k": 0.0001,
        "quality_score": 2.8,
        "context_window": 128000,
    },
    # ── Mistral AI ──────────────────────────────────────────
    {
        "model_id": "mistral.mistral-large-2402-v1:0",
        "provider": "Mistral AI",
        "display_name": "Mistral Large",
        "reasoning": True,
        "coding": True,
        "tool_calling": True,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": False,
        "multimodality": False,
        "latency": 1800,
        "cost_per_1k": 0.008,
        "quality_score": 4.3,
        "context_window": 32000,
    },
    {
        "model_id": "mistral.mistral-small-2402-v1:0",
        "provider": "Mistral AI",
        "display_name": "Mistral Small",
        "reasoning": False,
        "tool_calling": True,
        "summarization": True,
        "structured_output": True,
        "rag": False,
        "vision": False,
        "multimodality": False,
        "latency": 600,
        "cost_per_1k": 0.002,
        "quality_score": 3.5,
        "context_window": 32000,
    },
    {
        "model_id": "us.mistral.pixtral-large-2502-v1:0",
        "provider": "Mistral AI",
        "display_name": "Pixtral Large",
        "reasoning": True,
        "coding": True,
        "tool_calling": False,
        "summarization": True,
        "structured_output": False,
        "rag": False,
        "vision": True,
        "multimodality": True,
        "latency": 2000,
        "cost_per_1k": 0.012,
        "quality_score": 4.0,
        "context_window": 128000,
    },
    # ── DeepSeek ────────────────────────────────────────────
    {
        "model_id": "deepseek-ai/deepseek-r1-0528-maas",
        "provider": "DeepSeek",
        "display_name": "DeepSeek R1",
        "reasoning": True,
        "coding": True,
        "tool_calling": False,
        "summarization": True,
        "structured_output": True,
        "rag": False,
        "vision": False,
        "multimodality": False,
        "latency": 3000,
        "cost_per_1k": 0.0014,
        "quality_score": 4.4,
        "context_window": 65536,
    },
    {
        "model_id": "deepseek-ai/deepseek-v3.2-maas",
        "provider": "DeepSeek",
        "display_name": "DeepSeek V3.2",
        "reasoning": True,
        "coding": True,
        "tool_calling": True,
        "summarization": True,
        "structured_output": True,
        "rag": True,
        "vision": False,
        "multimodality": False,
        "latency": 1000,
        "cost_per_1k": 0.00027,
        "quality_score": 4.1,
        "context_window": 65536,
    },
]

# Build legacy lookups for backward compatibility with existing chat endpoint
CAPABILITY_KEYS = [
    "reasoning", "coding", "tool_calling", "summarization", "structured_output",
    "rag", "vision", "multimodality",
]

# Legacy MODEL_MATRIX for backward compat with chat endpoint
MODEL_MATRIX = {}
for entry in MODEL_REGISTRY:
    prov = entry["provider"]
    if prov not in MODEL_MATRIX:
        MODEL_MATRIX[prov] = {}
    for cap in CAPABILITY_KEYS:
        if entry.get(cap, False):
            # Map internal capabilities to public use cases for the API
            use_case_map = {
                "reasoning": "Chat",
                "coding": "Code",
                "vision": "Vision",
                "rag": "RAG",
                "summarization": "Summarization",
                "tool_calling": "Tool Calling",
                "structured_output": "Structured Output"
            }
            use_case = use_case_map.get(cap, cap.replace("_", " "))
            
            # Only store first (highest quality) model per provider+capability
            if use_case not in MODEL_MATRIX[prov]:
                MODEL_MATRIX[prov][use_case] = entry["model_id"]


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


def get_models_by_tags(tags: list[str]) -> list[dict]:
    """Return all models that support ALL the given capability tags."""
    results = []
    for model in MODEL_REGISTRY:
        # Convert tag names to registry keys (e.g., "tool_calling" stays, etc.)
        if all(model.get(tag, False) for tag in tags):
            results.append(model)
    return results


def recommend_model(tags: list[str]) -> dict | None:
    """
    Pick the best model for a set of workload tags.
    Ranking: quality_score DESC → latency ASC → cost_per_1k ASC.
    Avoids reasoning-grade models for summarization-only workloads.
    """
    candidates = get_models_by_tags(tags)
    if not candidates:
        return None

    # If only summarization is requested, prefer non-reasoning models
    is_summarization_only = tags == ["summarization"]

    def sort_key(m):
        # Penalize reasoning models for summarization-only workloads
        quality_penalty = 0
        if is_summarization_only and m.get("reasoning") and m["quality_score"] >= 4:
            quality_penalty = 1  # Drop quality score by 1 for ranking
        return (
            -(m["quality_score"] - quality_penalty),  # Higher is better
            m["latency"],       # Lower is better
            m["cost_per_1k"],   # Lower is better
        )

    candidates.sort(key=sort_key)
    return candidates[0]
