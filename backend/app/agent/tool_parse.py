from __future__ import annotations
import json
from typing import Any, Dict, Optional, Tuple

def try_parse_tool_call(text: str) -> Optional[Tuple[str, Dict[str, Any]]]:
    text = text.strip()
    if not (text.startswith("{") and text.endswith("}")):
        return None
    try:
        data = json.loads(text)
        tool = data.get("tool")
        args = data.get("args", {})
        if isinstance(tool, str) and isinstance(args, dict):
            return tool, args
        return None
    except Exception:
        return None