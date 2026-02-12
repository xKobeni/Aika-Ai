from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # ignore extra env vars (e.g. FISH_API_KEY) not used by this app
    )

    # Ollama
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    OLLAMA_VISION_MODEL: str = "llava:7b"
    # Max tokens to generate (-1 = no limit). Lower = faster (e.g. 256, 512).
    OLLAMA_NUM_PREDICT: int = 256
    # Context window size. Smaller = faster (e.g. 2048, 4096). 0 = use Ollama default.
    OLLAMA_NUM_CTX: int = 2048
    # If True, skip the second LLM call after a tool run and format the result in-code (faster).
    FAST_REPLY: bool = True
    # Conversation turns to keep in context (fewer = faster inference).
    CHAT_MAX_HISTORY_TURNS: int = 4
    # If True, use a shorter system prompt for faster first-token (less personality detail).
    CHAT_FAST_PROMPT: bool = True

    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000

    # Optional prompt overrides (if set, used instead of app/prompts/prompts.json)
    # Use {{message}} and {{allowed_tools}} in vision_propose_tool; {{message}} in vision_analyze.
    PROMPT_VISION_ANALYZE: Optional[str] = None
    PROMPT_VISION_PROPOSE_TOOL: Optional[str] = None

settings = Settings()
