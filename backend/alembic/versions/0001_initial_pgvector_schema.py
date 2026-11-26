"""Initial PostgreSQL + pgvector schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("avatar_color", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "tags",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("color", sa.String(), nullable=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tags_name", "tags", ["name"], unique=False)
    op.create_index("ix_tags_user_id", "tags", ["user_id"], unique=False)

    op.create_table(
        "notes",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("is_pinned", sa.Boolean(), nullable=True, server_default=sa.text("false")),
        sa.Column("is_archived", sa.Boolean(), nullable=True, server_default=sa.text("false")),
        sa.Column("is_public", sa.Boolean(), nullable=True, server_default=sa.text("false")),
        sa.Column("share_token", sa.String(), nullable=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notes_is_archived", "notes", ["is_archived"], unique=False)
    op.create_index("ix_notes_is_pinned", "notes", ["is_pinned"], unique=False)
    op.create_index("ix_notes_share_token", "notes", ["share_token"], unique=True)
    op.create_index("ix_notes_user_id", "notes", ["user_id"], unique=False)
    op.create_index("ix_notes_user_updated", "notes", ["user_id", "updated_at"], unique=False)

    op.create_table(
        "note_tags",
        sa.Column("note_id", sa.String(), nullable=False),
        sa.Column("tag_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["note_id"], ["notes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("note_id", "tag_id"),
    )

    op.create_table(
        "ai_generations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("note_id", sa.String(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("action_items", sa.Text(), nullable=True),
        sa.Column("suggested_title", sa.String(), nullable=True),
        sa.Column("content_hash", sa.String(), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=True, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["note_id"], ["notes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("note_id"),
    )
    op.create_index("ix_ai_generations_note_id", "ai_generations", ["note_id"], unique=True)

    op.create_table(
        "note_embeddings",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("note_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("chunk_text", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(384), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["note_id"], ["notes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_note_embeddings_note_id", "note_embeddings", ["note_id"], unique=False)
    op.create_index("ix_note_embeddings_user_id", "note_embeddings", ["user_id"], unique=False)
    op.create_index("ix_embeddings_user_note", "note_embeddings", ["user_id", "note_id"], unique=False)
    op.create_index(
        "ix_note_embeddings_embedding_hnsw",
        "note_embeddings",
        ["embedding"],
        unique=False,
        postgresql_using="hnsw",
        postgresql_with={"m": 16, "ef_construction": 64},
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )


def downgrade() -> None:
    op.drop_index("ix_note_embeddings_embedding_hnsw", table_name="note_embeddings")
    op.drop_index("ix_embeddings_user_note", table_name="note_embeddings")
    op.drop_index("ix_note_embeddings_user_id", table_name="note_embeddings")
    op.drop_index("ix_note_embeddings_note_id", table_name="note_embeddings")
    op.drop_table("note_embeddings")

    op.drop_index("ix_ai_generations_note_id", table_name="ai_generations")
    op.drop_table("ai_generations")

    op.drop_table("note_tags")

    op.drop_index("ix_notes_user_updated", table_name="notes")
    op.drop_index("ix_notes_user_id", table_name="notes")
    op.drop_index("ix_notes_share_token", table_name="notes")
    op.drop_index("ix_notes_is_pinned", table_name="notes")
    op.drop_index("ix_notes_is_archived", table_name="notes")
    op.drop_table("notes")

    op.drop_index("ix_tags_user_id", table_name="tags")
    op.drop_index("ix_tags_name", table_name="tags")
    op.drop_table("tags")

    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
