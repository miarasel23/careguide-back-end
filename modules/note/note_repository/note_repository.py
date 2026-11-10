from datetime import datetime, timezone
from typing import Dict, Any, Tuple, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from modules.note.schemas import NoteCreateRequest, NoteUpdateRequest

def format_note_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return None
    d = dict(doc)
    d["_id"] = str(d["_id"])
    if "userId" in d and isinstance(d["userId"], ObjectId):
        d["userId"] = str(d["userId"])
    return d

class NoteRepository:
    @staticmethod
    def create_note(db, user_id: str, data: NoteCreateRequest) -> Dict[str, Any]:
        try:
            user_oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Invalid user ID format.", "error": "INVALID_ID_FORMAT"}
            )

        now = datetime.now(timezone.utc)
        note_doc = {
            "title": data.title.strip(),
            "content": data.content.strip(),
            "userId": user_oid,
            "createdAt": now,
            "updatedAt": now
        }

        res = db.notes.insert_one(note_doc)
        note_doc["_id"] = res.inserted_id
        return format_note_doc(note_doc)

    @staticmethod
    def list_user_notes(db, user_id: str, page: int = 1, limit: int = 10) -> Tuple[List[Dict[str, Any]], int, int]:
        """
        List Operation Indexing:
        Query matches userId and sorts by createdAt descending.
        Strictly supported by compound index { userId: 1, createdAt: -1 } (ESR Rule).
        Eliminates in-memory sorting.
        """
        try:
            user_oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Invalid user ID format.", "error": "INVALID_ID_FORMAT"}
            )

        page = max(1, page)
        limit = max(1, min(100, limit))
        skip = (page - 1) * limit

        query = {"userId": user_oid}
        total = db.notes.count_documents(query)
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        cursor = db.notes.find(query).sort("createdAt", -1).skip(skip).limit(limit)
        notes = [format_note_doc(n) for n in cursor]

        return notes, total, total_pages

    @staticmethod
    def list_all_notes(db, page: int = 1, limit: int = 10) -> Tuple[List[Dict[str, Any]], int, int]:
        """
        Admin Operation Indexing:
        Admin listing notes across all users with pagination.
        Strictly supported by index { createdAt: -1 }.
        """
        page = max(1, page)
        limit = max(1, min(100, limit))
        skip = (page - 1) * limit

        total = db.notes.count_documents({})
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        cursor = db.notes.find({}).sort("createdAt", -1).skip(skip).limit(limit)
        notes_raw = list(cursor)

        # Enhance with author name/email for Admin overview
        user_ids = list({n["userId"] for n in notes_raw if "userId" in n})
        user_map = {}
        if user_ids:
            for u in db.users.find({"_id": {"$in": user_ids}}, {"name": 1, "email": 1}):
                user_map[str(u["_id"])] = u

        notes = []
        for n in notes_raw:
            formatted = format_note_doc(n)
            u_info = user_map.get(str(formatted.get("userId")))
            if u_info:
                formatted["authorName"] = u_info.get("name")
                formatted["authorEmail"] = u_info.get("email")
            notes.append(formatted)

        return notes, total, total_pages

    @staticmethod
    def get_note_by_id(db, note_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        try:
            oid = ObjectId(note_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": f"Invalid note ID format: '{note_id}'.", "error": "INVALID_ID_FORMAT"}
            )

        # Read Operation Indexing: Supported by primary _id index
        note = db.notes.find_one({"_id": oid})
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "Note not found.", "error": "NOTE_NOT_FOUND"}
            )

        # RBAC Check: Admin can view all notes; User can only view their own notes
        is_admin = current_user.get("role") == "admin"
        is_owner = str(note.get("userId")) == str(current_user.get("_id"))
        if not (is_admin or is_owner):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Access forbidden: you do not have permission to view this note.", "error": "ACCESS_DENIED"}
            )

        return format_note_doc(note)

    @staticmethod
    def update_note(db, note_id: str, current_user: Dict[str, Any], data: NoteUpdateRequest) -> Dict[str, Any]:
        try:
            oid = ObjectId(note_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": f"Invalid note ID format: '{note_id}'.", "error": "INVALID_ID_FORMAT"}
            )

        note = db.notes.find_one({"_id": oid})
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "Note not found for update.", "error": "NOTE_NOT_FOUND"}
            )

        # RBAC Check: Admin or Note Owner can update
        is_admin = current_user.get("role") == "admin"
        is_owner = str(note.get("userId")) == str(current_user.get("_id"))
        if not (is_admin or is_owner):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Access forbidden: you can only update your own notes.", "error": "ACCESS_DENIED"}
            )

        update_fields: Dict[str, Any] = {"updatedAt": datetime.now(timezone.utc)}
        if data.title is not None:
            update_fields["title"] = data.title.strip()
        if data.content is not None:
            update_fields["content"] = data.content.strip()

        updated = db.notes.find_one_and_update(
            {"_id": oid},
            {"$set": update_fields},
            return_document=True
        )
        return format_note_doc(updated)

    @staticmethod
    def delete_note(db, note_id: str, current_user: Dict[str, Any]) -> None:
        try:
            oid = ObjectId(note_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": f"Invalid note ID format: '{note_id}'.", "error": "INVALID_ID_FORMAT"}
            )

        note = db.notes.find_one({"_id": oid})
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "Note not found for deletion.", "error": "NOTE_NOT_FOUND"}
            )

        # RBAC Check: Admin or Note Owner can delete
        is_admin = current_user.get("role") == "admin"
        is_owner = str(note.get("userId")) == str(current_user.get("_id"))
        if not (is_admin or is_owner):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Access forbidden: you can only delete your own notes.", "error": "ACCESS_DENIED"}
            )

        db.notes.delete_one({"_id": oid})

