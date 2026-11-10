from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class NoteCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Title of the note")
    content: str = Field(..., min_length=1, description="Body content of the note")

class NoteUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)

class NoteResponse(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    content: str
    userId: str
    authorName: Optional[str] = None
    authorEmail: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)
