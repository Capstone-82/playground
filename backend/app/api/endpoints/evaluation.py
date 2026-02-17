"""
Evaluation API — run evaluations, generate manual forms, get AI scores.
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    EvalRequest, EvalResponse, EvalResponseItem,
    AIScoreRequest, AIScoreResponse, AIScoreItem,
    ManualScoreFormResponse, ManualScoreFormItem,
    SaveScoresRequest,
)
from app.services.evaluation_service import evaluation_service
import statistics

router = APIRouter()


@router.post("/eval/run", response_model=EvalResponse)
async def run_eval(request: EvalRequest):
    """Run multiple prompts against multiple models."""
    try:
        model_configs = [m.model_dump() for m in request.models]
        results_raw = await evaluation_service.run_evaluation(
            prompts=request.prompts,
            models=model_configs,
            criteria=request.criteria
        )
        
        # Convert to EvalResponseItem
        results = [EvalResponseItem(**r) for r in results_raw]
        
        # Calculate summary metrics per model
        model_stats = {}
        for r in results:
            m_key = f"{r.provider}:{r.model_id}"
            if m_key not in model_stats:
                model_stats[m_key] = {"latencies": [], "costs": [], "tokens": []}
            model_stats[m_key]["latencies"].append(r.metrics["latency_ms"])
            model_stats[m_key]["costs"].append(r.metrics["cost"])
            model_stats[m_key]["tokens"].append(r.metrics["output_tokens"])
            
        summary = {}
        for m_key, stats in model_stats.items():
            summary[m_key] = {
                "avg_latency": round(statistics.mean(stats["latencies"]), 0),
                "avg_cost": round(statistics.mean(stats["costs"]), 6),
                "avg_tokens": round(statistics.mean(stats["tokens"]), 0)
            }
            
        return EvalResponse(results=results, summary_metrics=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/eval/manual-form", response_model=ManualScoreFormResponse)
async def generate_manual_form(metrics: list[str] = ["Correctness", "Relevance", "Clarity", "Completeness"]):
    """Generate a structured manual scoring form for the given metrics."""
    form_items = evaluation_service.generate_manual_form(metrics)
    return ManualScoreFormResponse(
        manual_review_form=[ManualScoreFormItem(**item) for item in form_items]
    )


@router.post("/eval/ai-score", response_model=AIScoreResponse)
async def ai_score(request: AIScoreRequest):
    """Get AI Judge scores (1-5 scale) with justifications for a response."""
    try:
        scores = await evaluation_service.get_ai_scores(
            prompt=request.prompt,
            response=request.response,
            metrics=request.metrics,
            judge_provider=request.judge_provider,
            judge_model=request.judge_model,
        )
        return AIScoreResponse(
            ai_evaluation=[AIScoreItem(**s) for s in scores]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/eval/save-scores")
async def save_scores(request: SaveScoresRequest):
    """Save manual scores for a prompt/model combination."""
    # In a production system, this would persist to a database.
    # For now, return the computed average score.
    scores = [s.score for s in request.scores if s.score > 0]
    avg = round(sum(scores) / len(scores), 1) if scores else 0
    return {
        "status": "saved",
        "prompt": request.prompt,
        "model_id": request.model_id,
        "avg_score": avg,
        "total_metrics": len(request.scores),
    }
