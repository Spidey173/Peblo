from unittest.mock import AsyncMock, patch

import pytest

from app.models.note import Note
from app.services.ai_service import generate_ai_insights
from app.services.rag_service import ask_vault_copilot, index_note_chunks


@pytest.mark.asyncio
async def test_ai_modes_and_cache_hit(client, user_a_headers, db_session):
    """Verify insights caching and format/checklist/custom AI modes without hitting external Groq."""
    resp = client.post(
        "/api/notes",
        json={
            "title": "Release Checklist",
            "content": "Ship database migrations, verify health endpoint, and publish release notes.",
        },
        headers=user_a_headers,
    )
    assert resp.status_code == 201
    note = db_session.query(Note).filter(Note.id == resp.json()["id"]).first()

    insights_payload = {
        "summary": "Release prep steps.",
        "action_items": ["Run migrations", "Verify /api/health"],
        "suggested_title": "Release Plan",
    }
    mock_groq = AsyncMock(return_value=insights_payload)
    with patch("app.services.ai_service._call_groq_api", new=mock_groq):
        first = await generate_ai_insights(note, db_session, force_regenerate=False, mode="insights")
        second = await generate_ai_insights(note, db_session, force_regenerate=False, mode="insights")

    assert first["cached"] is False
    assert second["cached"] is True
    assert mock_groq.await_count == 1

    format_payload = {
        "summary": "Formatted markdown.",
        "action_items": ["Review headings"],
        "suggested_title": "Release Checklist",
        "formatted_content": "## Release Checklist\n- [ ] Run migrations",
    }
    with patch("app.services.ai_service._call_groq_api", new=AsyncMock(return_value=format_payload)):
        formatted = await generate_ai_insights(note, db_session, mode="format")
    assert formatted["formatted_content"].startswith("## Release Checklist")
    assert formatted["cached"] is False

    custom_payload = {
        "summary": "Custom directive result.",
        "action_items": "Single string item",
        "suggested_title": "Custom Response",
    }
    with patch("app.services.ai_service._call_groq_api", new=AsyncMock(return_value=custom_payload)):
        custom = await generate_ai_insights(note, db_session, mode="custom", custom_prompt="Summarize risks")
    assert custom["action_items"] == ["Single string item"]


@pytest.mark.asyncio
async def test_ask_vault_copilot_grounded_and_fallback(client, user_a_headers, db_session):
    """Verify ask_vault_copilot returns grounded citations and falls back cleanly on Groq error."""
    resp = client.post(
        "/api/notes",
        json={
            "title": "Postgres Vector Tuning",
            "content": "HNSW indexes in pgvector accelerate cosine similarity search for 384-dimensional embeddings.",
        },
        headers=user_a_headers,
    )
    assert resp.status_code == 201
    note = db_session.query(Note).filter(Note.id == resp.json()["id"]).first()
    assert index_note_chunks(note, db_session) >= 1

    groq_response = {
        "summary": "Use HNSW indexes in pgvector [Source: Postgres Vector Tuning].",
        "action_items": ["Create HNSW index"],
        "suggested_title": "pgvector Tuning",
    }
    with patch("app.services.rag_service._call_groq_api", new=AsyncMock(return_value=groq_response)):
        result = await ask_vault_copilot(
            query="How do I speed up pgvector search?",
            user_id=note.user_id,
            db=db_session,
        )

    assert "HNSW" in result["answer"]
    assert result["action_items"] == ["Create HNSW index"]
    assert any(s["note_id"] == note.id for s in result["sources"])

    # Fallback path when Groq raises
    with patch("app.services.rag_service._call_groq_api", new=AsyncMock(side_effect=RuntimeError("Groq down"))):
        fallback = await ask_vault_copilot(
            query="How do I speed up pgvector search?",
            user_id=note.user_id,
            db=db_session,
        )
    assert "Postgres Vector Tuning" in fallback["answer"]
    assert fallback["action_items"] == []
