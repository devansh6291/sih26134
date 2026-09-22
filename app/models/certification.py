from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from datetime import datetime, timezone
from app.core.database import Base

class CourseCompletion(Base):
    __tablename__ = "course_completions"

    completion_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(String(100), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class CreditLedgerEntry(Base):
    __tablename__ = "credit_ledger_entries"

    credit_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(String(100), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    credits_awarded = Column(Integer, default=0)
    credit_status = Column(String(50), default="pending")
    awarded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SkillTrack(Base):
    __tablename__ = "skill_tracks"

    skill_track_id = Column(Integer, primary_key=True, index=True)
    track_name = Column(String(255), unique=True, nullable=False)
    required_course_ids = Column(String(255), nullable=False) 
    certificate_validity_months = Column(Integer, default=12)

class PracticalProjectSubmission(Base):
    __tablename__ = "practical_project_submissions"

    submission_id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    skill_track_id = Column(Integer, ForeignKey("skill_tracks.skill_track_id"), nullable=False)
    video_link = Column(String(500), nullable=False)
    video_platform = Column(String(50), nullable=False) 
    submission_status = Column(String(50), default="pending")
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class MentorEvaluation(Base):
    __tablename__ = "mentor_evaluations"

    evaluation_id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("practical_project_submissions.submission_id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    evaluation_status = Column(String(50), nullable=False)
    feedback_notes = Column(Text, nullable=False)
    evaluated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Certificate(Base):
    __tablename__ = "certificates"

    certificate_id = Column(Integer, primary_key=True, index=True)
    skill_track_id = Column(Integer, ForeignKey("skill_tracks.skill_track_id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    issued_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    valid_until = Column(DateTime, nullable=False)
    certificate_status = Column(String(50), default="active") 
    verification_code = Column(String(100), unique=True, index=True, nullable=False)