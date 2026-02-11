"""
Load prompt templates from app/prompts/prompts.json.
Templates can be overridden via settings (e.g. PROMPT_VISION_PROPOSE_TOOL in .env).
Placeholders in templates use {{name}} and are replaced when getting a prompt.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

# Path to prompts.json (next to app/core, so app/prompts/prompts.json)
_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
_PROMPTS_FILE = _PROMPTS_DIR / "prompts.json"

_cached_prompts: Dict[str, str] | None = None


def _load_prompts() -> Dict[str, str]:
    global _cached_prompts
    if _cached_prompts is not None:
        return _cached_prompts
    if not _PROMPTS_FILE.exists():
        _cached_prompts = {}
        return _cached_prompts
    with open(_PROMPTS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    _cached_prompts = {k: v for k, v in data.items() if isinstance(v, str)}
    return _cached_prompts


def get_prompt(
    key: str,
    override: str | None,
    **placeholders: Any,
) -> str:
    """
    Get a prompt template by key. If override is set (e.g. from settings), use it;
    otherwise load from prompts.json. Replace {{placeholder}} with values from placeholders.
    """
    template = override
    if not template:
        prompts = _load_prompts()
        template = prompts.get(key, "")
    for name, value in placeholders.items():
        template = template.replace("{{" + name + "}}", str(value))
    return template


def get_greeting_replies() -> list[str]:
    """Load greeting_replies array from prompts.json. Used for instant in-character greeting replies."""
    if not _PROMPTS_FILE.exists():
        return ["Hello. I'm here when you need me."]
    with open(_PROMPTS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    replies = data.get("greeting_replies")
    if isinstance(replies, list) and all(isinstance(r, str) for r in replies):
        return [r.strip() for r in replies if r.strip()]
    return ["Hello. I'm here when you need me."]
