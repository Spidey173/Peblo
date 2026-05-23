from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.note import Note
from app.models.user import User
from app.schemas.ai import AIRequest, AIResponse
from app.services.ai_service import generate_ai_insights

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/generate", response_model=AIResponse)
async def generate_insights(
    payload: AIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = (
        db.query(Note)
        .options(joinedload(Note.ai_generation))
        .filter(Note.id == payload.note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not note.content or len(note.content.strip()) < 20:
        raise HTTPException(status_code=422, detail="Note content too short for AI analysis (min 20 characters)")
    try:
        result = await generate_ai_insights(note, db, payload.force_regenerate)
        return AIResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
