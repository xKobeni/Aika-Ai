from __future__ import annotations
import os
import subprocess
from typing import Any, Dict

ALLOWED_APPS = {
    "spotify": r"C:\Users\Public\Spotify\Spotify.exe",  # example placeholder
    "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "vscode": r"C:\Users\%USERNAME%\AppData\Local\Programs\Microsoft VS Code\Code.exe",
}


def open_app(args: Dict[str, Any]) -> Dict[str, Any]:
    app = (args.get("app") or "").lower().strip()
    if app not in ALLOWED_APPS:
        return {"ok": False, "error": f"App '{app}' not allowed."}

    # Expand environment variables like %USERNAME% in paths
    path = os.path.expandvars(ALLOWED_APPS[app])
    try:
        subprocess.Popen(path, shell=False)
        return {"ok": True, "message": f"Opened {app}."}
    except Exception as e:
        return {"ok": False, "error": str(e)}