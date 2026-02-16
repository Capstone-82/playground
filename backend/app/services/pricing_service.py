import json
import os

# Load pricing data from JSON
_pricing_path = os.path.join(os.path.dirname(__file__), "..", "..", "model-pricing.json")
with open(_pricing_path, "r") as f:
    PRICING_DATA = json.load(f)


class PricingService:
    """Calculates cost based on model-pricing.json.
    
    Pricing is per 1,000,000 tokens (as defined in the JSON).
    Cost = (input_tokens * input_cost + output_tokens * output_cost) / 1,000,000
    """

    @staticmethod
    def calculate_cost(model_id: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate the cost for a model invocation."""
        # Strip provider prefixes for lookup (e.g., "meta/llama-3.3..." → check as-is first)
        pricing = PRICING_DATA.get(model_id)

        # Try without provider prefix (e.g., "mistral.mistral-small-2402-v1:0")
        if not pricing:
            # Try matching by partial key
            for key, val in PRICING_DATA.items():
                if key in model_id or model_id in key:
                    pricing = val
                    break

        if not pricing:
            return 0.0  # Unknown model, no cost data

        input_cost = pricing.get("input_cost") or 0.0
        output_cost = pricing.get("output_cost") or 0.0
        per_tokens = pricing.get("tokens", 1_000_000)

        cost = (input_tokens * input_cost + output_tokens * output_cost) / per_tokens
        return round(cost, 8)

    @staticmethod
    def get_pricing_info(model_id: str) -> dict:
        """Get raw pricing info for a model."""
        pricing = PRICING_DATA.get(model_id, {})
        if not pricing:
            for key, val in PRICING_DATA.items():
                if key in model_id or model_id in key:
                    return val
        return pricing
