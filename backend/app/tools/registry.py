from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Callable, Dict

@dataclass
class ToolSpec:
    name: str
    description: str
    handler: Callable[[Dict[str, Any]], Dict[str, Any]]

TOOLS: Dict[str, ToolSpec] = {}