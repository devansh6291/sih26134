from datetime import datetime
from typing import List, Literal, Optional

from pydantic import AliasChoices, Field, field_validator

from app.schemas.base import BaseCamelModel


ApplicationStatus = Literal["under_review", "shortlisted", "rejected"]


class JobCreate(BaseCamelModel):
    title: str = Field(min_length=1, max_length=255)
    company: str = Field(min_length=1, max_length=255)
    location: str = Field(min_length=1, max_length=255)
    job_type: str = Field(
        validation_alias=AliasChoices("jobType", "job_type", "type"),
        min_length=1,
        max_length=50,
    )
    experience: str = Field(min_length=1, max_length=255)
    salary: str = Field(min_length=1, max_length=255)
    skills: List[str] = Field(default_factory=list)
    description: str = Field(default="", max_length=10000)

    @field_validator("title", "company", "location", "experience", "salary")
    @classmethod
    def require_non_blank_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class JobOut(BaseCamelModel):
    job_id: int
    recruiter_id: int
    title: str
    company: str
    location: str
    job_type: str
    experience: str
    salary: str
    skills: List[str]
    description: str
    status: str
    published_at: datetime
    applicant_count: int = 0


class CandidateSummary(BaseCamelModel):
    user_id: int
    full_name: str
    email: str
    location: str = ""
    skills: List[str] = Field(default_factory=list)
    readiness: float = 0
    phone: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    summary: Optional[str] = None
    resume: Optional[str] = None


class JobSummary(BaseCamelModel):
    job_id: int
    title: str
    company: str


class ApplicationCreate(BaseCamelModel):
    cover_note: Optional[str] = Field(default=None, max_length=2000)


class ApplicationStatusUpdate(BaseCamelModel):
    status: ApplicationStatus
    note: Optional[str] = Field(default=None, max_length=2000)


class RecruiterApplicationOut(BaseCamelModel):
    application_id: int
    job_id: int
    job_title: str
    company: str
    candidate: CandidateSummary
    status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime


class CandidateApplicationOut(BaseCamelModel):
    application_id: int
    job: JobSummary
    status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime


class NotificationOut(BaseCamelModel):
    notification_id: int
    application_id: Optional[int]
    notification_type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime


class NotificationReadOut(BaseCamelModel):
    notification_id: int
    is_read: bool
    read_at: Optional[datetime]
