from datetime import datetime, timezone
from typing import Dict, Any, Tuple, List
from bson import ObjectId
from fastapi import HTTPException, status
from modules.post.schemas import PostCreateRequest

def format_post_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return None
    d = dict(doc)
    d["_id"] = str(d["_id"])
    if "userId" in d and isinstance(d["userId"], ObjectId):
        d["userId"] = str(d["userId"])
    return d

class PostRepository:
    @staticmethod
    def create_post(db, user_id: str, data: PostCreateRequest) -> Dict[str, Any]:
        try:
            user_oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Invalid user ID format.", "error": "INVALID_ID_FORMAT"}
            )

        now = datetime.now(timezone.utc)
        post_doc = {
            "title": data.title.strip(),
            "content": data.content.strip(),
            "userId": user_oid,
            "createdAt": now,
            "updatedAt": now
        }

        res = db.posts.insert_one(post_doc)
        post_doc["_id"] = res.inserted_id
        return format_post_doc(post_doc)

    @staticmethod
    def list_posts(db, page: int = 1, limit: int = 10) -> Tuple[List[Dict[str, Any]], int, int]:
        """
        List Operation Indexing:
        Query uses sort on 'createdAt' (Descending) supported by idx_posts_createdAt_desc.
        Eliminates in-memory sorting.
        """
        page = max(1, page)
        limit = max(1, min(100, limit))
        skip = (page - 1) * limit

        total = db.posts.count_documents({})
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        cursor = db.posts.find({}).sort("createdAt", -1).skip(skip).limit(limit)
        posts_raw = list(cursor)

        # Attach author names
        user_ids = list({p["userId"] for p in posts_raw if "userId" in p})
        user_map = {}
        if user_ids:
            for u in db.users.find({"_id": {"$in": user_ids}}, {"name": 1}):
                user_map[str(u["_id"])] = u.get("name")

        posts = []
        for p in posts_raw:
            formatted = format_post_doc(p)
            formatted["authorName"] = user_map.get(str(formatted.get("userId")), "Unknown")
            posts.append(formatted)

        return posts, total, total_pages

