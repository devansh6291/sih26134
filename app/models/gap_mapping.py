from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime, timezone
from app.core.database import Base

class GapFlag(Base):
    __tablename__ = "gap_flags"

    gap_id = Column(Integer, primary_key=True, index=True)
    gap_type = Column(String(50), nullable=False)
    assigned_owner_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    due_date = Column(DateTime, nullable=False)
    status_pipeline_stage = Column(String(50), default="flagged")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ValidationVote(Base):
    __tablename__ = "validation_votes"

    id = Column(Integer, primary_key=True, index=True)
    voter_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    target_gap_id = Column(Integer, ForeignKey("gap_flags.gap_id"), nullable=False)
    vote_type = Column(String(50), nullable=False)
    voted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))