from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class PostCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Title of the post")
    content: str = Field(..., min_length=1, description="Body content of the post")

class PostResponse(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    content: str
    userId: str
    authorName: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)
