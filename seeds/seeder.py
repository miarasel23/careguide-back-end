import logging
from datetime import datetime, timezone, timedelta
from services.hash_service import Hash
from core.database import get_database

logger = logging.getLogger("uvicorn")

def run_seeders():
    """
    Seeds initial users, notes, and posts for testing and evaluation.
    Follows Care Guide Interview seeder pattern.
    """
    db = get_database()
    logger.info("[Seeder] Checking database seed data...")

    now = datetime.now(timezone.utc)

    # 1. Seed Users if collection is empty or admin doesn't exist
    admin_user = db.users.find_one({"email": "admin@example.com"})
    if not admin_user:
        logger.info("[Seeder] Seeding initial admin and standard users...")
        users_to_seed = [
            {
                "name": "Platform Administrator",
                "email": "admin@example.com",
                "password": Hash.bcrypt("Admin@123"),
                "role": "admin",
                "interests": ["chess", "reading", "travel", "technology"],
                "createdAt": now - timedelta(days=10),
                "updatedAt": now - timedelta(days=10)
            },
            {
                "name": "Standard User Alice",
                "email": "user@example.com",
                "password": Hash.bcrypt("User@123"),
                "role": "user",
                "interests": ["reading", "coding", "photography"],
                "createdAt": now - timedelta(days=8),
                "updatedAt": now - timedelta(days=8)
            },
            {
                "name": "Bob Chess Enthusiast",
                "email": "bob@example.com",
                "password": Hash.bcrypt("User@123"),
                "role": "user",
                "interests": ["chess", "gaming", "music"],
                "createdAt": now - timedelta(days=6),
                "updatedAt": now - timedelta(days=6)
            },
            {
                "name": "Charlie Reader",
                "email": "charlie@example.com",
                "password": Hash.bcrypt("User@123"),
                "role": "user",
                "interests": ["reading", "history", "philosophy"],
                "createdAt": now - timedelta(days=4),
                "updatedAt": now - timedelta(days=4)
            }
        ]
        db.users.insert_many(users_to_seed)
        logger.info("[Seeder] Users seeded successfully.")

    # Refresh references
    admin = db.users.find_one({"email": "admin@example.com"})
    alice = db.users.find_one({"email": "user@example.com"})
    bob = db.users.find_one({"email": "bob@example.com"})

    # 2. Seed Notes if notes collection is empty
    if db.notes.count_documents({}) == 0 and admin and alice:
        logger.info("[Seeder] Seeding notes...")
        notes_to_seed = [
            {
                "title": "Admin Project Roadmap 2026",
                "content": "Deploy microservices architecture, implement zero-trust authorization, and optimize database aggregations.",
                "userId": admin["_id"],
                "createdAt": now - timedelta(days=5),
                "updatedAt": now - timedelta(days=5)
            },
            {
                "title": "System Architecture & Security Audit",
                "content": "Verify JWT token expiration, password bcrypt hashing cost factor, and ESR compound indexes.",
                "userId": admin["_id"],
                "createdAt": now - timedelta(days=3),
                "updatedAt": now - timedelta(days=3)
            },
            {
                "title": "Alice's First Secure Note",
                "content": "Remember to practice React hooks and FastAPI dependency injection today.",
                "userId": alice["_id"],
                "createdAt": now - timedelta(days=4),
                "updatedAt": now - timedelta(days=4)
            },
            {
                "title": "Book Recommendations for Spring",
                "content": "1. Designing Data-Intensive Applications\n2. Clean Code\n3. High Performance Browser Networking",
                "userId": alice["_id"],
                "createdAt": now - timedelta(days=2),
                "updatedAt": now - timedelta(days=2)
            },
            {
                "title": "Alice's Daily Standup Notes",
                "content": "Completed user authentication UI and integrated with FastAPI backend endpoints.",
                "userId": alice["_id"],
                "createdAt": now - timedelta(hours=5),
                "updatedAt": now - timedelta(hours=5)
            }
        ]
        db.notes.insert_many(notes_to_seed)
        logger.info("[Seeder] Notes seeded successfully.")

    # 3. Seed Posts if posts collection is empty
    if db.posts.count_documents({}) == 0 and alice and bob:
        logger.info("[Seeder] Seeding public posts for Scenario 2 demonstration...")
        posts_to_seed = [
            {
                "title": "Mastering MongoDB Aggregations",
                "content": "Using $unwind and $lookup transforms relational style joins into highly efficient document pipelines.",
                "userId": alice["_id"],
                "createdAt": now - timedelta(days=3),
                "updatedAt": now - timedelta(days=3)
            },
            {
                "title": "FastAPI with Clean Care Guide Interview Architecture",
                "content": "Separating domain routers, repositories, models, and schemas keeps large codebases modular and maintainable.",
                "userId": alice["_id"],
                "createdAt": now - timedelta(days=1),
                "updatedAt": now - timedelta(days=1)
            },
            {
                "title": "Chess Endgame Tactics",
                "content": "King and pawn endgames require strict opposition calculation.",
                "userId": bob["_id"],
                "createdAt": now - timedelta(days=2),
                "updatedAt": now - timedelta(days=2)
            }
        ]
        db.posts.insert_many(posts_to_seed)
        logger.info("[Seeder] Posts seeded successfully.")

    logger.info("[Seeder] Seeding check complete.")

