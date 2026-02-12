import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.api.schemas.chat import ChatRequest, ChatResponse, GreetingResponse
from app.core.config import settings
from app.llm.ollama_client import OllamaClient
from app.agent.orchestrator import Agent
from app.core.prompt_loader import get_greeting_message

router = APIRouter(tags=["chat"])

# Configure Ollama client and agent using existing config fields
ollama = OllamaClient(settings.OLLAMA_URL)
agent = Agent(ollama=ollama, model=settings.OLLAMA_MODEL)


@router.get("/chat/greeting", response_model=GreetingResponse)
async def chat_greeting():
    """First message to show when the chat starts (before the user sends anything)."""
    return GreetingResponse(message=get_greeting_message())


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message to the AI agent; may trigger a tool (web_search, file_ops, open_app) and return a summarized reply."""
    if not (req.message and req.message.strip()):
        raise HTTPException(status_code=400, detail="message must be non-empty.")
    result = await agent.handle_chat(req.message.strip())
    return result


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    Stream the AI reply as Server-Sent Events. Each event is a JSON object:
    - {"type": "chunk", "text": "..."} for incremental text
    - {"type": "done", "reply": "...", "tool_used": ..., "tool_result": ...} when finished
    - {"type": "error", "message": "..."} on error
    """
    if not (req.message and req.message.strip()):
        raise HTTPException(status_code=400, detail="message must be non-empty.")

    async def event_stream():
        async for event in agent.handle_chat_stream(req.message.strip()):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )