from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import json


class TagBase(BaseModel):
    name: str
    color: Optional[str] = "#6366f1"


class TagCreate(TagBase):
    pass


class TagOut(TagBase):
    id: str
    user_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AIGenerationOut(BaseModel):
    id: str
    summary: Optional[str] = None
    action_items: Optional[List[str]] = None
    suggested_title: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("action_items", mode="before")
    @classmethod
    def parse_action_items(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v


class NoteBase(BaseModel):
    title: str = "Untitled Note"
    content: str = ""


class NoteCreate(NoteBase):
    tag_ids: Optional[List[str]] = []


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_archived: Optional[bool] = None
    is_public: Optional[bool] = None
    tag_ids: Optional[List[str]] = None


class NoteOut(NoteBase):
    id: str
    is_archived: bool
    is_public: bool
    share_token: Optional[str]
    user_id: str
    tags: List[TagOut] = []
    ai_generation: Optional[AIGenerationOut] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteListOut(BaseModel):
    id: str
    title: str
    content: str
    is_archived: bool
    is_public: bool
    tags: List[TagOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
