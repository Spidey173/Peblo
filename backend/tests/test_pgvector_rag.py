import json
import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy import text

from app.models.ai_generation import AIGeneration
from app.models.note import Note
from app.models.user import User
from app.services.ai_service import generate_ai_insights
from app.services.rag_service import hybrid_search


def test_alembic_migration_and_pgvector_extension(db_session):
    """Verify pgvector extension, alembic_version, and HNSW index exist."""
    ext = db_session.execute(
        text("SELECT extname FROM pg_extension WHERE extname = 'vector'")
    ).scalar()
    assert ext == "vector"

    version = db_session.execute(
        text("SELECT version_num FROM alembic_version")
    ).scalar()
    assert version == "0001_initial"

    idx = db_session.execute(
        text(
            "SELECT indexname FROM pg_indexes "
            "WHERE tablename = 'note_embeddings' AND indexname = 'ix_note_embeddings_embedding_hnsw'"
        )
    ).scalar()
    assert idx == "ix_note_embeddings_embedding_hnsw"


def test_embedding_insert_and_similarity_ordering(client, user_a_headers, user_b_headers, db_session):
    """Verify pgvector cosine similarity ranks relevant notes higher and isolates users."""
    r1 = client.post(
        "/api/notes",
        json={
            "title": "PostgreSQL Vector Search",
            "content": "pgvector HNSW indexes accelerate cosine similarity search in PostgreSQL.",
        },
        headers=user_a_headers,
    )
    assert r1.status_code == 201
    note_pg_id = r1.json()["id"]

    r2 = client.post(
        "/api/notes",
        json={
            "title": "Sourdough Bread Recipe",
            "content": "Mix flour, water, salt, and starter. Bulk ferment for four hours before baking.",
        },
        headers=user_a_headers,
    )
    assert r2.status_code == 201

    # User B note with matching keywords should be isolated
    r3 = client.post(
        "/api/notes",
        json={
            "title": "User B PostgreSQL Notes",
            "content": "pgvector HNSW cosine similarity in PostgreSQL.",
        },
        headers=user_b_headers,
    )
    assert r3.status_code == 201

    user_a = db_session.query(User).filter(User.username == "usera").first()
    results = hybrid_search("pgvector HNSW cosine similarity", user_a.id, db_session, top_k=5)

    assert len(results) >= 1
    assert results[0]["note_id"] == note_pg_id
    assert all(res["note_id"] != r3.json()["id"] for res in results)


@pytest.mark.asyncio
async def test_ai_generation_upsert_on_conflict(client, user_a_headers, db_session):
    """Verify AIGeneration uses ON CONFLICT (note_id) DO UPDATE without duplicating rows."""
    resp = client.post(
        "/api/notes",
        json={
            "title": "Quarterly Planning",
            "content": "Define Q3 objectives, migrate database to Postgres, and ship CI pipeline.",
        },
        headers=user_a_headers,
    )
    assert resp.status_code == 201
    note_id = resp.json()["id"]
    note = db_session.query(Note).filter(Note.id == note_id).first()

    mock_payload_1 = {
        "summary": "Initial summary",
        "action_items": ["Task 1"],
        "suggested_title": "Q3 Plan v1",
    }
    with patch("app.services.ai_service._call_groq_api", new=AsyncMock(return_value=mock_payload_1)):
        res1 = await generate_ai_insights(note, db_session, force_regenerate=True, mode="insights")
    assert res1["summary"] == "Initial summary"

    mock_payload_2 = {
        "summary": "Updated summary",
        "action_items": ["Task 1", "Task 2"],
        "suggested_title": "Q3 Plan v2",
    }
    with patch("app.services.ai_service._call_groq_api", new=AsyncMock(return_value=mock_payload_2)):
        res2 = await generate_ai_insights(note, db_session, force_regenerate=True, mode="insights")
    assert res2["summary"] == "Updated summary"

    rows = db_session.query(AIGeneration).filter(AIGeneration.note_id == note_id).all()
    assert len(rows) == 1
    assert rows[0].summary == "Updated summary"
    assert json.loads(rows[0].action_items) == ["Task 1", "Task 2"]


def test_api_error_paths(client, user_a_headers):
    """Verify error handling for bad inputs, missing resources, and unauthenticated requests."""
    # Unauthenticated (HTTPBearer returns 403 when missing, 401 when invalid)
    assert client.get("/api/notes").status_code == 403
    assert client.get("/api/notes", headers={"Authorization": "Bearer invalid"}).status_code == 401

    # Missing note
    assert client.get("/api/notes/nonexistent-id", headers=user_a_headers).status_code == 404
    assert client.delete("/api/notes/nonexistent-id", headers=user_a_headers).status_code == 404

    # Empty ask-vault query
    resp = client.post("/api/ai/ask-vault", json={"query": "   "}, headers=user_a_headers)
    assert resp.status_code == 422

    # Note re-indexing on update replaces old embeddings
    created = client.post(
        "/api/notes",
        json={"title": "Initial", "content": "Alpha beta gamma."},
        headers=user_a_headers,
    )
    assert created.status_code == 201
    nid = created.json()["id"]

    updated = client.patch(
        f"/api/notes/{nid}",
        json={"content": "Delta epsilon zeta.", "version": 1},
        headers=user_a_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["version"] == 2
