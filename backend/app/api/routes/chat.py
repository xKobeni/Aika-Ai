from fastapi import APIRouter, HTTPException
from app.api.schemas.chat import ChatRequest, ChatResponse, GreetingResponse
from app.core.config import settings
from app.llm.ollama_client import OllamaClient
from app.agent.orchestrator import Agent
from app.agent.prompts import GREETING_MESSAGE

router = APIRouter(tags=["chat"])

# Configure Ollama client and agent using existing config fields
ollama = OllamaClient(settings.OLLAMA_URL)
agent = Agent(ollama=ollama, model=settings.OLLAMA_MODEL)


@router.get("/chat/greeting", response_model=GreetingResponse)
async def chat_greeting():
    """First message to show when the chat starts (before the user sends anything)."""
    return GreetingResponse(message=GREETING_MESSAGE)


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message to the AI agent; may trigger a tool (web_search, file_ops, open_app) and return a summarized reply."""
    if not (req.message and req.message.strip()):
        raise HTTPException(status_code=400, detail="message must be non-empty.")
    result = await agent.handle_chat(req.message.strip())
    return result