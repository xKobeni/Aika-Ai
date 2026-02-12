import json
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.api.schemas.chat import ChatRequest, ChatResponse, GreetingResponse
from app.core.config import settings
from app.llm.ollama_client import OllamaClient
from app.agent.orchestrator import Agent
from app.core.prompt_loader import get_greeting_message
from app.memory.repo import add_message, get_recent_messages, log_tool
from app.memory.learning import learn_from_conversation

router = APIRouter(tags=["chat"])

ollama = OllamaClient(settings.OLLAMA_URL)
agent = Agent(ollama=ollama, model=settings.OLLAMA_MODEL)


@router.get("/chat/greeting", response_model=GreetingResponse)
async def chat_greeting():
    """First message to show when the chat starts (before the user sends anything)."""
    return GreetingResponse(message=get_greeting_message())


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message to the AI agent; may trigger a tool and return a summarized reply. Session-based memory is used when session_id is provided or generated."""
    if not (req.message or not req.message.strip()):
        raise HTTPException(status_code=400, detail="message must be non-empty.")
    msg = req.message.strip()
    session_id = req.session_id or uuid4().hex

    history = get_recent_messages(session_id, limit=12)
    add_message(session_id, "user", msg)

    result = await agent.handle_chat(msg, history=history)

    add_message(session_id, "assistant", result["reply"])
    if result.get("tool_used") and result.get("tool_result"):
        log_tool(
            session_id,
            result["tool_used"]["tool"],
            result["tool_used"]["args"],
            result["tool_result"],
        )
    
    # Auto-learn from conversation (runs async in background, doesn't block response)
    try:
        learned = await learn_from_conversation(
            msg,
            result["reply"],
            session_id,
            ollama,
            settings.OLLAMA_MODEL,
        )
        if learned:
            result["learned_facts"] = learned  # Optional: include in response
    except Exception:
        pass  # Don't break chat if learning fails

    result["session_id"] = session_id
    return result


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    Stream the AI reply as Server-Sent Events. Each event is a JSON object:
    - {"type": "chunk", "text": "..."} for incremental text
    - {"type": "done", "reply": "...", "session_id": "...", "tool_used": ..., "tool_result": ...} when finished
    - {"type": "error", "message": "..."} on error
    """
    if not (req.message or not req.message.strip()):
        raise HTTPException(status_code=400, detail="message must be non-empty.")
    msg = req.message.strip()
    session_id = req.session_id or uuid4().hex

    history = get_recent_messages(session_id, limit=12)
    add_message(session_id, "user", msg)

    async def event_stream():
        async for event in agent.handle_chat_stream(msg, history=history):
            if event.get("type") == "done":
                event["session_id"] = session_id
                add_message(session_id, "assistant", event["reply"])
                if event.get("tool_used") and event.get("tool_result"):
                    log_tool(
                        session_id,
                        event["tool_used"]["tool"],
                        event["tool_used"]["args"],
                        event["tool_result"],
                    )
                # Auto-learn from conversation (runs async, doesn't block stream)
                try:
                    learned = await learn_from_conversation(
                        msg,
                        event["reply"],
                        session_id,
                        ollama,
                        settings.OLLAMA_MODEL,
                    )
                    if learned:
                        event["learned_facts"] = learned  # Optional: include in done event
                except Exception:
                    pass  # Don't break stream if learning fails
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )