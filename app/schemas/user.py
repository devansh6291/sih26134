from pydantic import EmailStr
from typing import Optional, List, Dict, Any
from app.schemas.base import BaseCamelModel

class UserRegister(BaseCamelModel):
    email: EmailStr
    password: str
    full_name: str
    role_type: str
    org_name: Optional[str] = None
    district_id: Optional[str] = None
    location_pref: Optional[str] = None

class UserLogin(BaseCamelModel):
    email: EmailStr
    password: str

class TokenResponse(BaseCamelModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role_type: str
    full_name: str

class CandidateProfileOut(BaseCamelModel):
    user_id: int
    readiness_score: float
    skill_gap_profile: Dict[str, Any]
    location_pref: str

class MentorProfileOut(BaseCamelModel):
    mentor_id: int
    expertise_tags: List[str]
    assigned_review_queue: List[int]