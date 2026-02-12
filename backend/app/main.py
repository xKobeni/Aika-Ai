from fastapi import FastAPI
from app.api.routes.health import router as health_router
from app.api.routes.chat import router as chat_router
from app.api.routes.vision import router as vision_router
from app.api.routes.memory import router as memory_router
from app.tools.registry import TOOLS, ToolSpec
from app.tools.implementations.open_app import open_app
from app.tools.implementations.web_search import web_search
from app.tools.implementations.file_ops import file_ops
from app.core.config import settings
from app.memory.init_db import init_db

app = FastAPI(title="AIKA AI Backend", version="0.1.0")

# Initialize database
init_db()

# Register tools on startup
TOOLS["open_app"] = ToolSpec(
    name="open_app",
    description="Open an approved desktop app by name. args: {app: string}",
    handler=open_app,
)

TOOLS["web_search"] = ToolSpec(
    name="web_search",
    description="Search the web for information. Use when the user asks to search, look up, or get latest/current info online. args: {query: string, max_results: int (optional, default 5)}",
    handler=web_search,
)

TOOLS["file_ops"] = ToolSpec(
    name="file_ops",
    description="File operations. Safe sandbox: op=read|write|list|mkdir with path under app data. User folders (Documents, Desktop, Downloads only): op=search_user (args: query optional filename/glob, recursive optional, max_results optional) to search; op=read_user with path=string (path relative to folder or full path) to read. Use search_user then read_user when user asks to find or read their files.",
    handler=file_ops,
)

app.include_router(health_router)
app.include_router(chat_router)
app.include_router(vision_router)
app.include_router(memory_router)

if __name__ == "__main__":
    # Run with host/port from environment-backed settings
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=True,
    )