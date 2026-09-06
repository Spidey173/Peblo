from pydantic import BaseModel
from typing import Optional, List


class AIRequest(BaseModel):
    note_id: str
    force_regenerate: bool = False


class AIResponse(BaseModel):
    summary: str
    action_items: List[str]
    suggested_title: str
    cached: bool = False


class DashboardStats(BaseModel):
    total_notes: int
    archived_notes: int
    public_notes: int
    total_tags: int
    ai_generations_count: int
    notes_this_week: int
    top_tags: List[dict]
    recent_notes: List[dict]
    activity_by_day: List[dict]
