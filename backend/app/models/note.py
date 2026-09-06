from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.database import Base
from app.models.tag import note_tags


class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False, default="Untitled Note")
    content = Column(Text, default="")
    is_archived = Column(Boolean, default=False, index=True)
    is_public = Column(Boolean, default=False)
    share_token = Column(String, unique=True, nullable=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="notes")
    tags = relationship("Tag", secondary=note_tags, back_populates="notes")
    ai_generation = relationship("AIGeneration", back_populates="note", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_notes_user_updated", "user_id", "updated_at"),
    )
