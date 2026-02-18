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

Your task is to evaluate a model-generated response and the quality of the original prompt.

You will be provided with:
1. The original user prompt
2. The model-generated response
3. A list of evaluation metrics selected by the user

Instructions:
1. MANDATORY PROMPT ANALYSIS: First, analyze the original prompt. Evaluate how clear, detailed, and well-structured it is. Provide a score for "Prompt Quality" (1-5).
2. RESPONSE EVALUATION: Then, evaluate the model-generated response based on the "Selected Metrics" provided.
3. Each metric (including Prompt Quality) must be scored on a scale from 1 to 5:
   1 = Very Poor, 2 = Poor, 3 = Average, 4 = Good, 5 = Excellent

Return output strictly in JSON format:
{
  "prompt_analysis": {
    "score": <1-5>,
    "summary": "<brief analysis of the prompt's clarity and detail>"
  },
  "ai_evaluation": [
    {
      "metric": "<metric_name>",
      "score": <1-5>,
      "reason": "<brief justification>"
    }
  ]
}"""


class EvaluationService:
    async def evaluate_prompt(self, prompt: str, judge_provider: str, judge_model: str) -> Dict[str, Any]:
        """Analyze the quality and clarity of the prompt once."""
        analysis_prompt = f"""Evaluate the following prompt for an AI model. 
        How clear, detailed, and well-structured is it? 
        What is the specific intent?

        Prompt: "{prompt}"

        Return output strictly in JSON:
        {{
          "score": <1-5>,
          "summary": "<brief analysis>",
          "clarity": "High/Medium/Low",
          "intent_detected": "<what the user wants>"
        }}"""
        try:
            result = await ai_service.generate(judge_provider, judge_model, analysis_prompt)
            text = result["text"].strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            return json.loads(text)
        except:
            return {"score": 3, "summary": "Prompt could not be analyzed", "clarity": "Unknown", "intent_detected": "Unknown"}

    async def run_evaluation(self, prompts: List[str], models: List[Dict[str, str]], criteria: List[str], judge_cfg: Dict[str, str] = None) -> Dict[str, Any]:
        """Run all prompts against all models in parallel, including a single-pass prompt analysis."""
        
        # 1. Analyze prompts (once per unique prompt)
        prompt_tasks = []
        if judge_cfg:
            for p in prompts:
                prompt_tasks.append(self.evaluate_prompt(p, judge_cfg["judge_provider"], judge_cfg["judge_model"]))
        
        prompt_analyses = await asyncio.gather(*prompt_tasks) if prompt_tasks else [None] * len(prompts)
        prompt_map = {p: analysis for p, analysis in zip(prompts, prompt_analyses)}

        # 2. Run model generations
        tasks = []
        for prompt in prompts:
            for model_cfg in models:
                tasks.append(self._evaluate_single(prompt, model_cfg, criteria, judge_cfg))
        
        results = await asyncio.gather(*tasks)
        
        return {
            "results": results,
            "prompt_metadata": prompt_map
        }

    async def _evaluate_single(self, prompt: str, model_cfg: Dict[str, str], criteria: List[str], judge_cfg: Dict[str, str] = None) -> Dict[str, Any]:
        provider = model_cfg["provider"]
        model_id = model_cfg["model_id"]
        
        try:
            # Generate response
            result = await ai_service.generate(provider, model_id, prompt)
            
            # Calculate cost
            cost = PricingService.calculate_cost(model_id, result["input_tokens"], result["output_tokens"])
            
            # Auto-run AI Judge if requested
            scores = {c: 0 for c in criteria}
            ai_evaluations = None
            prompt_quality = None
            
            if judge_cfg and judge_cfg.get("judge_model") and judge_cfg.get("judge_provider"):
                ai_data = await self.get_ai_scores(
                    prompt=prompt,
                    response=result["text"],
                    metrics=criteria,
                    judge_provider=judge_cfg["judge_provider"],
                    judge_model=judge_cfg["judge_model"]
                )
                ai_evaluations = ai_data["ai_evaluation"]
                prompt_quality = ai_data["prompt_quality"]
                # Map AI scores back to the scores dict
                for item in ai_evaluations:
                    scores[item["metric"]] = item["score"]

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
                "scores": scores,
                "ai_evaluations": ai_evaluations, # Useful for justifications
                "prompt_quality": prompt_quality
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

    async def get_ai_scores(self, prompt: str, response: str, metrics: List[str], judge_provider: str = "Google", judge_model: str = "gemini-2.5-flash") -> Dict[str, Any]:
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
            prompt_analysis = parsed.get("prompt_analysis", {"score": 3, "summary": "Could not analyze prompt"})
            
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
            
            return {
                "prompt_quality": {
                    "score": max(1, min(5, int(prompt_analysis.get("score", 3)))),
                    "summary": prompt_analysis.get("summary", "No summary provided")
                },
                "ai_evaluation": validated
            }
        except json.JSONDecodeError:
            # Return default scores if parsing fails
            return {
                "prompt_quality": {"score": 3, "summary": "AI Judge response could not be parsed"},
                "ai_evaluation": [{"metric": m, "score": 3, "reason": "AI Judge response could not be parsed"} for m in metrics]
            }
        except Exception as e:
            return {
                "prompt_quality": {"score": 0, "summary": f"Error: {str(e)}"},
                "ai_evaluation": [{"metric": m, "score": 0, "reason": f"Error: {str(e)}"} for m in metrics]
            }


evaluation_service = EvaluationService()
