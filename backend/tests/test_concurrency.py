import pytest


def test_initial_version_is_one(client, user_a_headers):
    resp = client.post("/api/notes", json={"title": "Version Test", "content": "Initial"}, headers=user_a_headers)
    assert resp.status_code == 201
    assert resp.json()["version"] == 1


def test_valid_version_update_increments_version(client, user_a_headers):
    create_resp = client.post("/api/notes", json={"title": "V1", "content": "Text 1"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]
    current_ver = create_resp.json()["version"]
    assert current_ver == 1

    # Update sending version=1
    patch_resp = client.patch(
        f"/api/notes/{note_id}",
        json={"title": "V2", "version": current_ver},
        headers=user_a_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["version"] == 2
    assert patch_resp.json()["title"] == "V2"


def test_stale_version_returns_409_conflict(client, user_a_headers):
    create_resp = client.post("/api/notes", json={"title": "Original", "content": "Base"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    # Tab 1 updates successfully to version 2
    tab1_resp = client.patch(
        f"/api/notes/{note_id}",
        json={"content": "Tab 1 Edits", "version": 1},
        headers=user_a_headers,
    )
    assert tab1_resp.status_code == 200
    assert tab1_resp.json()["version"] == 2

    # Tab 2 still thinks it's version 1 and tries to save
    tab2_resp = client.patch(
        f"/api/notes/{note_id}",
        json={"content": "Tab 2 Stale Overwrite", "version": 1},
        headers=user_a_headers,
    )
    assert tab2_resp.status_code == 409
    detail = tab2_resp.json()["detail"]
    assert detail["error"] == "CONFLICT"
    assert detail["client_version"] == 1
    assert detail["server_note"]["version"] == 2
    assert detail["server_note"]["content"] == "Tab 1 Edits"


def test_conflict_resolution_and_recovery(client, user_a_headers):
    create_resp = client.post("/api/notes", json={"title": "Doc", "content": "Draft"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    # First update moves note to v2
    client.patch(f"/api/notes/{note_id}", json={"content": "Updated", "version": 1}, headers=user_a_headers)

    # Stale attempt fails with 409
    failed_resp = client.patch(f"/api/notes/{note_id}", json={"content": "Conflicting", "version": 1}, headers=user_a_headers)
    assert failed_resp.status_code == 409

    # Client accepts server state (v2) and performs recovery update with version=2
    server_ver = failed_resp.json()["detail"]["server_note"]["version"]
    recovered_resp = client.patch(
        f"/api/notes/{note_id}",
        json={"content": "Merged Content", "version": server_ver},
        headers=user_a_headers,
    )
    assert recovered_resp.status_code == 200
    assert recovered_resp.json()["version"] == 3
    assert recovered_resp.json()["content"] == "Merged Content"


def test_sequential_atomic_updates(client, user_a_headers):
    create_resp = client.post("/api/notes", json={"title": "Multi-Step"}, headers=user_a_headers)
    note_id = create_resp.json()["id"]

    for expected_v in range(1, 6):
        resp = client.patch(
            f"/api/notes/{note_id}",
            json={"title": f"Step {expected_v}", "version": expected_v},
            headers=user_a_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["version"] == expected_v + 1

