from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.note import Note
from app.models.user import User
from app.models.embedding import NoteEmbedding
from app.schemas.ai import (
    AIRequest, AIResponse,
    VaultQueryRequest, VaultQueryResponse, VaultStatusResponse
)
from app.services.ai_service import generate_ai_insights, stream_ai_synthesis
from app.services.rag_service import ask_vault_copilot

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
        result = await generate_ai_insights(
            note,
            db,
            payload.force_regenerate,
            mode=payload.mode or "insights",
            custom_prompt=payload.custom_prompt,
        )
        return AIResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/synthesize-stream")
@router.post("/stream")
async def stream_synthesis(
    payload: AIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Server-Sent Events (SSE) streaming endpoint for real-time token rendering."""
    note = (
        db.query(Note)
        .filter(Note.id == payload.note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not note.content or len(note.content.strip()) < 10:
        raise HTTPException(status_code=422, detail="Note content too short for AI streaming")

    return StreamingResponse(
        stream_ai_synthesis(note, mode=payload.mode or "insights", custom_prompt=payload.custom_prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/ask-vault", response_model=VaultQueryResponse)
async def ask_vault(
    payload: VaultQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Semantic RAG Copilot: Hybrid Search (384-d Vectors + BM25) + Grounded Groq Answer."""
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=422, detail="Query cannot be empty")

    res = await ask_vault_copilot(
        query=payload.query.strip(),
        user_id=current_user.id,
        db=db,
        top_k=payload.top_k or 5,
    )
    return VaultQueryResponse(**res)


@router.get("/vault-status", response_model=VaultStatusResponse)
def get_vault_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns number of indexed chunks and notes in the user's vector store."""
    chunks_count = (
        db.query(NoteEmbedding)
        .filter(NoteEmbedding.user_id == current_user.id)
        .count()
    )
    notes_count = (
        db.query(Note)
        .filter(Note.user_id == current_user.id, Note.is_archived == False)
        .count()
    )
    return VaultStatusResponse(indexed_chunks=chunks_count, total_notes=notes_count)
