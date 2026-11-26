def test_dashboard_stats_empty_user(client, user_a_headers):
    """Dashboard returns zeroed counters and 7-day activity buckets for a new user."""
    resp = client.get("/api/dashboard/stats", headers=user_a_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_notes"] == 0
    assert data["archived_notes"] == 0
    assert data["public_notes"] == 0
    assert data["total_tags"] == 0
    assert data["ai_generations_count"] == 0
    assert data["notes_this_week"] == 0
    assert data["top_tags"] == []
    assert data["recent_notes"] == []
    assert len(data["activity_by_day"]) == 7


def test_dashboard_stats_aggregates_notes_tags_and_isolation(client, user_a_headers, user_b_headers):
    """Dashboard counts active/archived/public notes, top tags, and isolates per user."""
    tag_resp = client.post("/api/tags", json={"name": "architecture", "color": "#ff3815"}, headers=user_a_headers)
    assert tag_resp.status_code == 201
    tag_id = tag_resp.json()["id"]

    # Active note with tag
    n1 = client.post(
        "/api/notes",
        json={"title": "Active Note", "content": "Hello", "tag_ids": [tag_id]},
        headers=user_a_headers,
    )
    assert n1.status_code == 201
    n1_id = n1.json()["id"]

    # Make n1 public
    share_resp = client.post(f"/api/notes/{n1_id}/share", headers=user_a_headers)
    assert share_resp.status_code == 200

    # Archived note
    n2 = client.post("/api/notes", json={"title": "Old Note", "content": "Archived"}, headers=user_a_headers)
    assert n2.status_code == 201
    client.patch(f"/api/notes/{n2.json()['id']}", json={"is_archived": True}, headers=user_a_headers)

    # User B note should not leak into User A dashboard
    client.post("/api/notes", json={"title": "User B Secret", "content": "Private"}, headers=user_b_headers)

    resp = client.get("/api/dashboard/stats", headers=user_a_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_notes"] == 1
    assert data["archived_notes"] == 1
    assert data["public_notes"] == 1
    assert data["total_tags"] == 1
    assert data["notes_this_week"] == 2
    assert len(data["top_tags"]) == 1
    assert data["top_tags"][0]["name"] == "architecture"
    assert data["top_tags"][0]["count"] == 1
    assert len(data["recent_notes"]) == 1
    assert data["recent_notes"][0]["id"] == n1_id
    assert sum(d["count"] for d in data["activity_by_day"]) >= 2


def test_tag_duplicate_case_insensitive_and_delete_404(client, user_a_headers, user_b_headers):
    """Creating a duplicate tag (case-insensitive) returns existing tag; deleting missing/foreign tag returns 404."""
    r1 = client.post("/api/tags", json={"name": "Backend", "color": "#111111"}, headers=user_a_headers)
    assert r1.status_code == 201
    r2 = client.post("/api/tags", json={"name": "  backend ", "color": "#222222"}, headers=user_a_headers)
    assert r2.status_code == 201
    assert r2.json()["id"] == r1.json()["id"]

    # User B cannot delete User A's tag
    del_foreign = client.delete(f"/api/tags/{r1.json()['id']}", headers=user_b_headers)
    assert del_foreign.status_code == 404

    # Nonexistent tag returns 404
    del_missing = client.delete("/api/tags/nonexistent-tag-id", headers=user_a_headers)
    assert del_missing.status_code == 404

    # Empty tag name rejected by schema validation
    bad_tag = client.post("/api/tags", json={"name": "   "}, headers=user_a_headers)
    assert bad_tag.status_code == 422

