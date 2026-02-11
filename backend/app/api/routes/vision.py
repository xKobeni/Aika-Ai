from __future__ import annotations

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.core.config import settings
from app.core.prompt_loader import get_prompt
from app.core.storage import save_upload_bytes
from app.llm.ollama_vision import OllamaVisionClient
from app.tools.registry import TOOLS
from app.api.schemas.vision import (
    VisionResponse,
    VisionProposeToolRequest,
    VisionProposeToolResponse,
)
from app.agent.tool_parse import try_parse_tool_call
from app.tools.router import execute_tool

router = APIRouter(tags=["vision"])
vision_client = OllamaVisionClient(settings.OLLAMA_URL)

@router.post("/vision", response_model=VisionResponse)
async def vision(
    message: str = Form(...),
    image: UploadFile = File(...),
):
    """Analyze an image with the vision model and return a text reply."""
    if not (message and message.strip()):
        raise HTTPException(status_code=400, detail="message must be non-empty.")
    message = message.strip()
    # Validate file type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await image.read()

    # Save image to disk
    image_id, saved_path = save_upload_bytes(image.filename or "upload.png", image_bytes)

    prompt = get_prompt(
        "vision_analyze",
        settings.PROMPT_VISION_ANALYZE,
        message=message,
    )

    reply = await vision_client.chat_with_image(
        model=settings.OLLAMA_VISION_MODEL,
        prompt=prompt,
        image_bytes=image_bytes,
        temperature=0.2,
    )

    return VisionResponse(
        reply=reply,
        model=settings.OLLAMA_VISION_MODEL,
        filename=image.filename,
        image_id=image_id,
        saved_path=saved_path,
        tool_used=None,
        tool_result=None,
    )


@router.post("/vision/propose-tool", response_model=VisionProposeToolResponse)
async def vision_propose_tool(req: VisionProposeToolRequest):
    """Propose (and optionally execute) a tool based on the image and message. Set execute=true to run the tool."""
    if not (req.message and req.message.strip()):
        raise HTTPException(status_code=400, detail="message must be non-empty.")
    # Load the saved image by image_id (file may have any allowed image extension)
    from app.core.storage import UPLOAD_DIR

    matches = list(UPLOAD_DIR.glob(f"{req.image_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="image_id not found in uploads.")
    file_path = matches[0]
    image_bytes = file_path.read_bytes()

    allowed_tools = ", ".join(TOOLS.keys()) if TOOLS else "open_app"
    prompt = get_prompt(
        "vision_propose_tool",
        settings.PROMPT_VISION_PROPOSE_TOOL,
        message=req.message,
        allowed_tools=allowed_tools,
    )

    raw = await vision_client.chat_with_image(
        model=settings.OLLAMA_VISION_MODEL,
        prompt=prompt,
        image_bytes=image_bytes,
        temperature=0.2,
    )

    proposed = None
    executed = False
    tool_result = None

    tool_call = try_parse_tool_call(raw)
    if tool_call:
        tool_name, args = tool_call
        proposed = {"tool": tool_name, "args": args}

        # Safety default: don't execute unless explicitly requested
        if req.execute is True:
            tool_result = execute_tool(tool_name, args)
            executed = True

            # Provide a user-friendly reply after execution
            reply = f"Proposed and executed tool: {tool_name}. Result: {tool_result}"
        else:
            reply = "I can perform an action based on the screenshot. Here is the proposed tool call."
    else:
        # No tool call: treat as a normal answer
        reply = raw

    return VisionProposeToolResponse(
        reply=reply,
        model=settings.OLLAMA_VISION_MODEL,
        image_id=req.image_id,
        proposed_tool=proposed,
        executed=executed,
        tool_result=tool_result,
    )