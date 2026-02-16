from supabase import create_client, Client
from app.core.config import settings


class SupabaseService:
    """Service for logging telemetry data to Supabase."""

    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    def log_telemetry(self, data: dict) -> dict:
        """Insert a telemetry record into the database."""
        result = self.client.table("telemetry").insert(data).execute()
        return result.data[0] if result.data else {}

    def get_all_telemetry(self) -> list:
        """Fetch all telemetry records, newest first."""
        result = (
            self.client.table("telemetry")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    def get_analytics_summary(self) -> dict:
        """Get aggregated analytics."""
        data = self.get_all_telemetry()

        total_cost = sum(float(r.get("cost", 0) or 0) for r in data)
        total_input = sum(int(r.get("input_tokens", 0) or 0) for r in data)
        total_output = sum(int(r.get("output_tokens", 0) or 0) for r in data)

        return {
            "total_requests": len(data),
            "total_cost": round(total_cost, 6),
            "total_input_tokens": total_input,
            "total_output_tokens": total_output,
            "data": data,
        }


# Singleton instance
supabase_service = SupabaseService()
