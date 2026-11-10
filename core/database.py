import logging
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from core.config import settings

logger = logging.getLogger("uvicorn")

_mongo_client = None
_database = None
_is_in_memory = False

def get_mongo_client():
    global _mongo_client, _database, _is_in_memory
    if _mongo_client is not None:
        return _mongo_client

    # Attempt connection to configured MongoDB URI
    try:
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Verify connection
        client.admin.command("ping")
        _mongo_client = client
        _database = client[settings.MONGODB_DB_NAME]
        _is_in_memory = False
        logger.info(f"[Database] Connected successfully to MongoDB: {settings.MONGODB_URI}")
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
        logger.warning(f"[Database] Could not connect to primary MongoDB at {settings.MONGODB_URI}: {e}")
        logger.info("[Database] Initializing seamless in-memory MongoDB engine (mongomock)...")
        import mongomock
        _mongo_client = mongomock.MongoClient()
        _database = _mongo_client[settings.MONGODB_DB_NAME]
        _is_in_memory = True
        logger.info("[Database] In-memory MongoDB initialized successfully.")

    return _mongo_client

def get_database():
    global _database
    if _database is None:
        get_mongo_client()
    return _database

def get_db():
    """
    FastAPI dependency that provides the active MongoDB database instance.
    Follows Care Guide Interview dependency pattern: `db = Depends(get_db)`.
    """
    return get_database()

def is_in_memory_db() -> bool:
    return _is_in_memory

def init_database_indexes():
    """
    Initializes strictly required MongoDB indexes across collections.
    Constraint: DO NOT MAKE ANY UNNECESSARY INDEXES.
    Every index strictly supports a query, list view pagination, or aggregation pipeline.
    """
    db = get_database()
    logger.info("[Database] Initializing database indexes...")

    # ─────────────────────────────────────────────────────────────
    # 1. USERS COLLECTION INDEXES
    # ─────────────────────────────────────────────────────────────
    # Index 1: Unique index on email
    # Supports: O(1) lookup during login, registration uniqueness conflict check, and read by email.
    db.users.create_index([("email", ASCENDING)], unique=True, name="idx_users_email_unique")

    # Index 2: Index on createdAt (Descending)
    # Supports: Admin user list view with pagination and date sorting without in-memory sort.
    # Query: db.users.find().sort("createdAt", -1).skip(...).limit(...)
    db.users.create_index([("createdAt", DESCENDING)], name="idx_users_createdAt_desc")

    # Index 3: Multikey index on interests
    # Supports: Scenario 1 Aggregation (Group by Interests) and queries filtering by interests.
    db.users.create_index([("interests", ASCENDING)], name="idx_users_interests_multikey")

    # ─────────────────────────────────────────────────────────────
    # 2. NOTES COLLECTION INDEXES
    # ─────────────────────────────────────────────────────────────
    # Index 1: Compound index { userId: 1, createdAt: -1 }
    # Supports: Primary user list view with pagination.
    # Query: db.notes.find({"userId": user_id}).sort("createdAt", -1).skip(...).limit(...)
    # ESR Rule compliant: Equality on userId, Sort on createdAt. Eliminates in-memory sort stage.
    db.notes.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)], name="idx_notes_userId_createdAt")

    # Index 2: Index on createdAt (Descending)
    # Supports: Admin global notes list view across all users with pagination.
    # Query: db.notes.find({}).sort("createdAt", -1).skip(...).limit(...)
    db.notes.create_index([("createdAt", DESCENDING)], name="idx_notes_createdAt_desc")

    # ─────────────────────────────────────────────────────────────
    # 3. POSTS COLLECTION INDEXES
    # ─────────────────────────────────────────────────────────────
    # Index 1: Compound index { userId: 1, createdAt: -1 }
    # Supports: Scenario 2 Aggregation ($lookup join on foreignField: 'userId') and user posts sorting.
    # Prevents full collection scans during $lookup aggregation stage.
    db.posts.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)], name="idx_posts_userId_createdAt")

    # Index 2: Index on createdAt (Descending)
    # Supports: Public posts list operation with pagination.
    # Query: db.posts.find({}).sort("createdAt", -1).skip(...).limit(...)
    db.posts.create_index([("createdAt", DESCENDING)], name="idx_posts_createdAt_desc")

    logger.info("[Database] All required database indexes verified successfully.")

