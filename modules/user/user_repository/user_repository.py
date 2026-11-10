from datetime import datetime, timezone
from typing import Dict, Any, Tuple, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from services.hash_service import Hash
from services.jwt_service import create_access_token
from modules.user.schemas import UserRegisterRequest, UserLoginRequest, AdminCreateUserRequest, AdminUpdateUserRequest

def format_user_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return None
    d = dict(doc)
    d["_id"] = str(d["_id"])
    if "password" in d:
        del d["password"]
    return d

class UserRepository:
    @staticmethod
    def register_user(db, data: UserRegisterRequest) -> Dict[str, Any]:
        email = data.email.lower().strip()
        # Read Operation Indexing: Supported by unique index on email
        existing = db.users.find_one({"email": email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": f"A user with email '{email}' already exists.", "error": "EMAIL_ALREADY_EXISTS"}
            )

        now = datetime.now(timezone.utc)
        user_doc = {
            "name": data.name.strip(),
            "email": email,
            "password": Hash.bcrypt(data.password),
            "role": data.role or "user",
            "interests": [i.strip() for i in data.interests if i.strip()] if data.interests else [],
            "createdAt": now,
            "updatedAt": now
        }
        res = db.users.insert_one(user_doc)
        user_doc["_id"] = res.inserted_id

        # Generate JWT Token
        token = create_access_token({
            "sub": str(user_doc["_id"]),
            "email": user_doc["email"],
            "role": user_doc["role"],
            "name": user_doc["name"]
        })

        return {
            "user": format_user_doc(user_doc),
            "token": token
        }

    @staticmethod
    def login_user(db, data: UserLoginRequest) -> Dict[str, Any]:
        email = data.email.lower().strip()
        # Read Operation Indexing: Supported by unique index on email
        user = db.users.find_one({"email": email})
        if not user or not Hash.verify(user.get("password", ""), data.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "Invalid email or password credentials.", "error": "INVALID_CREDENTIALS"}
            )

        token = create_access_token({
            "sub": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "user"),
            "name": user.get("name")
        })

        return {
            "user": format_user_doc(user),
            "token": token
        }

    @staticmethod
    def list_users(db, page: int = 1, limit: int = 10) -> Tuple[List[Dict[str, Any]], int, int]:
        """
        List Operation Indexing:
        Query uses sort on 'createdAt' (Descending) supported by idx_users_createdAt_desc.
        Eliminates in-memory sorting.
        """
        page = max(1, page)
        limit = max(1, min(100, limit))
        skip = (page - 1) * limit

        total = db.users.count_documents({})
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        cursor = db.users.find({}, {"password": 0}).sort("createdAt", -1).skip(skip).limit(limit)
        users = [format_user_doc(u) for u in cursor]

        return users, total, total_pages

    @staticmethod
    def get_user_by_id(db, user_id: str) -> Dict[str, Any]:
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": f"Invalid user ID format: '{user_id}'.", "error": "INVALID_ID_FORMAT"}
            )

        # Read Operation Indexing: Supported by primary _id index
        user = db.users.find_one({"_id": oid}, {"password": 0})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "User not found.", "error": "USER_NOT_FOUND"}
            )
        return format_user_doc(user)

    @staticmethod
    def admin_create_user(db, data: AdminCreateUserRequest) -> Dict[str, Any]:
        email = data.email.lower().strip()
        # Read Operation Indexing: Supported by unique index on email
        existing = db.users.find_one({"email": email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": f"User with email '{email}' already exists.", "error": "EMAIL_ALREADY_EXISTS"}
            )

        now = datetime.now(timezone.utc)
        user_doc = {
            "name": data.name.strip(),
            "email": email,
            "password": Hash.bcrypt(data.password),
            "role": data.role,
            "interests": [i.strip() for i in data.interests if i.strip()] if data.interests else [],
            "createdAt": now,
            "updatedAt": now
        }
        res = db.users.insert_one(user_doc)
        user_doc["_id"] = res.inserted_id
        return format_user_doc(user_doc)

    @staticmethod
    def update_user(db, user_id: str, data: AdminUpdateUserRequest) -> Dict[str, Any]:
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": f"Invalid user ID format: '{user_id}'.", "error": "INVALID_ID_FORMAT"}
            )

        update_fields: Dict[str, Any] = {"updatedAt": datetime.now(timezone.utc)}
        if data.name is not None:
            update_fields["name"] = data.name.strip()
        if data.email is not None:
            new_email = data.email.lower().strip()
            # Verify uniqueness on update
            existing = db.users.find_one({"email": new_email, "_id": {"$ne": oid}})
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={"message": f"Email '{new_email}' is already in use by another account.", "error": "EMAIL_CONFLICT"}
                )
            update_fields["email"] = new_email
        if data.password is not None and len(data.password.strip()) >= 6:
            update_fields["password"] = Hash.bcrypt(data.password.strip())
        if data.role is not None:
            update_fields["role"] = data.role
        if data.interests is not None:
            update_fields["interests"] = [i.strip() for i in data.interests if i.strip()]

        res = db.users.find_one_and_update(
            {"_id": oid},
            {"$set": update_fields},
            return_document=True
        )
        if not res:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "User not found for update.", "error": "USER_NOT_FOUND"}
            )
        return format_user_doc(res)

    @staticmethod
    def delete_user(db, user_id: str) -> None:
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": f"Invalid user ID format: '{user_id}'.", "error": "INVALID_ID_FORMAT"}
            )

        res = db.users.delete_one({"_id": oid})
        if res.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "User not found for deletion.", "error": "USER_NOT_FOUND"}
            )

        # Cleanup dependent notes & posts
        db.notes.delete_many({"userId": oid})
        db.posts.delete_many({"userId": oid})

