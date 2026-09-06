from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.note import Note
from app.models.tag import Tag
from app.models.ai_generation import AIGeneration
from app.models.user import User
from app.schemas.ai import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    total_notes = db.query(Note).filter(Note.user_id == uid, Note.is_archived == False).count()
    archived_notes = db.query(Note).filter(Note.user_id == uid, Note.is_archived == True).count()
    public_notes = db.query(Note).filter(Note.user_id == uid, Note.is_public == True).count()
    total_tags = db.query(Tag).filter(Tag.user_id == uid).count()

    ai_count = (
        db.query(AIGeneration)
        .join(Note, Note.id == AIGeneration.note_id)
        .filter(Note.user_id == uid)
        .count()
    )

    notes_this_week = db.query(Note).filter(
        Note.user_id == uid,
        Note.created_at >= week_ago,
    ).count()

    # Top tags by note count
    from app.models.tag import note_tags
    top_tags_raw = (
        db.query(Tag.id, Tag.name, Tag.color, func.count(note_tags.c.note_id).label("count"))
        .outerjoin(note_tags, note_tags.c.tag_id == Tag.id)
        .filter(Tag.user_id == uid)
        .group_by(Tag.id)
        .order_by(desc("count"))
        .limit(6)
        .all()
    )
    top_tags = [{"id": r.id, "name": r.name, "color": r.color, "count": r.count} for r in top_tags_raw]

    # Recent notes
    recent_raw = (
        db.query(Note)
        .filter(Note.user_id == uid, Note.is_archived == False)
        .order_by(desc(Note.updated_at))
        .limit(5)
        .all()
    )
    recent_notes = [
        {"id": n.id, "title": n.title, "updated_at": n.updated_at.isoformat()}
        for n in recent_raw
    ]

    # Activity by day (last 7 days)
    activity_by_day = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = db.query(Note).filter(
            Note.user_id == uid,
            Note.updated_at >= day_start,
            Note.updated_at < day_end,
        ).count()
        activity_by_day.append({"date": day_start.strftime("%a"), "count": count})

    return DashboardStats(
        total_notes=total_notes,
        archived_notes=archived_notes,
        public_notes=public_notes,
        total_tags=total_tags,
        ai_generations_count=ai_count,
        notes_this_week=notes_this_week,
        top_tags=top_tags,
        recent_notes=recent_notes,
        activity_by_day=activity_by_day,
    )
