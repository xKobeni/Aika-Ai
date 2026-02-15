from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    tool_used: Optional[Dict[str, Any]] = None
    tool_result: Optional[Dict[str, Any]] = None
    learned_facts: Optional[List[str]] = None


class GreetingResponse(BaseModel):
    """First message shown when the chat starts."""
    message: str


class SessionListItem(BaseModel):
    id: str
    created_at: str
    updated_at: str
    preview: str


class SessionMessage(BaseModel):
    role: str
    content: str
    created_at: str


class SessionMessagesResponse(BaseModel):
    session_id: str
    messages: List[SessionMessage]