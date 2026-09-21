import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-lite-latest"
    GROQ_API_KEY: str = ""
    RAPIDAPI_KEY: str = ""
    COBALT_API_URL: str = "https://co.wuk.sh"
    
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    DATABASE_URL: str = ""
    
    PORT: int = 8000
    STORAGE_DIR: str = "./storage"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Ensure storage directory exists
storage_path = Path(settings.STORAGE_DIR)
storage_path.mkdir(parents=True, exist_ok=True)
(storage_path / "uploads").mkdir(exist_ok=True)
(storage_path / "processed").mkdir(exist_ok=True)
