from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid
from app.db.database import Base

EMBEDDING_DIMENSIONS = 384


class NoteEmbedding(Base):
    __tablename__ = "note_embeddings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    note_id = Column(String, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False, default=0)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(EMBEDDING_DIMENSIONS), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    note = relationship("Note", back_populates="embeddings")
    user = relationship("User")

    __table_args__ = (
        Index("ix_embeddings_user_note", "user_id", "note_id"),
        Index(
            "ix_note_embeddings_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )
