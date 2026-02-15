# Environment overrides

All of these can be set in `backend/.env` (copy from `env.example`). Leave a variable unset or empty to use the default.

---

## Ollama / LLM

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `llama3.1:8b` | Chat model name |
| `OLLAMA_VISION_MODEL` | `llava:7b` | Model for image/vision |
| `OLLAMA_NUM_PREDICT` | `256` | Max tokens to generate (`-1` = no limit) |
| `OLLAMA_NUM_CTX` | `2048` | Context window size; `0` = Ollama default |

---

## Chat / agent

| Variable | Default | Description |
|----------|---------|-------------|
| `FAST_REPLY` | `true` | Skip extra LLM call after tool use; format in code |
| `CHAT_MAX_HISTORY_TURNS` | `4` | Conversation turns kept in context for the model |
| `CHAT_HISTORY_FETCH_LIMIT` | `12` | Messages loaded from DB per session |
| `CHAT_FAST_PROMPT` | `true` | Shorter system prompt for faster first token |

---

## Auto-learn (memory)

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTO_LEARN_ENABLED` | `true` | Learn facts/preferences from conversations |
| `AUTO_LEARN_CONFIDENCE_THRESHOLD` | `0.7` | Min confidence (0.0–1.0) to save a learned fact |

---

## Server

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_HOST` | `0.0.0.0` | Bind address |
| `SERVER_PORT` | `8000` | HTTP port |

---

## Prompt overrides

| Variable | Default | Description |
|----------|---------|-------------|
| `PROMPT_VISION_ANALYZE` | *(empty)* | Override vision-analysis prompt; use `{{message}}` |
| `PROMPT_VISION_PROPOSE_TOOL` | *(empty)* | Override “propose tool from image” prompt; use `{{message}}` and `{{allowed_tools}}` |

---

## Paths

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | *(empty → backend/data/sqlite/aika.db)* | SQLite database path |
| `UPLOAD_DIR` | *(empty → backend/data/uploads)* | Directory for uploaded images |
| `UPLOAD_ALLOWED_EXTENSIONS` | `.png,.jpg,.jpeg,.webp,.bmp` | Allowed image extensions (comma-separated) |
| `FILE_OPS_SAFE_BASE_DIR` | *(empty → backend/data/user_files)* | Sandbox base for file_ops read/write/list/mkdir |
| `FILE_OPS_USER_FOLDERS` | `Documents,Desktop,Downloads` | User folders allowed for search/read (comma-separated names under home) |

---

## Limits

| Variable | Default | Description |
|----------|---------|-------------|
| `FILE_OPS_SEARCH_MAX_RESULTS_DEFAULT` | `100` | Default `max_results` for file search |
| `FILE_OPS_SEARCH_MAX_RESULTS_CAP` | `500` | Max `max_results` for file search |
| `WEB_SEARCH_MAX_RESULTS_DEFAULT` | `5` | Default `max_results` for web search |
| `WEB_SEARCH_MAX_RESULTS_CAP` | `10` | Max `max_results` for web search |

---

## Open app

| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_APPS` | `{}` | JSON: `{"app_name": "path/to/exe", ...}`. Empty = use code defaults. Paths can use `%USERNAME%` etc. on Windows. |
| `ALLOWED_APPS_FILE` | *(empty)* | Path to a JSON file with the same structure. If set and file exists, overrides `ALLOWED_APPS`. Useful to avoid escaping JSON in `.env`. |

Example (Windows, in `.env`):

```env
ALLOWED_APPS={"spotify":"C:\\Users\\Public\\Spotify\\Spotify.exe","chrome":"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","vscode":"C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"}
```

Or use a file:

```env
ALLOWED_APPS_FILE=C:\aika\allowed_apps.json
```

---

## Where defaults live

- **Config:** `app/core/config.py`
- **Example env:** `env.example`
