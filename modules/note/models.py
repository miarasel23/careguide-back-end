"""
Note Domain Model & Indexing Strategy Definition
Follows Care Guide Interview modular domain architecture.

==========================================================================
CRITICAL CONSTRAINT: DO NOT MAKE ANY UNNECESSARY INDEXES.
==========================================================================
1. { userId: 1, createdAt: -1 } (COMPOUND)
   Supports: User listing their own notes with pagination and chronological sorting.
   ESR Rule: Equality on userId, Sort on createdAt.
   Query: db.notes.find({"userId": user_id}).sort("createdAt", -1).skip(...).limit(...)
   Prevents in-memory sorting and full collection scans.

2. { createdAt: -1 }
   Supports: Admin listing notes across all users with pagination.
   Query: db.notes.find({}).sort("createdAt", -1).skip(...).limit(...)
"""

from typing import List, Dict, Any

class NoteModel:
    COLLECTION_NAME = "notes"

    SCHEMA_INDEXES: List[Dict[str, Any]] = [
        {
            "keys": [("userId", 1), ("createdAt", -1)],
            "options": {"name": "idx_notes_userId_createdAt"},
            "purpose": "Compound index for user notes list pagination (ESR compliant)"
        },
        {
            "keys": [("createdAt", -1)],
            "options": {"name": "idx_notes_createdAt_desc"},
            "purpose": "Admin all-notes list view pagination without in-memory sort"
        }
    ]

