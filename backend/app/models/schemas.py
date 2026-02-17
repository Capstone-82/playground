from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class ChatRequest(BaseModel):
    provider: str
    use_case: str
    prompt: str
    model_id: Optional[str] = None  # Override auto-selected model
    auto_select: bool = False       # Enable workload-based auto-selection


class ChatResponse(BaseModel):
    response: str
    provider: str
    model_id: str
    use_case: str
    metrics: Dict[str, Any]
    workload_tags: Optional[List[str]] = None  # Tags detected during auto-select


class AnalyticsResponse(BaseModel):
    total_requests: int
    total_cost: float
    total_input_tokens: int
    total_output_tokens: int
    data: list


class EvalModelConfig(BaseModel):
    provider: str
    model_id: str


class EvalRequest(BaseModel):
    prompts: list[str]
    models: list[EvalModelConfig]
    criteria: list[str] = ["Correctness", "Relevance", "Clarity", "Completeness"]


class EvalResponseItem(BaseModel):
    prompt: str
    provider: str
    model_id: str
    response: str
    metrics: Dict[str, Any]
    scores: Optional[Dict[str, float]] = None


class EvalResponse(BaseModel):
    results: list[EvalResponseItem]
    summary_metrics: Dict[str, Any] = {}


# ── Tagging & Model Selection Schemas ──────────────────────

class ClassifyPromptRequest(BaseModel):
    prompt_text: str


class ClassifyPromptResponse(BaseModel):
    tags: List[str]


class RecommendModelRequest(BaseModel):
    tags: List[str]


class RecommendModelResponse(BaseModel):
    recommended_model: str
    provider: str
    display_name: str
    quality_score: float
    cost_per_1k: float
    latency: int


class ModelRegistryEntry(BaseModel):
    model_id: str
    provider: str
    display_name: str
    reasoning: bool
    tool_calling: bool
    summarization: bool
    structured_output: bool
    rag: bool
    vision: bool
    multimodality: bool
    latency: int
    cost_per_1k: float
    quality_score: float
    context_window: int


# ── Scoring Schemas ────────────────────────────────────────

class ManualScoreFormItem(BaseModel):
    metric: str
    score_range: str = "1-5"
    comment: str = ""


class ManualScoreFormResponse(BaseModel):
    manual_review_form: List[ManualScoreFormItem]


class AIScoreRequest(BaseModel):
    prompt: str
    response: str
    metrics: List[str] = ["Correctness", "Relevance", "Clarity", "Completeness"]
    judge_model: str = "gemini-2.5-flash"
    judge_provider: str = "Google"


class AIScoreItem(BaseModel):
    metric: str
    score: int
    reason: str


class AIScoreResponse(BaseModel):
    ai_evaluation: List[AIScoreItem]


class ManualScoreSubmission(BaseModel):
    metric: str
    score: int  # 1-5
    comment: str = ""


class SaveScoresRequest(BaseModel):
    prompt: str
    provider: str
    model_id: str
    scores: List[ManualScoreSubmission]
