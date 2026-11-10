# Secure Note-Taking REST API

> **Backend Technical Interview Submission**  
> **Candidate / Author:** Md Rasel Mia  
> **Phone:** 01997709990  
> **Email:** eng.rasel1994@gmail.com  
> **Framework:** Python FastAPI  
> **Architecture:** Care Guide Interview Modular Domain Architecture  
> **Database:** MongoDB (PyMongo with seamless in-memory fallback)  

---

## 1. Architecture & Design Principles

The backend is developed with Python FastAPI following modular domain architecture:

```
interview-back-end/
├── main.py                          # FastAPI application entry point, CORS, routers & exception handlers
├── requirements.txt                 # Dependencies (fastapi, uvicorn, pymongo, pyjwt, bcrypt, mongomock)
├── .env.example                     # Environment template
├── core/
│   ├── config.py                    # Environment settings loader
│   └── database.py                  # PyMongo client & index initialization (with fallback)
├── modules/
│   ├── apiResponse/                 # Care Guide Interview unified response & error handling
│   │   ├── response.py              # custom_response() envelope
│   │   ├── custom_error_handler.py  # Global HTTP & Validation exception handlers
│   │   ├── error_code.py            # ApiResponseCode HTTP status dictionary
│   │   └── response_schemas.py      # Standard response Pydantic models
│   ├── user/                        # User Domain
│   │   ├── models.py                # UserModel & schema.index declarations
│   │   ├── schemas.py               # Pydantic schemas (Register, Login, Admin CRUD)
│   │   ├── user_repository/         # UserRepository (business logic & indexed queries)
│   │   └── user_routers/            # auth_route.py & admin_users_route.py
│   ├── note/                        # Note Domain
│   │   ├── models.py                # NoteModel & ESR index declarations
│   │   ├── schemas.py               # Pydantic note schemas
│   │   ├── note_repository/         # NoteRepository (paginated queries, ownership checks)
│   │   └── note_routers/            # note_router.py
│   ├── post/                        # Post Domain (Scenario 2 collection)
│   │   ├── models.py                # PostModel & foreignField index declarations
│   │   ├── schemas.py               # Pydantic post schemas
│   │   ├── post_repository/         # PostRepository
│   │   └── post_routers/            # post_router.py
│   └── aggregation/                 # Aggregations & Database Index Inspector
│       ├── aggregation_repository/  # Implements Scenario 1 & 2 aggregation pipelines
│       └── aggregation_routers/     # aggregation_router.py
├── services/
│   ├── cors_service.py              # CORS configuration
│   ├── jwt_service.py               # JWT token generation, decode, and RBAC middleware
│   └── hash_service.py              # Secure Bcrypt password hashing
├── seeds/
│   └── seeder.py                    # Initial seed data (Admin, Alice, Bob, notes, posts)
└── tests/
    └── test_api.py                  # Comprehensive Pytest suite (14/14 automated tests)
```

---

## 2. Roles & Permissions (RBAC)

| Capability | `user` Role | `admin` Role |
| :--- | :---: | :---: |
| **Create, Update, Delete own notes** | ✅ Yes | ✅ Yes (Inherited) |
| **View paginated list of own notes** | ✅ Yes | ✅ Yes (Inherited) |
| **View everyone's notes across the system** | ❌ Forbidden (403) | ✅ Yes |
| **Manage users (Add, Update, Delete, List)** | ❌ Forbidden (403) | ✅ Yes |
| **Publish community posts** | ✅ Yes | ✅ Yes |
| **Execute Aggregation Pipelines** | ✅ Yes | ✅ Yes |

---

## 3. Database Indexing Strategy (ESR Rule Compliance)

> **Critical Constraint:**  
> **"DO NOT MAKE ANY UNNECESSARY INDEXES. You will be evaluated on the efficiency of your indexing strategy."**  
> Exactly 7 custom indexes are defined across 3 collections. Every index directly matches an active query filter, sort key, or aggregation stage:

### 1. `users` Collection (3 custom indexes)
- `{ email: 1 }` (`unique=True`): O(1) user lookup during login and registration duplicate prevention.
- `{ createdAt: -1 }`: Admin paginated user list sorted chronologically descending.
- `{ interests: 1 }`: Multikey index supporting Scenario 1 aggregation ($unwind and grouping by interests).

### 2. `notes` Collection (2 custom indexes)
- `{ userId: 1, createdAt: -1 }` (Compound ESR):
  - **Equality:** `userId == current_user._id`
  - **Sort:** `createdAt: -1`
  - Prevents collection scans and in-memory sorting when a user retrieves their paginated notes.
- `{ createdAt: -1 }`:
  - Supports admin view fetching paginated notes across all users sorted chronologically.

### 3. `posts` Collection (2 custom indexes)
- `{ userId: 1, createdAt: -1 }` (Compound):
  - Supports Scenario 2 `$lookup` join on `foreignField: "userId"` and chronological ordering.
- `{ createdAt: -1 }`:
  - Supports public paginated community posts feed sorted chronologically.

---

## 4. Aggregation Pipelines

### Scenario 1: Group Users by Interests (Single `aggregate()` call)
```python
pipeline = [
    { "$unwind": "$interests" },
    {
        "$group": {
            "_id": "$interests",
            "count": { "$sum": 1 },
            "users": {
                "$push": {
                    "_id": { "$toString": "$_id" },
                    "name": "$name",
                    "email": "$email",
                    "role": "$role"
                }
            }
        }
    },
    { "$sort": { "count": -1, "_id": 1 } },
    {
        "$project": {
            "_id": 0,
            "interest": "$_id",
            "userCount": "$count",
            "users": 1
        }
    }
]
```

### Scenario 2: User Posts `$lookup` Join
```python
pipeline = [
    { "$match": { "_id": user_obj_id } },
    {
        "$lookup": {
            "from": "posts",
            "let": { "uid": { "$toString": "$_id" } },
            "pipeline": [
                {
                    "$match": {
                        "$expr": {
                            "$or": [
                                { "$eq": ["$userId", "$$uid"] },
                                { "$eq": ["$userId", user_obj_id] }
                            ]
                        }
                    }
                },
                { "$sort": { "createdAt": -1 } }
            ],
            "as": "posts"
        }
    },
    {
        "$project": {
            "_id": 1,
            "name": 1,
            "email": 1,
            "role": 1,
            "interests": 1,
            "postsCount": { "$size": "$posts" },
            "posts": 1
        }
    }
]
```

---

## 5. Pre-Seeded Accounts

| Account | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Admin@123` | `admin` |
| **Standard User (Alice)** | `user@example.com` | `User@123` | `user` |
| **Test User (Bob)** | `bob@example.com` | `User@123` | `user` |

---

## 6. How to Setup & Run

### 1. Setup Virtual Environment & Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 2. Run the Application
```bash
./venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API Base URL: `http://localhost:8000/api/v1`
- Interactive Swagger Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 3. Run Automated Tests
```bash
PYTHONPATH=. ./venv/bin/pytest tests/test_api.py -v
```
*(Runs 14/14 automated tests covering Auth, RBAC, Notes CRUD, Admin User Management, Scenario 1, Scenario 2, and Live Index Audit).*

