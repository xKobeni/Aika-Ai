from __future__ import annotations
import json
import re
from typing import Any, Dict, Optional, Tuple

def _extract_json_object_from(s: str, start: int) -> Optional[str]:
    """From position start (at a '{'), return the substring of the next balanced {...} or None."""
    if start >= len(s) or s[start] != "{":
        return None
    depth = 0
    i = start
    in_string = False
    escape = False
    quote = None
    while i < len(s):
        c = s[i]
        if escape:
            escape = False
            i += 1
            continue
        if in_string:
            if c == "\\":
                escape = True
                i += 1
                continue
            if c == quote:
                in_string = False
            i += 1
            continue
        if c in ("'", '"'):
            in_string = True
            quote = c
            i += 1
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return s[start : i + 1]
        i += 1
    return None

def try_parse_tool_call(text: str) -> Optional[Tuple[str, Dict[str, Any]]]:
    """Parse a tool call from model output. Handles both pure JSON and text + JSON."""
    text = (text or "").strip()
    if not text:
        return None

    # 1) Whole response is a single JSON object
    if text.startswith("{") and text.endswith("}"):
        try:
            data = json.loads(text)
            tool = data.get("tool")
            args = data.get("args", {})
            if isinstance(tool, str) and isinstance(args, dict):
                return tool, args
        except Exception:
            pass

    # 2) Response has text then JSON (e.g. "Let me search... {"tool": "web_search", ...}")
    # Find the last occurrence of {"tool": and extract balanced {...}, then parse.
    pattern = re.compile(r'\{\s*"tool"\s*', re.IGNORECASE)
    for match in reversed(list(pattern.finditer(text))):
        start = match.start()
        candidate = _extract_json_object_from(text, start)
        if candidate:
            try:
                data = json.loads(candidate)
                tool = data.get("tool")
                args = data.get("args", {})
                if isinstance(tool, str) and isinstance(args, dict):
                    return tool, args
            except Exception:
                continue
    return None