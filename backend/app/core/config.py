import os
from pathlib import Path
from typing import List, Union
import json
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
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            val = self.CORS_ORIGINS.strip()
            if val.startswith("[") and val.endswith("]"):
                try:
                    return json.loads(val)
                except Exception:
                    pass
            if "," in val:
                return [x.strip() for x in val.split(",") if x.strip()]
            return [val] if val else ["*"]
        return ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Ensure storage directory exists
storage_path = Path(settings.STORAGE_DIR)
storage_path.mkdir(parents=True, exist_ok=True)
(storage_path / "uploads").mkdir(exist_ok=True)
(storage_path / "processed").mkdir(exist_ok=True)
