from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, DateTime
from datetime import datetime, timezone
from app.core.database import Base

class JobPosting(Base):
    __tablename__ = "job_postings"

    job_id = Column(Integer, primary_key=True, index=True)
    role_title = Column(String(255), index=True, nullable=False)
    required_skills = Column(JSON, default=list)
    location = Column(String(100), index=True, nullable=False)
    source_type = Column(String(50), default="platform")
    posted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class InterviewRecord(Base):
    __tablename__ = "interview_records"

    interview_id = Column(Integer, primary_key=True, index=True)
    questions_shared = Column(JSON, default=list)
    outcome_status = Column(String(50), nullable=False)
    is_anonymized = Column(Boolean, default=True)

class PlacementFeedback(Base):
    __tablename__ = "placement_feedback"

    feedback_id = Column(Integer, primary_key=True, index=True)
    candidate_rating = Column(Float, nullable=False)
    recruiter_rating = Column(Float, nullable=False)
    course_relevance_score = Column(Float, nullable=False)

class CommunityPulse(Base):
    __tablename__ = "community_pulse"

    id = Column(Integer, primary_key=True, index=True)
    skill_tag = Column(String(100), index=True, nullable=False)
    thread_volume = Column(Integer, default=0)
    sentiment_score = Column(Float, default=0.0)
    topic_shift_delta = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class TrendVelocity(Base):
    __tablename__ = "trend_velocity"

    id = Column(Integer, primary_key=True, index=True)
    skill_keyword = Column(String(100), unique=True, index=True, nullable=False)
    mention_growth_rate = Column(Float, default=0.0)
    is_emerging_flag = Column(Boolean, default=False)

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    skill_keyword = Column(String(100), index=True, nullable=False)
    forecast_window_months = Column(Integer, default=6)
    projected_demand_curve = Column(JSON, default=list)
    model_type = Column(String(50), default="time_series")