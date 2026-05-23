import secrets
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.note import Note
from app.models.tag import Tag
from app.models.user import User
from app.schemas.note import NoteCreate, NoteUpdate, NoteOut, NoteListOut

router = APIRouter(prefix="/notes", tags=["notes"])


def _get_note_or_404(note_id: str, user_id: str, db: Session) -> Note:
    note = (
        db.query(Note)
        .options(joinedload(Note.tags), joinedload(Note.ai_generation))
        .filter(Note.id == note_id, Note.user_id == user_id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.get("", response_model=List[NoteListOut])
def list_notes(
    search: Optional[str] = Query(None),
    tag_id: Optional[str] = Query(None),
    archived: bool = Query(False),
    sort: str = Query("updated_at"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Note)
        .options(joinedload(Note.tags))
        .filter(Note.user_id == current_user.id, Note.is_archived == archived)
    )
    if search:
        term = f"%{search}%"
        query = query.filter(or_(Note.title.ilike(term), Note.content.ilike(term)))
    if tag_id:
        query = query.filter(Note.tags.any(Tag.id == tag_id))

    query = query.order_by(desc(Note.updated_at))
    return query.all()


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = Note(
        title=payload.title,
        content=payload.content,
        user_id=current_user.id,
    )
    if payload.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids), Tag.user_id == current_user.id).all()
        note.tags = tags
    db.add(note)
    db.commit()
    db.refresh(note)
    return _get_note_or_404(note.id, current_user.id, db)


@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_note_or_404(note_id, current_user.id, db)


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: str,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = _get_note_or_404(note_id, current_user.id, db)
    if payload.title is not None:
        note.title = payload.title
    if payload.content is not None:
        note.content = payload.content
    if payload.is_archived is not None:
        note.is_archived = payload.is_archived
    if payload.is_public is not None:
        note.is_public = payload.is_public
        if payload.is_public and not note.share_token:
            note.share_token = secrets.token_urlsafe(16)
    if payload.tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids), Tag.user_id == current_user.id).all()
        note.tags = tags
    db.commit()
    db.refresh(note)
    return _get_note_or_404(note_id, current_user.id, db)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = _get_note_or_404(note_id, current_user.id, db)
    db.delete(note)
    db.commit()


@router.post("/{note_id}/share", response_model=NoteOut)
def toggle_share(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = _get_note_or_404(note_id, current_user.id, db)
    note.is_public = not note.is_public
    if note.is_public and not note.share_token:
        note.share_token = secrets.token_urlsafe(16)
    db.commit()
    return _get_note_or_404(note_id, current_user.id, db)


@router.get("/public/{share_token}", response_model=NoteOut)
def get_public_note(share_token: str, db: Session = Depends(get_db)):
    note = (
        db.query(Note)
        .options(joinedload(Note.tags), joinedload(Note.ai_generation))
        .filter(Note.share_token == share_token, Note.is_public == True)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or not public")
    return note
