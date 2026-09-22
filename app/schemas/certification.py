from datetime import datetime
from typing import List, Optional
from app.schemas.base import BaseCamelModel

class SkillTrackCreate(BaseCamelModel):
    track_name: str
    required_course_ids: List[str]
    certificate_validity_months: int = 12

class SkillTrackOut(BaseCamelModel):
    skill_track_id: int
    track_name: str
    required_course_ids: str
    certificate_validity_months: int

class PracticalSubmissionCreate(BaseCamelModel):
    skill_track_id: int
    video_link: str

class PracticalSubmissionOut(BaseCamelModel):
    submission_id: int
    candidate_id: int
    skill_track_id: int
    video_link: str
    video_platform: str
    submission_status: str
    submitted_at: datetime

class MentorEvaluationCreate(BaseCamelModel):
    submission_id: int
    evaluation_status: str 
    feedback_notes: str

class CertificateOut(BaseCamelModel):
    certificate_id: int
    skill_track_id: int
    candidate_id: int
    issued_date: datetime
    valid_until: datetime
    certificate_status: str
    verification_code: str