from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    email: EmailStr = Field(..., description="Unique email address")
    role: str = Field("user", description="Role: 'user' or 'admin'")
    interests: List[str] = Field(default_factory=list, description="List of interests (e.g. ['chess', 'reading'])")

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, description="Minimum 6 characters")
    role: Optional[str] = Field("user", pattern="^(user|admin)$")
    interests: Optional[List[str]] = Field(default_factory=list)

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminCreateUserRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field("user", pattern="^(user|admin)$")
    interests: Optional[List[str]] = Field(default_factory=list)

class AdminUpdateUserRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[str] = Field(None, pattern="^(user|admin)$")
    interests: Optional[List[str]] = None

class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: EmailStr
    role: str
    interests: List[str]
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)
