from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    text,
)

from app.core.database import Base


class MarketSignal(Base):
    __tablename__ = "market_signals"
    __table_args__ = (
        CheckConstraint(
            "source_type IN ('job_posting', 'employer_survey', "
            "'industry_consultation', 'sector_growth', "
            "'placement_outcome', 'emerging_technology')",
            name="ck_market_signals_source_type",
        ),
        CheckConstraint(
            "demand_value >= 0",
            name="ck_market_signals_demand_nonnegative",
        ),
    )

    signal_id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String(40), nullable=False, index=True)
    source_reference = Column(String(255), nullable=True)
    role_title = Column(String(255), nullable=False, index=True)
    sector = Column(String(150), nullable=True, index=True)
    location = Column(String(255), nullable=False, index=True)
    skill_name = Column(String(150), nullable=False, index=True)
    proficiency_level = Column(String(50), nullable=False, default="unspecified")
    demand_value = Column(Float, nullable=False, default=1.0)
    evidence_summary = Column(Text, nullable=True)
    contributor_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    observed_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class CourseOffering(Base):
    __tablename__ = "course_offerings"
    __table_args__ = (
        CheckConstraint(
            "course_status IN ('active', 'under_review', 'obsolete', 'oversupplied')",
            name="ck_course_offerings_status",
        ),
    )

    course_id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(100), nullable=False, unique=True, index=True)
    course_name = Column(String(255), nullable=False, index=True)
    qualification = Column(String(255), nullable=True)
    sector = Column(String(150), nullable=False, index=True)
    target_role = Column(String(255), nullable=False, index=True)
    skills = Column(JSON, nullable=False, default=list)
    proficiency_levels = Column(JSON, nullable=False, default=dict)
    equipment_required = Column(JSON, nullable=False, default=list)
    trainer_capabilities = Column(
        JSON,
        nullable=False,
        default=list,
        server_default=text("'[]'"),
    )
    curriculum_version = Column(String(100), nullable=True)
    placement_rate = Column(Float, nullable=True)
    enrollment_count = Column(Integer, nullable=False, default=0)
    course_status = Column(String(30), nullable=False, default="active", index=True)
    recommended_update = Column(Text, nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class TrainingCapacity(Base):
    __tablename__ = "training_capacity"
    __table_args__ = (
        UniqueConstraint(
            "district_id",
            "course_id",
            name="uq_training_capacity_district_course",
        ),
        CheckConstraint("seats >= 0", name="ck_training_capacity_seats"),
        CheckConstraint("trainer_count >= 0", name="ck_training_capacity_trainers"),
        CheckConstraint(
            "equipment_readiness BETWEEN 0 AND 100",
            name="ck_training_capacity_equipment_readiness",
        ),
        CheckConstraint(
            "infrastructure_readiness BETWEEN 0 AND 100",
            name="ck_training_capacity_infrastructure_readiness",
        ),
    )

    capacity_id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String(100), nullable=False, index=True)
    course_id = Column(
        Integer,
        ForeignKey("course_offerings.course_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    seats = Column(Integer, nullable=False, default=0)
    trainer_count = Column(Integer, nullable=False, default=0)
    trainer_capabilities = Column(
        JSON,
        nullable=False,
        default=list,
        server_default=text("'[]'"),
    )
    equipment_available = Column(JSON, nullable=False, default=list)
    equipment_readiness = Column(Float, nullable=False, default=0)
    infrastructure_readiness = Column(Float, nullable=False, default=0)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class EmployerValidation(Base):
    __tablename__ = "employer_validations"
    __table_args__ = (
        CheckConstraint(
            "validation_status IN ('endorsed', 'needs_revision', 'rejected')",
            name="ck_employer_validations_status",
        ),
        UniqueConstraint(
            "signal_id",
            "employer_id",
            name="uq_employer_validation_signal_employer",
        ),
    )

    validation_id = Column(Integer, primary_key=True, index=True)
    signal_id = Column(
        Integer,
        ForeignKey("market_signals.signal_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    employer_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    validation_status = Column(String(30), nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class PlacementOutcome(Base):
    __tablename__ = "placement_outcomes"
    __table_args__ = (
        CheckConstraint(
            "candidate_rating IS NULL OR candidate_rating BETWEEN 1 AND 5",
            name="ck_placement_outcomes_candidate_rating",
        ),
        CheckConstraint(
            "employer_rating IS NULL OR employer_rating BETWEEN 1 AND 5",
            name="ck_placement_outcomes_employer_rating",
        ),
        CheckConstraint(
            "course_relevance_score IS NULL OR "
            "course_relevance_score BETWEEN 0 AND 100",
            name="ck_placement_outcomes_course_relevance",
        ),
    )

    outcome_id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    course_id = Column(
        Integer,
        ForeignKey("course_offerings.course_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    role_title = Column(String(255), nullable=False, index=True)
    sector = Column(String(150), nullable=True, index=True)
    district_id = Column(String(100), nullable=False, index=True)
    placed = Column(Boolean, nullable=False, default=True)
    candidate_rating = Column(Float, nullable=True)
    employer_rating = Column(Float, nullable=True)
    course_relevance_score = Column(Float, nullable=True)
    feedback_notes = Column(Text, nullable=True)
    reported_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
