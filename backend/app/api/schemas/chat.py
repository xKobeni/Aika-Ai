from pydantic import BaseModel
from typing import Any, Dict, Optional

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    tool_used: Optional[Dict[str, Any]] = None
    tool_result: Optional[Dict[str, Any]] = None


class GreetingResponse(BaseModel):
    """First message shown when the chat starts."""
    message: str