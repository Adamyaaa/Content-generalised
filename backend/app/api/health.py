from fastapi import APIRouter
from app.core.config import settings
from app.core.ffmpeg_utils import get_ffmpeg_executable

router = APIRouter(tags=["System Health"])


@router.get("/health")
async def health_check():
    ffmpeg_ok = False
    ffmpeg_path = ""
    try:
        ffmpeg_path = get_ffmpeg_executable()
        ffmpeg_ok = True
    except Exception as e:
        ffmpeg_path = str(e)

    return {
        "status": "healthy",
        "service": "Viral Content Reverse-Engineering & Adaptation Engine",
        "gemini_model": settings.GEMINI_MODEL,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "groq_configured": bool(settings.GROQ_API_KEY),
        "rapidapi_configured": bool(settings.RAPIDAPI_KEY),
        "cobalt_configured": bool(settings.COBALT_API_URL),
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
        "ffmpeg_status": "available" if ffmpeg_ok else "unavailable",
        "ffmpeg_path": ffmpeg_path
    }
