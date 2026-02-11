from __future__ import annotations
from typing import Any, Dict
from app.tools.registry import TOOLS

def execute_tool(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    tool = TOOLS.get(tool_name)
    if not tool:
        return {"ok": False, "error": f"Unknown tool: {tool_name}"}
    return tool.handler(args)