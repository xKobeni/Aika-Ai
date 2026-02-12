from pydantic import BaseModel
from typing import Dict


class SetPreferenceRequest(BaseModel):
    key: str
    value: str


class SetPreferenceResponse(BaseModel):
    saved: bool


class GetPreferencesResponse(BaseModel):
    preferences: Dict[str, str]
