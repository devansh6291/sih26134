from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'closed')",
            name="ck_jobs_status",
        ),
        CheckConstraint(
            "job_type IN ('Full Time', 'Part Time', 'Internship', 'Contract')",
            name="ck_jobs_type",
        ),
    )

    job_id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False, index=True)
    job_type = Column(String(50), nullable=False)
    experience = Column(String(255), nullable=False)
    salary = Column(String(255), nullable=False)
    skills = Column(JSON, nullable=False, default=list)
    description = Column(Text, nullable=False, default="")
    status = Column(String(30), nullable=False, default="active", index=True)
    published_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    recruiter = relationship("User", back_populates="jobs")
    applications = relationship(
        "JobApplication",
        back_populates="job",
        passive_deletes="all",
    )


class JobApplication(Base):
    __tablename__ = "job_applications"
    __table_args__ = (
        UniqueConstraint(
            "job_id",
            "candidate_id",
            name="uq_job_applications_job_candidate",
        ),
        CheckConstraint(
            "status IN ('under_review', 'shortlisted', 'rejected')",
            name="ck_job_applications_status",
        ),
    )

    application_id = Column(Integer, primary_key=True, index=True)
    job_id = Column(
        Integer,
        ForeignKey("jobs.job_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    candidate_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status = Column(String(30), nullable=False, default="under_review", index=True)
    applied_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    job = relationship("Job", back_populates="applications")
    candidate = relationship("User", back_populates="job_applications")
    events = relationship(
        "ApplicationEvent",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationEvent.created_at",
    )
    notifications = relationship(
        "Notification",
        back_populates="application",
        cascade="all, delete-orphan",
    )


class ApplicationEvent(Base):
    __tablename__ = "application_events"
    __table_args__ = (
        CheckConstraint(
            "new_status IN ('under_review', 'shortlisted', 'rejected')",
            name="ck_application_events_new_status",
        ),
        CheckConstraint(
            "old_status IS NULL OR "
            "old_status IN ('under_review', 'shortlisted', 'rejected')",
            name="ck_application_events_old_status",
        ),
    )

    event_id = Column(Integer, primary_key=True, index=True)
    application_id = Column(
        Integer,
        ForeignKey("job_applications.application_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
    )
    old_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    application = relationship("JobApplication", back_populates="events")
    actor = relationship("User", back_populates="application_events")


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(
            "notification_type IN "
            "('new_application', 'application_status_changed')",
            name="ck_notifications_type",
        ),
    )

    notification_id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    application_id = Column(
        Integer,
        ForeignKey("job_applications.application_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    notification_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    read_at = Column(DateTime(timezone=True), nullable=True)

    recipient = relationship("User", back_populates="notifications")
    application = relationship("JobApplication", back_populates="notifications")
