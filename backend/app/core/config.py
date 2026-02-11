from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Ollama
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    OLLAMA_VISION_MODEL: str = "llava:7b"
    # Max tokens to generate (-1 = no limit). Lower = faster replies (e.g. 512, 1024).
    OLLAMA_NUM_PREDICT: int = 1024
    # If True, skip the second LLM call after a tool run and format the result in-code (faster).
    FAST_REPLY: bool = True

    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000

    # Optional prompt overrides (if set, used instead of app/prompts/prompts.json)
    # Use {{message}} and {{allowed_tools}} in vision_propose_tool; {{message}} in vision_analyze.
    PROMPT_VISION_ANALYZE: Optional[str] = None
    PROMPT_VISION_PROPOSE_TOOL: Optional[str] = None

settings = Settings()
