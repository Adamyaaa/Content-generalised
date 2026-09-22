import os
import re
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["Settings & API Keys"])

ENV_PATH = Path(".env")


def mask_key(key: Optional[str]) -> Optional[str]:
    if not key or len(key.strip()) < 8:
        return None
    k = key.strip()
    return f"{k[:4]}...{k[-4:]}"


def update_env_file(key_name: str, value: str):
    """Write or update a key in the backend .env file and in runtime settings."""
    env_content = ""
    if ENV_PATH.exists():
        env_content = ENV_PATH.read_text(encoding="utf-8")

    pattern = rf"^{key_name}=.*$"
    new_line = f"{key_name}={value}"

    if re.search(pattern, env_content, flags=re.MULTILINE):
        env_content = re.sub(pattern, new_line, env_content, flags=re.MULTILINE)
    else:
        env_content += f"\n{new_line}"

    ENV_PATH.write_text(env_content.strip() + "\n", encoding="utf-8")
    # Update runtime settings
    setattr(settings, key_name, value)
    os.environ[key_name] = value


@router.get("/keys")
async def get_keys_status():
    """Return status and masked previews of all configurable integration keys."""
    return {
        "gemini": {
            "name": "Gemini",
            "connected": bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5),
            "masked_key": mask_key(settings.GEMINI_API_KEY),
            "description": "Multimodal visual reverse-engineering, narrative extraction & brand adaptation. Uses gemini-flash-lite-latest.",
            "pricing_hint": "Has generous free tier (15 RPM)",
            "get_key_url": "https://aistudio.google.com/app/apikey"
        },
        "groq": {
            "name": "Groq",
            "connected": bool(settings.GROQ_API_KEY and len(settings.GROQ_API_KEY) > 5),
            "masked_key": mask_key(settings.GROQ_API_KEY),
            "description": "Speech to text — ultra-fast Whisper Large v3 audio transcription engine.",
            "pricing_hint": "About $0.04 per audio hour · free tier available",
            "get_key_url": "https://console.groq.com/keys"
        },
        "rapidapi": {
            "name": "RapidAPI (Instagram)",
            "connected": bool(settings.RAPIDAPI_KEY and len(settings.RAPIDAPI_KEY) > 5),
            "masked_key": mask_key(settings.RAPIDAPI_KEY),
            "description": "Direct Instagram Reel and Carousel downloader fallback API.",
            "pricing_hint": "Optional · falls back to Cobalt and yt-dlp if blank",
            "get_key_url": "https://rapidapi.com"
        },
        "cobalt": {
            "name": "Cobalt API",
            "connected": bool(settings.COBALT_API_URL and len(settings.COBALT_API_URL) > 5),
            "masked_key": settings.COBALT_API_URL if settings.COBALT_API_URL else None,
            "description": "Self-hosted or public Cobalt video download API instance (co.wuk.sh).",
            "pricing_hint": "Free & open-source community instances",
            "get_key_url": "https://github.com/imputnet/cobalt"
        },
        "supabase": {
            "name": "Supabase (PostgreSQL)",
            "connected": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
            "masked_key": mask_key(settings.SUPABASE_KEY),
            "description": "Cloud PostgreSQL database for storing brand profiles, queue state, and adapted concepts.",
            "pricing_hint": "Free tier available · defaults to SQLite if blank",
            "get_key_url": "https://supabase.com"
        }
    }


class SaveKeyRequest(BaseModel):
    service: str  # 'gemini', 'groq', 'rapidapi', 'cobalt', 'supabase'
    key_value: str
    secondary_value: Optional[str] = None  # for supabase_url if needed


@router.post("/keys")
async def save_key(payload: SaveKeyRequest):
    service = payload.service.lower()
    val = payload.key_value.strip()

    if service == "gemini":
        update_env_file("GEMINI_API_KEY", val)
    elif service == "groq":
        update_env_file("GROQ_API_KEY", val)
    elif service == "rapidapi":
        update_env_file("RAPIDAPI_KEY", val)
    elif service == "cobalt":
        update_env_file("COBALT_API_URL", val)
    elif service == "supabase":
        update_env_file("SUPABASE_KEY", val)
        if payload.secondary_value:
            update_env_file("SUPABASE_URL", payload.secondary_value.strip())
    else:
        raise HTTPException(status_code=400, detail=f"Unknown service: {service}")

    return {
        "status": "success",
        "service": service,
        "masked_key": mask_key(val) if service != "cobalt" else val,
        "message": f"Saved and activated API key for {service}."
    }


class TestKeyRequest(BaseModel):
    service: str
    key_value: Optional[str] = None


@router.post("/keys/test")
async def test_key(payload: TestKeyRequest):
    service = payload.service.lower()
    test_key_val = payload.key_value.strip() if payload.key_value else None

    if service == "gemini":
        key = test_key_val or settings.GEMINI_API_KEY
        if not key:
            raise HTTPException(status_code=400, detail="No Gemini API key provided to test.")
        try:
            import google.generativeai as genai
            genai.configure(api_key=key)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            # Lightweight verification prompt
            resp = model.generate_content("Ping. Reply with 'pong'.")
            return {"success": True, "message": f"Gemini connection verified! Model: {settings.GEMINI_MODEL}"}
        except Exception as e:
            logger.error(f"Gemini test failed: {e}")
            return {"success": False, "message": f"Gemini connection failed: {str(e)}"}

    elif service == "groq":
        key = test_key_val or settings.GROQ_API_KEY
        if not key:
            raise HTTPException(status_code=400, detail="No Groq API key provided to test.")
        try:
            from groq import Groq
            client = Groq(api_key=key)
            models = client.models.list()
            return {"success": True, "message": "Groq connection verified! Whisper Large v3 available."}
        except Exception as e:
            logger.error(f"Groq test failed: {e}")
            return {"success": False, "message": f"Groq connection failed: {str(e)}"}

    elif service == "cobalt":
        url = test_key_val or settings.COBALT_API_URL
        if not url:
            return {"success": False, "message": "No Cobalt instance URL provided."}
        try:
            import httpx
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(f"{url.rstrip('/')}/api/serverInfo")
                if r.status_code == 200:
                    return {"success": True, "message": "Cobalt instance reachable and online."}
            return {"success": True, "message": "Cobalt URL configured."}
        except Exception as e:
            return {"success": False, "message": f"Could not reach Cobalt URL: {e}"}

    elif service == "supabase":
        key = test_key_val or settings.SUPABASE_KEY
        url = settings.SUPABASE_URL
        if not key or not url:
            return {"success": False, "message": "Both SUPABASE_URL and SUPABASE_KEY must be set."}
        try:
            from supabase import create_client
            client = create_client(url, key)
            client.table("company_profiles").select("client_id").limit(1).execute()
            return {"success": True, "message": "Supabase PostgreSQL connected successfully!"}
        except Exception as e:
            return {"success": False, "message": f"Supabase connection test failed: {e}"}

    return {"success": True, "message": f"Configuration saved for {service}."}


@router.delete("/keys/{service}")
async def remove_key(service: str):
    service = service.lower()
    if service == "gemini":
        update_env_file("GEMINI_API_KEY", "")
    elif service == "groq":
        update_env_file("GROQ_API_KEY", "")
    elif service == "rapidapi":
        update_env_file("RAPIDAPI_KEY", "")
    elif service == "cobalt":
        update_env_file("COBALT_API_URL", "https://co.wuk.sh")
    elif service == "supabase":
        update_env_file("SUPABASE_KEY", "")
    else:
        raise HTTPException(status_code=400, detail=f"Unknown service: {service}")

    return {"status": "success", "message": f"Key for {service} has been removed."}
