// ── Model Registry (mirrors backend MODEL_REGISTRY) ───────
// Each model has capability flags, cost, latency, quality metadata.

export const modelRegistry = [
  // Google
  { model_id: "gemini-2.5-pro", provider: "Google", display_name: "Gemini 2.5 Pro", reasoning: true, coding: true, tool_calling: true, summarization: true, structured_output: true, rag: true, vision: true, multimodality: true, latency: 2200, cost_per_1k: 0.01125, quality_score: 4.7, context_window: 1048576 },
  { model_id: "gemini-2.5-flash", provider: "Google", display_name: "Gemini 2.5 Flash", reasoning: true, coding: true, tool_calling: true, summarization: true, structured_output: true, rag: true, vision: true, multimodality: true, latency: 800, cost_per_1k: 0.0015, quality_score: 4.2, context_window: 1048576 },
  { model_id: "gemini-1.5-flash-8b", provider: "Google", display_name: "Gemini 1.5 Flash-8B", reasoning: false, coding: false, tool_calling: false, summarization: true, structured_output: true, rag: false, vision: false, multimodality: false, latency: 400, cost_per_1k: 0.0003, quality_score: 3.5, context_window: 1048576 },
  
  // OpenAI
  { model_id: "gpt-4o", provider: "OpenAI", display_name: "GPT-4o", reasoning: true, coding: true, tool_calling: true, summarization: true, structured_output: true, rag: true, vision: true, multimodality: true, latency: 1500, cost_per_1k: 0.01, quality_score: 4.5, context_window: 128000 },
  { model_id: "gpt-4o-mini", provider: "OpenAI", display_name: "GPT-4o Mini", reasoning: true, coding: true, tool_calling: true, summarization: true, structured_output: true, rag: true, vision: true, multimodality: false, latency: 600, cost_per_1k: 0.00015, quality_score: 3.8, context_window: 128000 },
  { model_id: "o1-preview", provider: "OpenAI", display_name: "o1 Preview", reasoning: true, coding: true, tool_calling: false, summarization: true, structured_output: true, rag: true, vision: false, multimodality: false, latency: 5000, cost_per_1k: 0.015, quality_score: 4.8, context_window: 128000 },
  { model_id: "o1-mini", provider: "OpenAI", display_name: "o1 Mini", reasoning: true, coding: true, tool_calling: false, summarization: true, structured_output: true, rag: true, vision: false, multimodality: false, latency: 1500, cost_per_1k: 0.003, quality_score: 4.4, context_window: 128000 },
  
  // Meta
  { model_id: "meta/llama-3.3-70b-instruct-maas", provider: "Meta", display_name: "Llama 3.3 70B Instruct", reasoning: true, coding: true, tool_calling: true, summarization: true, structured_output: true, rag: true, vision: false, multimodality: false, latency: 1200, cost_per_1k: 0.0006, quality_score: 4.0, context_window: 131072 },
  { model_id: "meta/llama-4-scout-17b-16e-instruct-maas", provider: "Meta", display_name: "Llama 4 Scout 17B", reasoning: true, coding: true, tool_calling: false, summarization: true, structured_output: false, rag: false, vision: true, multimodality: true, latency: 900, cost_per_1k: 0.0004, quality_score: 3.6, context_window: 131072 },
  
  // Amazon
  { model_id: "amazon.nova-pro-v1:0", provider: "Amazon", display_name: "Nova Pro", reasoning: true, coding: true, tool_calling: true, summarization: true, structured_output: true, rag: true, vision: true, multimodality: true, latency: 1400, cost_per_1k: 0.0008, quality_score: 4.1, context_window: 128000 },
  { model_id: "amazon.nova-lite-v1:0", provider: "Amazon", display_name: "Nova Lite", reasoning: false, tool_calling: false, summarization: true, structured_output: true, rag: true, vision: true, multimodality: false, latency: 500, cost_per_1k: 0.0002, quality_score: 3.4, context_window: 128000 },
  { model_id: "amazon.nova-micro-v1:0", provider: "Amazon", display_name: "Nova Micro", reasoning: false, tool_calling: false, summarization: true, structured_output: false, rag: false, vision: false, multimodality: false, latency: 300, cost_per_1k: 0.0001, quality_score: 2.8, context_window: 128000 },
  
  // Mistral AI
  { model_id: "mistral.mistral-large-2402-v1:0", provider: "Mistral AI", display_name: "Mistral Large", reasoning: true, coding: true, tool_calling: true, summarization: true, structured_output: true, rag: true, vision: false, multimodality: false, latency: 1800, cost_per_1k: 0.008, quality_score: 4.3, context_window: 32000 },
  { model_id: "mistral.mistral-small-2402-v1:0", provider: "Mistral AI", display_name: "Mistral Small", reasoning: false, tool_calling: true, summarization: true, structured_output: true, rag: false, vision: false, multimodality: false, latency: 600, cost_per_1k: 0.002, quality_score: 3.5, context_window: 32000 },
  { model_id: "us.mistral.pixtral-large-2502-v1:0", provider: "Mistral AI", display_name: "Pixtral Large", reasoning: true, coding: true, tool_calling: false, summarization: true, structured_output: false, rag: false, vision: true, multimodality: true, latency: 2000, cost_per_1k: 0.012, quality_score: 4.0, context_window: 128000 },
  
  // DeepSeek
  { model_id: "deepseek-ai/deepseek-r1-0528-maas", provider: "DeepSeek", display_name: "DeepSeek R1", reasoning: true, coding: true, tool_calling: false, summarization: true, structured_output: true, rag: false, vision: false, multimodality: false, latency: 3000, cost_per_1k: 0.0014, quality_score: 4.4, context_window: 65536 },
  { model_id: "deepseek-ai/deepseek-v3.2-maas", provider: "DeepSeek", display_name: "DeepSeek V3.2", reasoning: true, coding: true, tool_calling: true, summarization: true, structured_output: true, rag: true, vision: false, multimodality: false, latency: 1000, cost_per_1k: 0.00027, quality_score: 4.1, context_window: 65536 },
];

// ── Capability tag definitions ────────────────────────────
export const capabilityKeys = [
  "reasoning", "coding", "tool_calling", "summarization", "structured_output",
  "rag", "vision", "multimodality",
];

// ── Providers list ────────────────────────────────────────
export const providers = [
  "All", "Amazon", "Meta", "Mistral AI", "Google", "OpenAI", "DeepSeek",
];

export const useCaseTags = ["All", "Chat", "Code", "RAG", "Vision", "Summarization", "Tool Calling", "Structured Output"];

// ── Helper: get capability badges for a model ─────────────
export const getCapabilityBadges = (model) => {
  return capabilityKeys.filter(k => model[k]);
};

// ── Helper: group registry by provider ────────────────────
export const getModelsByProvider = () => {
  const grouped = {};
  for (const m of modelRegistry) {
    if (!grouped[m.provider]) grouped[m.provider] = [];
    grouped[m.provider].push(m);
  }
  return grouped;
};

// ── Legacy compat: modelMatrix for Playground sidebar ─────
export const modelMatrix = {};
for (const entry of modelRegistry) {
  if (!modelMatrix[entry.provider]) modelMatrix[entry.provider] = {};
  const caps = capabilityKeys.filter(k => entry[k]);
  for (const cap of caps) {
    if (!modelMatrix[entry.provider][cap]) {
      modelMatrix[entry.provider][cap] = {
        id: entry.model_id,
        tags: [
          entry.provider.toUpperCase(),
          `${Math.round(entry.context_window / 1000)}k Context`,
          ...caps.map(c => c.replace('_', ' ').toUpperCase()),
        ],
      };
    }
  }
}

// Price per 1 million tokens (legacy)
export const pricingMatrix = {
  Google: 11.25,
  OpenAI: 10.0,
  Meta: 0.6,
  Amazon: 0.8,
  DeepSeek: 0.27,
  "Mistral AI": 8.0,
};
