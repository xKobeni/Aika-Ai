"""
Load prompt templates from app/prompts/prompts.json.
Templates can be overridden via settings (e.g. PROMPT_VISION_PROPOSE_TOOL in .env).
Placeholders in templates use {{name}} and are replaced when getting a prompt.
Chat character is defined in the "character" object and used to build the system prompt.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

# Path to prompts.json (next to app/core, so app/prompts/prompts.json)
_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
_PROMPTS_FILE = _PROMPTS_DIR / "prompts.json"

_cached_prompts: Dict[str, str] | None = None
_cached_raw: Dict[str, Any] | None = None

# Tool-use instructions appended to the character system prompt (not in JSON).
_TOOL_INSTRUCTIONS = """
---
Tool use: When the user wants you to do an action, respond with ONLY this JSON and nothing else:
{"tool": "tool_name", "args": { ... }}

Do not say "I'll look that up" or "Let me search for you" in text - if they ask to search the web, look something up, or get latest/current information online, output only the web_search tool call (e.g. {"tool": "web_search", "args": {"query": "their request"}}). Same for opening apps or file operations: output only the tool JSON, no preceding text.

Otherwise reply in normal text. Never mix text and JSON in one response. Allowed tools are listed in the conversation.
"""


def _load_raw() -> Dict[str, Any]:
    global _cached_raw
    if _cached_raw is not None:
        return _cached_raw
    if not _PROMPTS_FILE.exists():
        _cached_raw = {}
        return _cached_raw
    with open(_PROMPTS_FILE, encoding="utf-8") as f:
        _cached_raw = json.load(f)
    return _cached_raw


def _load_prompts() -> Dict[str, str]:
    global _cached_prompts
    if _cached_prompts is not None:
        return _cached_prompts
    data = _load_raw()
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
    data = _load_raw()
    replies = data.get("greeting_replies")
    if isinstance(replies, list) and all(isinstance(r, str) for r in replies):
        return [r.strip() for r in replies if r.strip()]
    return ["Hello. I'm here when you need me."]


def get_character() -> Dict[str, Any]:
    """Load the chat character definition from prompts.json (name, personality, style, etc.)."""
    return _load_raw().get("character") or {}


def _ensure_list(x: Any) -> List[str]:
    if isinstance(x, list):
        return [str(i) for i in x]
    if isinstance(x, str):
        return [x] if x.strip() else []
    return []


def get_chat_system_prompt() -> str:
    """
    Build the chat system prompt from the "character" object in prompts.json.
    If CHAT_FAST_PROMPT is True, returns a short prompt for faster first-token.
    """
    try:
        from app.core.config import settings
        if getattr(settings, "CHAT_FAST_PROMPT", False):
            c = get_character()
            name = (c.get("name") or "Aika").strip()
            who = (c.get("who_you_are") or f"I'm {name}. I'm here to help.").strip()
            short = (
                f"You are {name}, a calm and helpful AI. Reply concisely and naturally. "
                f"When asked who you are, say: \"{who}\" "
                "Greet briefly. For actions (search, open app, files), output ONLY the tool JSON, no extra text."
            )
            return short + _TOOL_INSTRUCTIONS
    except Exception:
        pass
    c = get_character()
    if not c:
        from app.agent.prompts import SYSTEM_PROMPT
        return SYSTEM_PROMPT

    name = (c.get("name") or "Aika").strip()
    desc = (c.get("description") or "A calm, intelligent AI assistant.").strip()
    personality = _ensure_list(c.get("personality"))
    communication = _ensure_list(c.get("communication_style"))
    behavior = _ensure_list(c.get("behavior"))
    who = (c.get("who_you_are") or f"I'm {name}. I'm here to help.").strip()
    good = _ensure_list(c.get("greeting_examples_good"))
    bad = _ensure_list(c.get("greeting_examples_bad"))

    lines = [
        f"You are {name}, {desc}",
        "",
        "Personality:",
    ]
    lines.extend(f"- {p}" for p in personality if p)
    lines.extend(["", "Communication style:"])
    lines.extend(f"- {s}" for s in communication if s)
    lines.extend(["", "Behavior:"])
    lines.extend(f"- {b}" for b in behavior if b)
    lines.append("")
    lines.append("You are not just a tool. You are a steady and dependable AI companion with a real presence.")
    lines.append("")
    lines.append("---")
    lines.append("When someone greets you: reply briefly and warmly.")
    if good:
        lines.append("Good: " + " or ".join(f'"{g}"' for g in good[:3]))
    if bad:
        lines.append("Bad (never use these): " + ", ".join(f'"{b}"' for b in bad[:3]))
    lines.append("")
    lines.append("When someone asks who you are: answer in a few sentences.")
    lines.append(f'Good: "{who}" Keep it natural.')
    lines.append("")
    return "\n".join(lines) + _TOOL_INSTRUCTIONS


def get_greeting_message() -> str:
    """First message shown when the chat starts (before the user sends anything)."""
    data = _load_raw()
    msg = data.get("greeting_message")
    if isinstance(msg, str) and msg.strip():
        return msg.strip()
    return "Hello.\n\nI'm here. Whenever you're ready—questions, tasks, or just to talk—say what you need."
