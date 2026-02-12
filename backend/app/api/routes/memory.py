from fastapi import APIRouter
from app.api.schemas.memory import SetPreferenceRequest, SetPreferenceResponse, GetPreferencesResponse
from app.memory.repo import set_preference, get_all_preferences

router = APIRouter(tags=["memory"])


@router.post("/memory/preferences", response_model=SetPreferenceResponse)
def save_preference(req: SetPreferenceRequest):
    set_preference(req.key, req.value)
    return SetPreferenceResponse(saved=True)


@router.get("/memory/preferences", response_model=GetPreferencesResponse)
def list_preferences():
    return GetPreferencesResponse(preferences=get_all_preferences())
