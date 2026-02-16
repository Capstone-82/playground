export const modelMatrix = {
  "Anthropic": { reasoning: "claude-opus-4-6", "tool calling": "claude-sonnet-4-5", summarization: "claude-haiku-4-5", "structured output": "claude-sonnet-4-5", rag: "claude-sonnet-4-5", vision: "claude-opus-4-6", multimodality: "claude-opus-4-6" },
  "Google": { reasoning: "gemini-2.5-pro", "tool calling": "gemini-2.5-flash", summarization: "gemini-2.5-flash-lite", "structured output": "gemini-2.5-pro", rag: "gemini-2.5-pro", vision: "gemini-3-pro-preview", multimodality: "gemini-3-pro-preview" },
  "OpenAI": { reasoning: "gpt-5.2", "tool calling": "gpt-4.1", summarization: "gpt-4.1-mini", "structured output": "gpt-4.1", rag: "gpt-4.1-mini", vision: "gpt-4o", multimodality: "gpt-5.2" },
  "Meta": { reasoning: "meta-llama/llama-3.3-70b-instruct", "tool calling": "meta-llama/llama-3.1-70b-instruct", summarization: "meta-llama/llama-3.1-8b-instruct", "structured output": "meta-llama/llama-3.3-70b-instruct", rag: "meta-llama/llama-3.1-70b-instruct", vision: "meta-llama/llama-3.2-90b-vision-instruct", multimodality: "meta-llama/llama-3.2-90b-vision-instruct" },
  "Amazon": { reasoning: "amazon.nova-premier-v1:0", "tool calling": "amazon.nova-pro-v1:0", summarization: "amazon.titan-text-premier-v1:0", "structured output": "amazon.nova-pro-v1:0", rag: "amazon.nova-lite-v1:0", vision: "amazon.nova-pro-v1:0", multimodality: "amazon.nova-premier-v1:0" },
  "Moonshot AI": { reasoning: "kimi-k2-thinking", "tool calling": "kimi-k2", summarization: "moonshot-v1-128k", "structured output": "kimi-k2", rag: "moonshot-v1-128k", vision: "moonshot-v1-128k-vision-preview", multimodality: "kimi-k2.5" },
  "xAI": { reasoning: "grok-4", "tool calling": "grok-4", summarization: "grok-3", "structured output": "grok-3", rag: "grok-4 + collections", vision: "grok-4", multimodality: "grok-2-image-1212 + grok-4" },
  "Mistral AI": { reasoning: "mistral-large-2411", "tool calling": "mistral-medium-3", summarization: "mistral-small-2503", "structured output": "mistral-medium-3", rag: "mistral-large-2411", vision: "pixtral-large-2411", multimodality: "pixtral-large-2411" },
  "Ollama": { reasoning: "qwen2.5:14b", "tool calling": "qwen2.5:7b", summarization: "qwen2.5:3b", "structured output": "qwen2.5:14b", rag: "qwen2.5:7b", vision: "llava:7b", multimodality: "llava:13b" },
  "DeepSeek": { reasoning: "deepseek-reasoner", "tool calling": "deepseek-chat", summarization: "deepseek-chat", "structured output": "deepseek-reasoner", rag: "deepseek-chat", vision: "N/A", multimodality: "N/A" },
  "GitHub/Microsoft": { reasoning: "gpt-4.1", "tool calling": "gpt-4.1", summarization: "gpt-4.1-mini", "structured output": "gpt-4.1", rag: "gpt-4.1", vision: "gpt-4o-copilot", multimodality: "gpt-4o-copilot" },
  "Xiaomi": { reasoning: "MiLM-6B", "tool calling": "MiLM-6B", summarization: "MiLM-6B", "structured output": "MiLM-6B", rag: "MiLM-6B", vision: "N/A", multimodality: "N/A" },
  "MiniMax": { reasoning: "minimax/abab6-chat", "tool calling": "minimax/abab6-chat", summarization: "minimax/abab5.5-chat", "structured output": "minimax/abab6.5-chat", rag: "minimax/abab6-chat", vision: "N/A", multimodality: "N/A" },
  "NVIDIA": { reasoning: "nvidia/Nemotron-4-340B-Instruct", "tool calling": "nvidia/nemotron-4-15b-instruct-128k", summarization: "nvidia/nemotron-4-15b-instruct-128k", "structured output": "nvidia/Nemotron-4-340B-Instruct", rag: "nvidia/nemotron-4-15b-instruct-128k", vision: "Use NVIDIA VLM NIMs", multimodality: "Combine with NVIDIA VLMs" }
};

export const useCases = [
  "reasoning", "tool calling", "summarization", "structured output", "rag", "vision", "multimodality"
];

// Price per 1 million tokens (Mocked from your PDF)
export const pricingMatrix = {
  "Anthropic": 15.00,
  "Google": 11.25,
  "OpenAI": 10.00,
  "Meta": 0.60,
  "Ollama": 0.00, // Local is free!
  "DeepSeek": 0.27
};