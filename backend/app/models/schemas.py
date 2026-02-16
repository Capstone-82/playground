from pydantic import BaseModel
from typing import Optional, Dict, Any


class ChatRequest(BaseModel):
    provider: str
    use_case: str
    prompt: str
    model_id: Optional[str] = None  # Override auto-selected model


class ChatResponse(BaseModel):
    response: str
    provider: str
    model_id: str
    use_case: str
    metrics: Dict[str, Any]


class AnalyticsResponse(BaseModel):
    total_requests: int
    total_cost: float
    total_input_tokens: int
    total_output_tokens: int
    data: list
