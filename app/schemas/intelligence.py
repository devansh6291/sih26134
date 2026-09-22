from typing import List, Optional
from datetime import datetime
from app.schemas.base import BaseCamelModel

class JobPostingCreate(BaseCamelModel):
    role_title: str
    required_skills: List[str]
    location: str
    source_type: Optional[str] = "platform"

class JobPostingOut(BaseCamelModel):
    job_id: int
    role_title: str
    required_skills: List[str]
    location: str
    source_type: str
    posted_at: datetime

class PlacementFeedbackCreate(BaseCamelModel):
    candidate_rating: float
    recruiter_rating: float
    course_relevance_score: float

class PlacementFeedbackOut(BaseCamelModel):
    feedback_id: int
    candidate_rating: float
    recruiter_rating: float
    course_relevance_score: float

class SkillTagResult(BaseCamelModel):
    tagged_skill: str
    tagged_role: str
    tagged_location: str
    proficiency_level: str
    confidence_score: float

class CommunityPulseOut(BaseCamelModel):
    skill_tag: str
    thread_volume: int
    sentiment_score: float
    topic_shift_delta: float

class TrendVelocityOut(BaseCamelModel):
    skill_keyword: str
    mention_growth_rate: float
    is_emerging_flag: bool

class DemandForecastOut(BaseCamelModel):
    skill_keyword: str
    forecast_window_months: int
    projected_demand_curve: List[float]
    model_type: str