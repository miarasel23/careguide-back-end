"""
User Domain Model & Indexing Strategy Definition
Follows Care Guide Interview modular domain architecture.

==========================================================================
CRITICAL CONSTRAINT: DO NOT MAKE ANY UNNECESSARY INDEXES.
==========================================================================
1. { email: 1 } (UNIQUE)
   Supports: O(1) read during login authentication, registration uniqueness checks.
   Query: db.users.find_one({"email": email})

2. { createdAt: -1 }
   Supports: Admin user list pagination sorted chronologically descending.
   Query: db.users.find().sort("createdAt", -1).skip(...).limit(...)
   Prevents in-memory sort blocking.

3. { interests: 1 } (MULTIKEY)
   Supports: Scenario 1 Aggregation (Group by Interests) and queries filtering by interests.
   Pipeline: $match on interests, $unwind on interests.
"""

from typing import List, Dict, Any

class UserModel:
    COLLECTION_NAME = "users"

    # Explicit schema indexes definition for code review visibility
    SCHEMA_INDEXES: List[Dict[str, Any]] = [
        {
            "keys": [("email", 1)],
            "options": {"unique": True, "name": "idx_users_email_unique"},
            "purpose": "O(1) lookup during login & conflict check on registration"
        },
        {
            "keys": [("createdAt", -1)],
            "options": {"name": "idx_users_createdAt_desc"},
            "purpose": "Admin users list pagination without memory sort"
        },
        {
            "keys": [("interests", 1)],
            "options": {"name": "idx_users_interests_multikey"},
            "purpose": "Multikey index for Scenario 1 Aggregation: Group by Interests"
        }
    ]

