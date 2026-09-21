import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.database import db
from app.api.profiles import router as profiles_router
from app.api.ingestion import router as ingestion_router
from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database and verifying dependencies...")
    db.init_db()
    logger.info("Content Generalised Engine backend ready.")
    yield


app = FastAPI(
    title="Viral Content Reverse-Engineering & Multi-Platform Adaptation Engine",
    description="Ingests viral content, breaks down underlying psychology and narrative pacing, and adapts concepts for client profiles.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 Router Registration
app.include_router(health_router, prefix="/api/v1")
app.include_router(profiles_router, prefix="/api/v1")
app.include_router(ingestion_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")

# Mount static storage for frames & media previews
storage_path = Path(settings.STORAGE_DIR)
storage_path.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(storage_path)), name="static")


@app.get("/")
async def root():
    return {
        "engine": "Viral Content Reverse-Engineering & Multi-Platform Adaptation Engine",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
