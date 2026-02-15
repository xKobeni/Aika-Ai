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
    # Context window size. Smaller = faster first token (e.g. 1024, 2048). 0 = use Ollama default.
    OLLAMA_NUM_CTX: int = 1024
    # If True, skip the second LLM call after a tool run and format the result in-code (faster).
    FAST_REPLY: bool = True
    # Conversation turns to keep in context (fewer = faster inference).
    CHAT_MAX_HISTORY_TURNS: int = 3
    # If True, use a shorter system prompt for faster first-token (less personality detail).
    CHAT_FAST_PROMPT: bool = True
    # If True, automatically learn facts/preferences from conversations.
    AUTO_LEARN_ENABLED: bool = True
    # Minimum confidence (0.0-1.0) for auto-learned facts to be saved.
    AUTO_LEARN_CONFIDENCE_THRESHOLD: float = 0.7

    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000

    # Optional prompt overrides (if set, used instead of app/prompts/prompts.json)
    # Use {{message}} and {{allowed_tools}} in vision_propose_tool; {{message}} in vision_analyze.
    PROMPT_VISION_ANALYZE: Optional[str] = None
    PROMPT_VISION_PROPOSE_TOOL: Optional[str] = None

    # --- Paths (leave empty to use defaults under backend/data/ or backend root) ---
    # SQLite database file path.
    DB_PATH: Optional[str] = None
    # Directory for uploaded images (vision).
    UPLOAD_DIR: Optional[str] = None
    # Comma-separated image extensions allowed for uploads (e.g. .png,.jpg,.jpeg,.webp,.bmp).
    UPLOAD_ALLOWED_EXTENSIONS: str = ".png,.jpg,.jpeg,.webp,.bmp"
    # File-ops sandbox base directory (writable by the app).
    FILE_OPS_SAFE_BASE_DIR: Optional[str] = None
    # Comma-separated user folder names allowed for search/read (e.g. Documents,Desktop,Downloads).
    FILE_OPS_USER_FOLDERS: str = "Documents,Desktop,Downloads"

    # --- Limits ---
    # How many messages to load from DB per session for chat context (match history turns * 2).
    CHAT_HISTORY_FETCH_LIMIT: int = 8
    # File search: default and max for max_results.
    FILE_OPS_SEARCH_MAX_RESULTS_DEFAULT: int = 100
    FILE_OPS_SEARCH_MAX_RESULTS_CAP: int = 500
    # Web search: default and max for max_results.
    WEB_SEARCH_MAX_RESULTS_DEFAULT: int = 5
    WEB_SEARCH_MAX_RESULTS_CAP: int = 10

    # --- Open app ---
    # JSON object of app_name -> executable path. Leave empty "{}" to use code defaults.
    # Paths can use %USERNAME% etc. on Windows.
    ALLOWED_APPS: str = "{}"
    # Optional: path to a JSON file with same structure. If set, overrides ALLOWED_APPS.
    ALLOWED_APPS_FILE: Optional[str] = None

settings = Settings()
