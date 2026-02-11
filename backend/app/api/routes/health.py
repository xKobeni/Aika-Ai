from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
def health():
    """Liveness check for the backend."""
    return {"status": "ok"}