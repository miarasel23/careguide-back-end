from fastapi import APIRouter, Depends, Query
from core.database import get_db
from modules.apiResponse.response import custom_response
from modules.apiResponse.error_code import ApiResponseCode
from modules.post.schemas import PostCreateRequest
from modules.post.post_repository.post_repository import PostRepository
from services.jwt_service import get_current_user

router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])

@router.post("")
async def create_post(
    request: PostCreateRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    created = PostRepository.create_post(db, current_user["_id"], request)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["created"],
        message="Post published successfully.",
        data=created
    )

@router.get("")
async def list_public_posts(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db = Depends(get_db)
):
    """
    Public posts feed with pagination.
    Supported by index: { createdAt: -1 }.
    """
    posts, total, total_pages = PostRepository.list_posts(db, page, limit)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="Public posts retrieved successfully.",
        data=posts,
        page=page,
        limit=limit,
        total=total,
        totalPages=total_pages
    )

