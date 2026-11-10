from pydantic import BaseModel, ConfigDict
from typing import Any, Optional

class SuccessCustomApiResponse(BaseModel):
    status: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None
    page: Optional[int] = None
    limit: Optional[int] = None
    total: Optional[int] = None
    totalPages: Optional[int] = None

    model_config = ConfigDict(from_attributes=True, extra="allow")
