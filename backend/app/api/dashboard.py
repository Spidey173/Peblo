from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.note import Note
from app.models.tag import Tag, note_tags
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
    now = datetime.now(timezone.utc)
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
    top_tags_raw = (
        db.query(Tag.id, Tag.name, Tag.color, func.count(note_tags.c.note_id).label("count"))
        .outerjoin(note_tags, note_tags.c.tag_id == Tag.id)
        .filter(Tag.user_id == uid)
        .group_by(Tag.id, Tag.name, Tag.color)
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
        {
            "id": n.id,
            "title": n.title,
            "updated_at": (n.updated_at or now).isoformat(),
        }
        for n in recent_raw
    ]

    # Single-query 7-day activity aggregation
    seven_days_ago = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    recent_activity_notes = (
        db.query(Note.updated_at)
        .filter(Note.user_id == uid, Note.updated_at >= seven_days_ago)
        .all()
    )

    # Bucket into day counts
    day_counts = { (now - timedelta(days=i)).strftime("%Y-%m-%d"): 0 for i in range(6, -1, -1) }
    for (updated_dt,) in recent_activity_notes:
        if updated_dt:
            key = updated_dt.strftime("%Y-%m-%d")
            if key in day_counts:
                day_counts[key] += 1

    activity_by_day = [
        {
            "date": datetime.strptime(d_str, "%Y-%m-%d").strftime("%a"),
            "count": cnt,
        }
        for d_str, cnt in day_counts.items()
    ]

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
