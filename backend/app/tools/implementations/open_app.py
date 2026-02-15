from __future__ import annotations
import json
import os
import subprocess
from pathlib import Path
from typing import Any, Dict

from app.core.config import settings

_DEFAULT_APPS = {
    "spotify": r"C:\Users\Public\Spotify\Spotify.exe",
    "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "vscode": r"C:\Users\%USERNAME%\AppData\Local\Programs\Microsoft VS Code\Code.exe",
}


def _get_allowed_apps() -> Dict[str, str]:
    # File path takes precedence over env JSON
    file_path = (settings.ALLOWED_APPS_FILE or "").strip()
    if file_path:
        p = Path(file_path)
        if p.is_file():
            try:
                with open(p, encoding="utf-8") as f:
                    parsed = json.load(f)
                if isinstance(parsed, dict) and parsed:
                    return {str(k).lower().strip(): str(v) for k, v in parsed.items()}
            except (json.JSONDecodeError, OSError, TypeError):
                pass
    raw = (settings.ALLOWED_APPS or "").strip()
    if not raw or raw == "{}":
        return _DEFAULT_APPS
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict) and parsed:
            return {str(k).lower().strip(): str(v) for k, v in parsed.items()}
    except (json.JSONDecodeError, TypeError):
        pass
    return _DEFAULT_APPS


def open_app(args: Dict[str, Any]) -> Dict[str, Any]:
    allowed = _get_allowed_apps()
    app = (args.get("app") or "").lower().strip()
    if app not in allowed:
        return {"ok": False, "error": f"App '{app}' not allowed."}

    # Expand environment variables like %USERNAME% in paths
    path = os.path.expandvars(allowed[app])
    try:
        subprocess.Popen(path, shell=False)
        return {"ok": True, "message": f"Opened {app}."}
    except Exception as e:
        return {"ok": False, "error": str(e)}