from fastapi import APIRouter, Depends, status
from core.database import get_db
from modules.apiResponse.response import custom_response
from modules.apiResponse.error_code import ApiResponseCode
from modules.user.schemas import UserRegisterRequest, UserLoginRequest
from modules.user.user_repository.user_repository import UserRepository
from services.jwt_service import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register")
async def register(request: UserRegisterRequest, db = Depends(get_db)):
    result = UserRepository.register_user(db, request)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["created"],
        message="User registered successfully.",
        data=result
    )

@router.post("/login")
async def login(request: UserLoginRequest, db = Depends(get_db)):
    result = UserRepository.login_user(db, request)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="Authentication successful.",
        data=result
    )

@router.get("/me")
async def get_current_profile(current_user = Depends(get_current_user)):
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="Profile retrieved successfully.",
        data=current_user
    )

