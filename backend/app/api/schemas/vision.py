from pydantic import BaseModel
from typing import Optional, Dict, Any

class VisionResponse(BaseModel):
    reply: str
    model: str
    filename: Optional[str] = None

    # NEW
    image_id: Optional[str] = None
    saved_path: Optional[str] = None

    # for future tool support
    tool_used: Optional[Dict[str, Any]] = None
    tool_result: Optional[Dict[str, Any]] = None


class VisionProposeToolRequest(BaseModel):
    image_id: str
    message: str
    execute: bool = False  


class VisionProposeToolResponse(BaseModel):
    reply: str                    
    model: str
    image_id: str
    proposed_tool: Optional[Dict[str, Any]] = None
    executed: bool = False
    tool_result: Optional[Dict[str, Any]] = None