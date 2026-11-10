from typing import Any, Optional
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

def custom_response(
    status_code: int,
    message: str,
    data: Any = None,
    error: Optional[str] = None,
    **kwargs
) -> JSONResponse:
    """
    Standard Care Guide Interview API response envelope.
    Returns JSON format:
    {
        "status": true / false,
        "message": "...",
        "data": ...,
        "error": ... (optional),
        ...extra fields (pagination, etc.)
    }
    """
    # Remove numeric prefixes if present
    if isinstance(message, str) and ":" in message:
        parts = message.split(":", 1)
        if parts[0].isdigit():
            message = parts[1].strip()

    is_success = 200 <= status_code < 300

    response_body = {
        "status": is_success,
        "message": message,
    }

    # Add extra metadata (e.g. pagination: page, limit, total, totalPages)
    for key, val in kwargs.items():
        if val is not None:
            response_body[key] = val

    # If error occurred, include error details
    if error is not None:
        response_body["error"] = error

    # Data payload
    if data is not None:
        response_body["data"] = data

    return JSONResponse(content=jsonable_encoder(response_body), status_code=status_code)
