from typing import List, Optional
from pydantic import BaseModel

class UserInterestGroupItem(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    role: str

class InterestGroupResponse(BaseModel):
    interest: str
    userCount: int
    users: List[UserInterestGroupItem]

