from fastapi import APIRouter, Depends, Query
from core.database import get_db
from modules.apiResponse.response import custom_response
from modules.apiResponse.error_code import ApiResponseCode
from modules.user.schemas import AdminCreateUserRequest, AdminUpdateUserRequest
from modules.user.user_repository.user_repository import UserRepository
from services.jwt_service import require_admin

router = APIRouter(prefix="/api/v1/admin/users", tags=["Admin User Management"])

@router.get("")
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    admin = Depends(require_admin),
    db = Depends(get_db)
):
    users, total, total_pages = UserRepository.list_users(db, page, limit)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="Users retrieved successfully.",
        data=users,
        page=page,
        limit=limit,
        total=total,
        totalPages=total_pages
    )

@router.post("")
async def create_user(
    request: AdminCreateUserRequest,
    admin = Depends(require_admin),
    db = Depends(get_db)
):
    created = UserRepository.admin_create_user(db, request)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["created"],
        message="User created successfully by administrator.",
        data=created
    )

@router.get("/{userId}")
async def get_user_by_id(
    userId: str,
    admin = Depends(require_admin),
    db = Depends(get_db)
):
    user = UserRepository.get_user_by_id(db, userId)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="User details retrieved successfully.",
        data=user
    )

@router.put("/{userId}")
async def update_user(
    userId: str,
    request: AdminUpdateUserRequest,
    admin = Depends(require_admin),
    db = Depends(get_db)
):
    updated = UserRepository.update_user(db, userId, request)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="User updated successfully.",
        data=updated
    )

@router.delete("/{userId}")
async def delete_user(
    userId: str,
    admin = Depends(require_admin),
    db = Depends(get_db)
):
    UserRepository.delete_user(db, userId)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="User deleted successfully.",
        data=None
    )

