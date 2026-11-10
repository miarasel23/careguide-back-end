"""
Post Domain Model & Indexing Strategy Definition
Follows Care Guide Interview modular domain architecture.

==========================================================================
CRITICAL CONSTRAINT: DO NOT MAKE ANY UNNECESSARY INDEXES.
==========================================================================
1. { userId: 1, createdAt: -1 } (COMPOUND)
   Supports: Scenario 2 Aggregation ($lookup join on foreignField: 'userId')
   and chronological sorting of user posts. Prevents collection scans during $lookup.

2. { createdAt: -1 }
   Supports: Public posts list operation with pagination.
   Query: db.posts.find({}).sort("createdAt", -1).skip(...).limit(...)
"""

from typing import List, Dict, Any

class PostModel:
    COLLECTION_NAME = "posts"

    SCHEMA_INDEXES: List[Dict[str, Any]] = [
        {
            "keys": [("userId", 1), ("createdAt", -1)],
            "options": {"name": "idx_posts_userId_createdAt"},
            "purpose": "Compound index supporting Scenario 2 $lookup join foreignField scan"
        },
        {
            "keys": [("createdAt", -1)],
            "options": {"name": "idx_posts_createdAt_desc"},
            "purpose": "Public posts list pagination without in-memory sort"
        }
    ]

