from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from bson import ObjectId
from core.config import settings
from core.database import get_db

security = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT access token.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "exp": expire,
        "iat": now,
        "sub": str(data.get("sub", data.get("_id", data.get("id"))))
    })
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": f"Invalid or expired token: {str(e)}", "error": "TOKEN_INVALID"}
        )

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db = Depends(get_db)
) -> Dict[str, Any]:
    """
    FastAPI dependency that extracts and authenticates the current user from the Bearer token.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Authorization header with Bearer token is missing.", "error": "UNAUTHORIZED"}
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Token payload missing user identifier ('sub').", "error": "TOKEN_INVALID"}
        )

    try:
        user_object_id = ObjectId(user_id_str)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Malformed user ID in token payload.", "error": "TOKEN_INVALID"}
        )

    # Read Operation Indexing: Supported by default primary _id index
    user = db.users.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "User belonging to this token no longer exists.", "error": "USER_NOT_FOUND"}
        )

    user["_id"] = str(user["_id"])
    if "password" in user:
        del user["password"]

    return user

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    FastAPI dependency enforcing RBAC Admin privileges.
    Allows only users with role == 'admin'.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Forbidden. This action requires Administrator privileges.", "error": "ACCESS_DENIED"}
        )
    return current_user

