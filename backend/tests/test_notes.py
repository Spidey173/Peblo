

def test_create_note_default(client, user_a_headers):
    resp = client.post("/api/notes", json={"title": "First Note", "content": "Sample content"}, headers=user_a_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "First Note"
    assert data["content"] == "Sample content"
    assert data["version"] == 1
    assert data["is_pinned"] is False
    assert data["is_archived"] is False


def test_get_note_by_id(client, user_a_headers):
    create_resp = client.post("/api/notes", json={"title": "Note 2", "content": "Body 2"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/notes/{note_id}", headers=user_a_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == note_id


def test_list_notes_user_isolation(client, user_a_headers, user_b_headers):
    # User A creates a note
    client.post("/api/notes", json={"title": "User A Private Note"}, headers=user_a_headers)
    # User B creates a note
    client.post("/api/notes", json={"title": "User B Private Note"}, headers=user_b_headers)

    # User A's list should only have User A's note
    resp_a = client.get("/api/notes", headers=user_a_headers)
    assert resp_a.status_code == 200
    titles_a = [n["title"] for n in resp_a.json()]
    assert "User A Private Note" in titles_a
    assert "User B Private Note" not in titles_a

    # User B's list should only have User B's note
    resp_b = client.get("/api/notes", headers=user_b_headers)
    assert resp_b.status_code == 200
    titles_b = [n["title"] for n in resp_b.json()]
    assert "User B Private Note" in titles_b
    assert "User A Private Note" not in titles_b


def test_multitenant_read_isolation(client, user_a_headers, user_b_headers):
    create_resp = client.post("/api/notes", json={"title": "Secret Note"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    # User B attempts to read User A's note
    resp = client.get(f"/api/notes/{note_id}", headers=user_b_headers)
    assert resp.status_code == 404


def test_multitenant_update_isolation(client, user_a_headers, user_b_headers):
    create_resp = client.post("/api/notes", json={"title": "Secret Note"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    # User B attempts to update User A's note
    resp = client.patch(f"/api/notes/{note_id}", json={"title": "Hacked"}, headers=user_b_headers)
    assert resp.status_code == 404


def test_multitenant_delete_isolation(client, user_a_headers, user_b_headers):
    create_resp = client.post("/api/notes", json={"title": "Secret Note"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    # User B attempts to delete User A's note
    resp = client.delete(f"/api/notes/{note_id}", headers=user_b_headers)
    assert resp.status_code == 404

    # Note still exists for User A
    get_resp = client.get(f"/api/notes/{note_id}", headers=user_a_headers)
    assert get_resp.status_code == 200


def test_archive_and_restore_note(client, user_a_headers):
    create_resp = client.post("/api/notes", json={"title": "To Archive"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    # Archive
    patch_resp = client.patch(f"/api/notes/{note_id}", json={"is_archived": True}, headers=user_a_headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_archived"] is True

    # Active list should not include archived note
    active_resp = client.get("/api/notes?archived=false", headers=user_a_headers)
    assert note_id not in [n["id"] for n in active_resp.json()]

    # Archived list should include it
    archived_resp = client.get("/api/notes?archived=true", headers=user_a_headers)
    assert note_id in [n["id"] for n in archived_resp.json()]

    # Restore
    restore_resp = client.patch(f"/api/notes/{note_id}", json={"is_archived": False}, headers=user_a_headers)
    assert restore_resp.json()["is_archived"] is False


def test_note_pinning_order(client, user_a_headers):
    client.post("/api/notes", json={"title": "Regular Note 1"}, headers=user_a_headers)
    pinned_resp = client.post("/api/notes", json={"title": "Pinned VIP Note", "is_pinned": True}, headers=user_a_headers)
    client.post("/api/notes", json={"title": "Regular Note 2"}, headers=user_a_headers)

    list_resp = client.get("/api/notes", headers=user_a_headers)
    assert list_resp.status_code == 200
    notes = list_resp.json()
    assert len(notes) >= 3
    # Pinned note must be the first element
    assert notes[0]["id"] == pinned_resp.json()["id"]
    assert notes[0]["is_pinned"] is True


def test_toggle_public_share_and_access(client, user_a_headers):
    create_resp = client.post("/api/notes", json={"title": "Public Guide", "content": "Welcome world"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    # Toggle share
    share_resp = client.post(f"/api/notes/{note_id}/share", headers=user_a_headers)
    assert share_resp.status_code == 200
    share_token = share_resp.json()["share_token"]
    assert share_token is not None
    assert share_resp.json()["is_public"] is True

    # Public unauthenticated read
    public_resp = client.get(f"/api/notes/public/{share_token}")
    assert public_resp.status_code == 200
    assert public_resp.json()["title"] == "Public Guide"


def test_tag_cascade_and_assignment(client, user_a_headers):
    # Create tag
    tag_resp = client.post("/api/tags", json={"name": "backend", "color": "#FF3815"}, headers=user_a_headers)
    assert tag_resp.status_code == 201
    tag_id = tag_resp.json()["id"]

    # Create note with tag
    note_resp = client.post("/api/notes", json={"title": "Tagged Note", "tag_ids": [tag_id]}, headers=user_a_headers)
    assert note_resp.status_code == 201
    tags = note_resp.json()["tags"]
    assert len(tags) == 1
    assert tags[0]["name"] == "backend"

    # Delete tag
    del_resp = client.delete(f"/api/tags/{tag_id}", headers=user_a_headers)
    assert del_resp.status_code == 204

    # Note still exists and tags array is now empty
    get_note = client.get(f"/api/notes/{note_resp.json()['id']}", headers=user_a_headers)
    assert get_note.status_code == 200
    assert len(get_note.json()["tags"]) == 0

