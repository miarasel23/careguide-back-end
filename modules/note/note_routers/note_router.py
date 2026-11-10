from fastapi import APIRouter, Depends, Query
from core.database import get_db
from modules.apiResponse.response import custom_response
from modules.apiResponse.error_code import ApiResponseCode
from modules.note.schemas import NoteCreateRequest, NoteUpdateRequest
from modules.note.note_repository.note_repository import NoteRepository
from services.jwt_service import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/notes", tags=["Notes"])

@router.post("")
async def create_note(
    request: NoteCreateRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    created = NoteRepository.create_note(db, current_user["_id"], request)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["created"],
        message="Note created successfully.",
        data=created
    )

@router.get("")
async def list_user_notes(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    List user's own notes with pagination.
    Supported by compound index: { userId: 1, createdAt: -1 }.
    """
    notes, total, total_pages = NoteRepository.list_user_notes(db, current_user["_id"], page, limit)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="User notes retrieved successfully.",
        data=notes,
        page=page,
        limit=limit,
        total=total,
        totalPages=total_pages
    )

@router.get("/all")
async def list_all_notes_admin(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    admin = Depends(require_admin),
    db = Depends(get_db)
):
    """
    Admin only: view notes across all users with pagination.
    Supported by index: { createdAt: -1 }.
    """
    notes, total, total_pages = NoteRepository.list_all_notes(db, page, limit)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="All platform notes retrieved successfully.",
        data=notes,
        page=page,
        limit=limit,
        total=total,
        totalPages=total_pages
    )

@router.get("/{noteId}")
async def get_note(
    noteId: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    note = NoteRepository.get_note_by_id(db, noteId, current_user)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="Note retrieved successfully.",
        data=note
    )

@router.put("/{noteId}")
async def update_note(
    noteId: str,
    request: NoteUpdateRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    updated = NoteRepository.update_note(db, noteId, current_user, request)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="Note updated successfully.",
        data=updated
    )

@router.delete("/{noteId}")
async def delete_note(
    noteId: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    NoteRepository.delete_note(db, noteId, current_user)
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="Note deleted successfully.",
        data=None
    )

