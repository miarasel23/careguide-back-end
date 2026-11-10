from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from modules.apiResponse.error_code import ApiResponseCode

async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """
    Handles standard HTTPExceptions using Care Guide Interview unified error envelope.
    """
    detail = exc.detail
    error_code = "HTTP_ERROR"
    if isinstance(detail, dict):
        message = detail.get("message", "An error occurred")
        error_code = detail.get("error", "HTTP_ERROR")
    else:
        message = str(detail) if detail else "An error occurred"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": False,
            "message": message,
            "error": error_code,
            "data": None
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handles Pydantic request validation exceptions using Care Guide Interview unified error envelope.
    """
    errors = exc.errors()
    message_parts = []
    for err in errors:
        loc = " -> ".join([str(l) for l in err.get("loc", []) if l != "body"])
        msg = f"{loc}: {err.get('msg', 'Invalid field')}" if loc else err.get("msg", "Invalid field")
        message_parts.append(msg)

    return JSONResponse(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["bad_request"],
        content={
            "status": False,
            "message": "; ".join(message_parts) if message_parts else "Validation error",
            "error": "VALIDATION_ERROR",
            "data": None
        }
    )

