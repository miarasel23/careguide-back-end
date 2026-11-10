from fastapi import APIRouter, Depends
from core.database import get_db
from modules.apiResponse.response import custom_response
from modules.apiResponse.error_code import ApiResponseCode
from modules.aggregation.aggregation_repository.aggregation_repository import AggregationRepository
from services.jwt_service import get_current_user

router = APIRouter(prefix="/api/v1/aggregations", tags=["Aggregations & Indexing"])

@router.get("/group-by-interests")
async def group_by_interests(db = Depends(get_db)):
    """
    Scenario 1: Group by Interests.
    Uses exactly ONE collection.aggregate() call.
    Supported by multikey index on interests.
    """
    data = AggregationRepository.group_by_interests(db)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="Users grouped by interests successfully.",
        data=data
    )

@router.get("/user-posts/{userId}")
async def get_user_posts_with_lookup(userId: str, db = Depends(get_db)):
    """
    Scenario 2: User Posts ($lookup).
    Uses a single aggregation pipeline with a $lookup stage.
    Supported by compound index on posts { userId: 1, createdAt: -1 }.
    """
    data = AggregationRepository.get_user_posts_with_lookup(db, userId)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="User and posts retrieved via $lookup aggregation successfully.",
        data=data
    )

@router.get("/indexes")
async def inspect_database_indexes(db = Depends(get_db)):
    """
    Inspects live database indexes across all collections.
    Demonstrates zero unnecessary indexes and ESR rule compliance.
    """
    data = AggregationRepository.inspect_database_indexes(db)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="Database indexes inspected successfully.",
        data=data
    )

