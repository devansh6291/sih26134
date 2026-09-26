from typing import Any, Dict, List, Literal, Optional

from pydantic import EmailStr, Field, field_validator
from app.schemas.base import BaseCamelModel

class UserRegister(BaseCamelModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    role_type: Literal[
        "candidate",
        "recruiter",
        "trainer",
        "mentor",
        "institute_admin",
        "policy_officer",
    ]
    org_name: Optional[str] = None
    district_id: Optional[str] = None
    location_pref: Optional[str] = None
    skills: List[str] = Field(default_factory=list, max_length=100)

    @field_validator("role_type", mode="before")
    @classmethod
    def normalize_role_type(cls, value: str) -> str:
        role_aliases = {
            "instituteadmin": "institute_admin",
            "policyofficer": "policy_officer",
        }
        normalized = str(value).strip().lower()
        return role_aliases.get(normalized, normalized)

class UserLogin(BaseCamelModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class TokenResponse(BaseCamelModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role_type: str
    full_name: str
    email: EmailStr

class CandidateProfileOut(BaseCamelModel):
    user_id: int
    readiness_score: float
    skill_gap_profile: Dict[str, Any]
    location_pref: str

class MentorProfileOut(BaseCamelModel):
    mentor_id: int
    expertise_tags: List[str]
    assigned_review_queue: List[int]