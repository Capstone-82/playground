"""
Evaluation Service — parallel evaluation, AI Judge scoring, and manual form generation.
"""
import asyncio
import json
from typing import List, Dict, Any
from app.services.ai_service import ai_service
from app.services.pricing_service import PricingService


# ── AI Judge System Prompt ─────────────────────────────────
AI_JUDGE_PROMPT = """You are an AI Evaluation Judge inside an Enterprise AI Governance Platform.

Your task is to evaluate a model-generated response based on the user-selected scoring metrics.

You will be provided with:

1. The original user prompt
2. The model-generated response
3. A list of evaluation metrics selected by the user

Each selected metric must be scored independently on a scale from 1 to 5:

1 = Very Poor
2 = Poor
3 = Average
4 = Good
5 = Excellent

Instructions:

- Evaluate ONLY the provided response.
- Score ONLY the metrics listed in the Selected Metrics input.
- If a custom metric is included (e.g. Latency, Tone, Compliance), interpret its relevance logically.
- Do NOT assume any metric that is not listed.
- Provide a short justification for each score.

Return output strictly in JSON format:

{
  "ai_evaluation": [
    {
      "metric": "<metric_name>",
      "score": <1-5>,
      "reason": "<brief justification>"
    }
  ]
}"""


class EvaluationService:
    async def run_evaluation(self, prompts: List[str], models: List[Dict[str, str]], criteria: List[str]) -> List[Dict[str, Any]]:
        """Run all prompts against all models in parallel."""
        tasks = []
        for prompt in prompts:
            for model_cfg in models:
                tasks.append(self._evaluate_single(prompt, model_cfg, criteria))
        
        results = await asyncio.gather(*tasks)
        return results

    async def _evaluate_single(self, prompt: str, model_cfg: Dict[str, str], criteria: List[str]) -> Dict[str, Any]:
        provider = model_cfg["provider"]
        model_id = model_cfg["model_id"]
        
        try:
            # Generate response
            result = await ai_service.generate(provider, model_id, prompt)
            
            # Calculate cost
            cost = PricingService.calculate_cost(model_id, result["input_tokens"], result["output_tokens"])
            
            return {
                "prompt": prompt,
                "provider": provider,
                "model_id": model_id,
                "response": result["text"],
                "metrics": {
                    "input_tokens": result["input_tokens"],
                    "output_tokens": result["output_tokens"],
                    "cost": cost,
                    "latency_ms": result["latency_ms"]
                },
                "scores": {c: 0 for c in criteria}  # Placeholder for manual/AI scoring
            }
        except Exception as e:
            return {
                "prompt": prompt,
                "provider": provider,
                "model_id": model_id,
                "response": f"Error: {str(e)}",
                "metrics": {"input_tokens": 0, "output_tokens": 0, "cost": 0, "latency_ms": 0},
                "scores": {}
            }

    def generate_manual_form(self, metrics: List[str]) -> List[Dict[str, str]]:
        """Generate a structured manual scoring form for the given metrics."""
        return [
            {"metric": m, "score_range": "1-5", "comment": ""}
            for m in metrics
        ]

    async def get_ai_scores(self, prompt: str, response: str, metrics: List[str], judge_provider: str = "Google", judge_model: str = "gemini-2.5-flash") -> List[Dict[str, Any]]:
        """Use AI Judge to score the response on a 1-5 scale with justifications."""
        judge_input = f"""{AI_JUDGE_PROMPT}

User Prompt:
{prompt}

Model Response:
{response}

Selected Metrics:
{json.dumps(metrics)}"""

        try:
            result = await ai_service.generate(judge_provider, judge_model, judge_input)
            
            # Parse the JSON response
            text = result["text"].strip()
            # Handle markdown code blocks
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            
            parsed = json.loads(text)
            evaluations = parsed.get("ai_evaluation", [])
            
            # Validate and clamp scores to 1-5
            validated = []
            for item in evaluations:
                score = max(1, min(5, int(item.get("score", 3))))
                validated.append({
                    "metric": item.get("metric", "Unknown"),
                    "score": score,
                    "reason": item.get("reason", "No justification provided"),
                })
            
            # Add any missing metrics with default scores
            scored_metrics = {v["metric"] for v in validated}
            for m in metrics:
                if m not in scored_metrics:
                    validated.append({"metric": m, "score": 3, "reason": "Could not evaluate"})
            
            return validated
        except json.JSONDecodeError:
            # Return default scores if parsing fails
            return [{"metric": m, "score": 3, "reason": "AI Judge response could not be parsed"} for m in metrics]
        except Exception as e:
            return [{"metric": m, "score": 0, "reason": f"Error: {str(e)}"} for m in metrics]


evaluation_service = EvaluationService()
