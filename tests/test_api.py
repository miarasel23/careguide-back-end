import pytest
from fastapi.testclient import TestClient
from main import app
from core.database import init_database_indexes
from seeds.seeder import run_seeders

client = TestClient(app)

@pytest.fixture(autouse=True, scope="module")
def setup_test_data():
    init_database_indexes()
    run_seeders()

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] is True
    assert "Secure Note-Taking REST API" in data["data"]["service"]

def test_auth_login_admin():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    body = res.json()
    assert body["status"] is True
    assert "token" in body["data"]
    assert body["data"]["user"]["role"] == "admin"

def test_auth_login_user():
    res = client.post("/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "User@123"
    })
    assert res.status_code == 200
    body = res.json()
    assert body["status"] is True
    assert "token" in body["data"]
    assert body["data"]["user"]["role"] == "user"

def test_auth_profile_me():
    # Login user
    login_res = client.post("/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "User@123"
    })
    token = login_res.json()["data"]["token"]

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["email"] == "user@example.com"

def test_invalid_credentials_returns_401():
    res = client.post("/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "WrongPassword123"
    })
    assert res.status_code == 401
    assert res.json()["status"] is False

def test_registration_conflict_returns_409():
    res = client.post("/api/v1/auth/register", json={
        "name": "Duplicate User",
        "email": "user@example.com",
        "password": "User@123",
        "role": "user"
    })
    assert res.status_code == 409
    assert res.json()["status"] is False

def test_user_notes_crud_and_rbac():
    # Login standard user
    login_res = client.post("/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "User@123"
    })
    token = login_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Note
    create_res = client.post("/api/v1/notes", headers=headers, json={
        "title": "Automated Pytest Note",
        "content": "Testing RBAC and ESR index queries."
    })
    assert create_res.status_code == 201
    created_note = create_res.json()["data"]
    note_id = created_note["_id"]

    # 2. List User Notes (with pagination)
    list_res = client.get("/api/v1/notes?page=1&limit=5", headers=headers)
    assert list_res.status_code == 200
    list_body = list_res.json()
    assert list_body["status"] is True
    assert list_body["total"] >= 1
    assert any(n["_id"] == note_id for n in list_body["data"])

    # 3. Read specific Note
    get_res = client.get(f"/api/v1/notes/{note_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["title"] == "Automated Pytest Note"

    # 4. Update Note
    update_res = client.put(f"/api/v1/notes/{note_id}", headers=headers, json={
        "title": "Automated Pytest Note Updated",
        "content": "Updated content successfully."
    })
    assert update_res.status_code == 200
    assert update_res.json()["data"]["title"] == "Automated Pytest Note Updated"

    # 5. User tries to view Admin endpoint /api/v1/notes/all -> Expect 403 Forbidden
    forbidden_res = client.get("/api/v1/notes/all", headers=headers)
    assert forbidden_res.status_code == 403

    # 6. Delete Note
    del_res = client.delete(f"/api/v1/notes/{note_id}", headers=headers)
    assert del_res.status_code == 200

def test_rbac_non_admin_cannot_access_user_management():
    # Standard user cannot access admin users list
    login_res = client.post("/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "User@123"
    })
    token = login_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/users", headers=headers)
    assert res.status_code == 403

def test_admin_capabilities():
    # Login admin
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "Admin@123"
    })
    admin_token = login_res.json()["data"]["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin can view everyone's notes
    all_notes_res = client.get("/api/v1/notes/all?page=1&limit=10", headers=admin_headers)
    assert all_notes_res.status_code == 200
    assert all_notes_res.json()["status"] is True
    assert len(all_notes_res.json()["data"]) > 0

    # 2. Admin can list all users
    users_res = client.get("/api/v1/admin/users?page=1&limit=10", headers=admin_headers)
    assert users_res.status_code == 200
    assert users_res.json()["total"] >= 2

    # 3. Admin creates a user
    new_user_res = client.post("/api/v1/admin/users", headers=admin_headers, json={
        "name": "David Dev",
        "email": "david@example.com",
        "password": "Password@123",
        "role": "user",
        "interests": ["chess", "golang"]
    })
    assert new_user_res.status_code == 201
    created_user_id = new_user_res.json()["data"]["_id"]

    # 4. Admin updates user
    upd_res = client.put(f"/api/v1/admin/users/{created_user_id}", headers=admin_headers, json={
        "name": "David Developer",
        "interests": ["chess", "golang", "fastapi"]
    })
    assert upd_res.status_code == 200
    assert upd_res.json()["data"]["name"] == "David Developer"

    # 5. Admin deletes user
    del_res = client.delete(f"/api/v1/admin/users/{created_user_id}", headers=admin_headers)
    assert del_res.status_code == 200

def test_scenario_1_group_by_interests():
    res = client.get("/api/v1/aggregations/group-by-interests")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] is True
    groups = body["data"]
    assert len(groups) > 0
    # Verify shape: interest, userCount, users
    for g in groups:
        assert "interest" in g
        assert "userCount" in g
        assert isinstance(g["users"], list)
        assert g["userCount"] == len(g["users"])
    # Chess should be present
    chess_group = next((g for g in groups if g["interest"].lower() == "chess"), None)
    assert chess_group is not None
    assert chess_group["userCount"] >= 1

def test_scenario_2_user_posts_lookup():
    # Fetch Alice's ID
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "Admin@123"
    })
    token = admin_login.json()["data"]["token"]
    users_res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    alice = next(u for u in users_res.json()["data"] if u["email"] == "user@example.com")
    alice_id = alice["_id"]

    # Run Scenario 2 Aggregation
    res = client.get(f"/api/v1/aggregations/user-posts/{alice_id}")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] is True
    data = body["data"]
    assert data["_id"] == alice_id
    assert "posts" in data
    assert isinstance(data["posts"], list)
    assert data["postsCount"] == len(data["posts"])
    assert len(data["posts"]) >= 1

def test_database_indexes_audit():
    res = client.get("/api/v1/aggregations/indexes")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "users" in data
    assert "notes" in data
    assert "posts" in data
    assert data["criticalConstraintAudit"]["verdict"] == "PASSED - NO UNNECESSARY INDEXES"

def test_invalid_id_format_returns_400():
    res = client.get("/api/v1/aggregations/user-posts/invalid-id-123")
    assert res.status_code == 400
    assert res.json()["status"] is False

def test_public_posts_pagination():
    res = client.get("/api/v1/posts?page=1&limit=2")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] is True
    assert "data" in body
    assert body["page"] == 1
    assert body["limit"] == 2
    assert "total" in body
