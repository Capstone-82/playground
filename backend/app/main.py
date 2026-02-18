from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints.chat import router as chat_router
from app.api.endpoints.analytics import router as analytics_router
from app.api.endpoints.evaluation import router as evaluation_router
from app.api.endpoints.tagging import router as tagging_router

app = FastAPI(title=settings.PROJECT_NAME)

# CORS — allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(analytics_router, prefix="/api", tags=["Analytics"])
app.include_router(evaluation_router, prefix="/api", tags=["Evaluation"])
app.include_router(tagging_router, prefix="/api", tags=["Tagging"])



@app.get("/")
async def root():
    return {
        "message": "AI Cloud Governance API is running",
        "docs": "/docs",
        "providers": ["Google", "OpenAI", "Meta", "Mistral AI", "Amazon"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
