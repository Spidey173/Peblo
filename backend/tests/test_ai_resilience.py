from app.services.rag_service import chunk_markdown, cosine_similarity, generate_embedding, bm25_score


def test_ai_generate_too_short_content_returns_422(client, user_a_headers):
    create_resp = client.post("/api/notes", json={"title": "Short", "content": "Tiny"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    resp = client.post("/api/ai/generate", json={"note_id": note_id}, headers=user_a_headers)
    assert resp.status_code == 422
    assert "Note content too short" in resp.json()["detail"]


def test_ai_nonexistent_note_returns_404(client, user_a_headers):
    resp = client.post("/api/ai/generate", json={"note_id": "nonexistent-id-000"}, headers=user_a_headers)
    assert resp.status_code == 404


def test_ai_stream_endpoint_returns_sse_stream(client, user_a_headers):
    content = "This is a detailed note about building resilient cloud software systems with automated testing and continuous integration."
    create_resp = client.post("/api/notes", json={"title": "Architecture Note", "content": content}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    resp = client.post("/api/ai/stream", json={"note_id": note_id, "mode": "insights"}, headers=user_a_headers)
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers.get("content-type", "")


def test_text_chunking_and_overlap():
    long_text = "\n\n".join([f"Paragraph {i}: Detailed notes on distributed systems architecture and consensus algorithms." for i in range(12)])
    chunks = chunk_markdown(long_text, chunk_size=200, overlap=30)
    assert len(chunks) > 1
    for c in chunks:
        assert len(c) > 0


def test_embedding_cosine_similarity():
    v1 = generate_embedding("Kubernetes deployment and container orchestration")
    v2 = generate_embedding("Kubernetes deployment and container orchestration")
    v3 = generate_embedding("Culinary recipe for baking sourdough bread")

    sim_identical = cosine_similarity(v1, v2)
    sim_different = cosine_similarity(v1, v3)

    assert sim_identical >= 0.99
    assert sim_different < sim_identical


def test_bm25_lexical_scoring():
    query_tokens = ["fastapi", "python"]
    doc_match = ["fastapi", "is", "a", "modern", "python", "framework"]
    doc_irrelevant = ["baking", "sourdough", "bread", "in", "the", "kitchen"]

    score_match = bm25_score(query_tokens, doc_match, avg_doc_len=6.0)
    score_nomatch = bm25_score(query_tokens, doc_irrelevant, avg_doc_len=6.0)

    assert score_match > 0.0
    assert score_nomatch == 0.0


def test_ask_vault_empty_vault_graceful(client, user_a_headers):
    resp = client.post("/api/ai/ask-vault", json={"query": "What are our OKRs?"}, headers=user_a_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert len(data["sources"]) == 0


def test_vault_status_endpoint(client, user_a_headers):
    resp = client.get("/api/ai/vault-status", headers=user_a_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "indexed_chunks" in data
    assert "total_notes" in data

