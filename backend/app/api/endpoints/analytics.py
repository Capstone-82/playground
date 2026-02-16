from fastapi import APIRouter
from app.services.supabase_service import supabase_service

router = APIRouter()


@router.get("/analytics")
async def get_analytics():
    """Get aggregated analytics from Supabase telemetry."""
    return supabase_service.get_analytics_summary()


@router.get("/analytics/history")
async def get_history():
    """Get raw telemetry history."""
    return supabase_service.get_all_telemetry()
