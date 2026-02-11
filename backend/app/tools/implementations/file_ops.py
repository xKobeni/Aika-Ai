from __future__ import annotations
import fnmatch
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# backend/data/user_files/ (same base as other app data, under backend)
BACKEND_ROOT = Path(__file__).resolve().parents[3]
SAFE_BASE_DIR = BACKEND_ROOT / "data" / "user_files"
SAFE_BASE_DIR.mkdir(parents=True, exist_ok=True)

# User folders we are allowed to search and read: Documents, Desktop, Downloads
def _get_user_folders() -> List[Path]:
    home = Path.home()
    return [
        home / "Documents",
        home / "Desktop",
        home / "Downloads",
    ]

def _is_allowed_user_path(file_path: Path) -> Tuple[bool, Optional[Path]]:
    """Check if path is under one of the allowed user folders. Returns (allowed, root_used)."""
    try:
        resolved = file_path.resolve()
        if not resolved.is_file():
            return False, None
        for root in _get_user_folders():
            try:
                root_resolved = root.resolve()
                if root_resolved in resolved.parents or resolved == root_resolved:
                    return True, root_resolved
            except OSError:
                continue
        return False, None
    except (OSError, RuntimeError):
        return False, None

def _resolve_user_file(path_str: str) -> Optional[Path]:
    """
    Resolve path to a file under Documents, Desktop, or Downloads.
    path_str can be: full path, or relative like "Documents/foo.txt", "Desktop/bar.txt".
    Returns None if not allowed or not found.
    """
    raw = (path_str or "").strip()
    if not raw:
        return None
    candidate = Path(raw)
    if not candidate.is_absolute():
        home = Path.home()
        for folder in _get_user_folders():
            trial = (folder / raw).resolve()
            if trial.is_file():
                allowed, _ = _is_allowed_user_path(trial)
                if allowed:
                    return trial
        # try path relative to home
        trial = (home / raw).resolve()
        if trial.is_file():
            allowed, _ = _is_allowed_user_path(trial)
            if allowed:
                return trial
        return None
    try:
        resolved = candidate.resolve()
        if resolved.is_file():
            allowed, _ = _is_allowed_user_path(resolved)
            if allowed:
                return resolved
    except (OSError, RuntimeError):
        pass
    return None

def _resolve_safe(path_str: str) -> Path:
    """
    Resolve user path relative to SAFE_BASE_DIR and prevent path traversal.
    """
    rel = (path_str or "").strip().lstrip("/\\")
    candidate = (SAFE_BASE_DIR / rel).resolve()
    if SAFE_BASE_DIR not in candidate.parents and candidate != SAFE_BASE_DIR:
        raise ValueError("Access denied: path outside safe directory.")
    return candidate

def file_ops(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    args:
      - op: "read" | "write" | "list" | "mkdir" | "search_user" | "read_user"
      - path: string (required for read/write/mkdir/read_user, optional for list)
      - content: string (required for write)
      - query: string (optional, for search_user: filename or glob e.g. "*.txt")
      - recursive: bool (optional, for search_user, default true)
      - max_results: int (optional, for search_user, default 100)
    """
    op = (args.get("op") or "").strip().lower()
    path = (args.get("path") or "").strip()

    try:
        if op == "search_user":
            query = (args.get("query") or "").strip()
            recursive = args.get("recursive", True)
            max_results = max(1, min(500, int(args.get("max_results", 100))))
            items: List[Dict[str, Any]] = []
            for root in _get_user_folders():
                if not root.exists() or not root.is_dir():
                    continue
                try:
                    it = root.rglob("*") if recursive else root.iterdir()
                    for p in it:
                        if len(items) >= max_results:
                            break
                        if not p.is_file():
                            continue
                        try:
                            pr = p.resolve()
                            rr = root.resolve()
                            if rr not in pr.parents and pr != rr:
                                continue
                        except (OSError, RuntimeError):
                            continue
                        name = p.name
                        if query:
                            if "*" in query or "?" in query:
                                if not fnmatch.fnmatch(name.lower(), query.lower()):
                                    continue
                            elif query.lower() not in name.lower():
                                continue
                        try:
                            items.append({
                                "path": str(p),
                                "name": name,
                                "folder": root.name,
                                "size": p.stat().st_size,
                            })
                        except OSError:
                            continue
                except OSError:
                    continue
                if len(items) >= max_results:
                    break
            return {
                "ok": True,
                "scope": "Documents, Desktop, Downloads",
                "query": query or "(all files)",
                "count": len(items),
                "max_results": max_results,
                "items": items,
            }

        if op == "read_user":
            if not path:
                return {"ok": False, "error": "Missing 'path' for read_user."}
            target = _resolve_user_file(path)
            if not target:
                return {"ok": False, "error": "File not found or not in Documents, Desktop, or Downloads."}
            try:
                content = target.read_text(encoding="utf-8", errors="replace")
            except OSError as e:
                return {"ok": False, "error": f"Cannot read file: {e}"}
            return {"ok": True, "path": str(target), "content": content}

        if op == "list":
            target = _resolve_safe(path) if path else SAFE_BASE_DIR
            if not target.exists():
                return {"ok": False, "error": "Directory not found."}
            if not target.is_dir():
                return {"ok": False, "error": "Target is not a directory."}

            items: List[Dict[str, Any]] = []
            for p in target.iterdir():
                items.append({
                    "name": p.name,
                    "type": "dir" if p.is_dir() else "file",
                    "size": p.stat().st_size if p.is_file() else None,
                })
            return {"ok": True, "base_dir": str(SAFE_BASE_DIR), "path": str(target), "items": items}

        if op == "mkdir":
            if not path:
                return {"ok": False, "error": "Missing 'path'."}
            target = _resolve_safe(path)
            target.mkdir(parents=True, exist_ok=True)
            return {"ok": True, "message": "Directory created.", "path": str(target)}

        if op == "read":
            if not path:
                return {"ok": False, "error": "Missing 'path'."}
            target = _resolve_safe(path)
            if not target.exists() or not target.is_file():
                return {"ok": False, "error": "File not found."}
            content = target.read_text(encoding="utf-8", errors="replace")
            return {"ok": True, "path": str(target), "content": content}

        if op == "write":
            if not path:
                return {"ok": False, "error": "Missing 'path'."}
            content = args.get("content")
            if content is None:
                return {"ok": False, "error": "Missing 'content' for write."}
            target = _resolve_safe(path)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(str(content), encoding="utf-8")
            return {"ok": True, "message": "File written.", "path": str(target)}

        return {"ok": False, "error": "Invalid op. Use read/write/list/mkdir/search_user/read_user."}

    except Exception as e:
        return {"ok": False, "error": str(e)}