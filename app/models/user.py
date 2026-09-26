from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role_type = Column(String(50), nullable=False)

    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False)
    recruiter_profile = relationship("RecruiterProfile", back_populates="user", uselist=False)
    trainer_profile = relationship("TrainerProfile", back_populates="user", uselist=False)
    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False)
    institute_admin_profile = relationship("InstituteAdmin", back_populates="user", uselist=False)
    jobs = relationship("Job", back_populates="recruiter", passive_deletes="all")
    job_applications = relationship(
        "JobApplication",
        back_populates="candidate",
        passive_deletes="all",
    )
    application_events = relationship("ApplicationEvent", back_populates="actor")
    notifications = relationship("Notification", back_populates="recipient")

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    readiness_score = Column(Float, default=0.0)
    skill_gap_profile = Column(JSON, default=dict)  
    location_pref = Column(String(100), default="")

    user = relationship("User", back_populates="candidate_profile")

class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"

    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    org_name = Column(String(255), nullable=False)
    hiring_domains = Column(JSON, default=list)

    user = relationship("User", back_populates="recruiter_profile")

class TrainerProfile(Base):
    __tablename__ = "trainer_profiles"

    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    assigned_modules = Column(JSON, default=list)
    upskill_alerts = Column(JSON, default=list)

    user = relationship("User", back_populates="trainer_profile")

class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    mentor_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    expertise_tags = Column(JSON, default=list)
    assigned_review_queue = Column(JSON, default=list)

    user = relationship("User", back_populates="mentor_profile")

class InstituteAdmin(Base):
    __tablename__ = "institute_admins"

    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    district_id = Column(String(50), index=True, nullable=False)
    owned_action_items = Column(JSON, default=list)

    user = relationship("User", back_populates="institute_admin_profile")