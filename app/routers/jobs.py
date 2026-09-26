from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.jobs import (
    ApplicationEvent,
    Job,
    JobApplication,
    Notification,
)
from app.models.platform import MarketSignal
from app.models.user import CandidateProfile, User
from app.schemas.jobs import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    CandidateApplicationOut,
    JobCreate,
    JobOut,
    NotificationOut,
    NotificationReadOut,
    RecruiterApplicationOut,
)

router = APIRouter(tags=["Jobs and Applications"])


def require_role(current_user: dict, role: str) -> int:
    if current_user.get("role") != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{role.capitalize()} access required",
        )
    return current_user["user_id"]


def get_candidate_skills(profile: Optional[CandidateProfile]) -> List[str]:
    if not profile or not isinstance(profile.skill_gap_profile, dict):
        return []
    skills = profile.skill_gap_profile.get("skills", [])
    if not isinstance(skills, list):
        return []
    return [skill for skill in skills if isinstance(skill, str)]


def to_job_out(job: Job, applicant_count: int) -> JobOut:
    return JobOut(
        job_id=job.job_id,
        recruiter_id=job.recruiter_id,
        title=job.title,
        company=job.company,
        location=job.location,
        job_type=job.job_type,
        experience=job.experience,
        salary=job.salary,
        skills=job.skills or [],
        description=job.description or "",
        status=job.status,
        published_at=job.published_at,
        applicant_count=applicant_count,
    )


def job_with_counts(db: Session, query):
    counts = (
        db.query(
            JobApplication.job_id.label("job_id"),
            func.count(JobApplication.application_id).label("applicant_count"),
        )
        .group_by(JobApplication.job_id)
        .subquery()
    )
    return (
        query.outerjoin(counts, counts.c.job_id == Job.job_id)
        .with_entities(Job, func.coalesce(counts.c.applicant_count, 0))
    )


@router.get("/jobs", response_model=List[JobOut])
def list_active_jobs(
    search: Optional[str] = Query(default=None, max_length=255),
    location: Optional[str] = Query(default=None, max_length=255),
    job_type: Optional[str] = Query(
        default=None,
        alias="type",
        max_length=50,
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Job).filter(Job.status == "active")
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Job.title.ilike(term),
                Job.company.ilike(term),
                Job.location.ilike(term),
                Job.description.ilike(term),
            )
        )
    if location and location != "All":
        query = query.filter(Job.location == location)
    if job_type and job_type != "All":
        query = query.filter(Job.job_type == job_type)

    rows = job_with_counts(db, query).order_by(Job.published_at.desc()).all()
    return [to_job_out(job, count) for job, count in rows]


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_active_job(job_id: int, db: Session = Depends(get_db)):
    rows = job_with_counts(
        db,
        db.query(Job).filter(Job.job_id == job_id, Job.status == "active"),
    ).all()
    if not rows:
        raise HTTPException(status_code=404, detail="Job not found")
    job, applicant_count = rows[0]
    return to_job_out(job, applicant_count)


@router.post(
    "/recruiter/jobs",
    response_model=JobOut,
    status_code=status.HTTP_201_CREATED,
)
def create_recruiter_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    recruiter_id = require_role(current_user, "recruiter")
    recruiter = db.query(User).filter(User.user_id == recruiter_id).first()
    if not recruiter:
        raise HTTPException(status_code=401, detail="Recruiter account not found")

    job = Job(
        recruiter_id=recruiter_id,
        title=payload.title.strip(),
        company=payload.company.strip(),
        location=payload.location.strip(),
        job_type=payload.job_type,
        experience=payload.experience.strip(),
        salary=payload.salary.strip(),
        skills=[skill.strip() for skill in payload.skills if skill.strip()],
        description=payload.description.strip(),
        status="active",
    )
    db.add(job)
    try:
        db.flush()
        for skill in job.skills:
            db.add(
                MarketSignal(
                    source_type="job_posting",
                    source_reference=f"recruiter-job:{job.job_id}",
                    role_title=job.title,
                    sector=None,
                    location=job.location,
                    skill_name=skill,
                    proficiency_level="unspecified",
                    demand_value=1,
                    contributor_id=recruiter_id,
                )
            )
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    db.refresh(job)
    return to_job_out(job, 0)


@router.get("/recruiter/jobs", response_model=List[JobOut])
def list_recruiter_jobs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    recruiter_id = require_role(current_user, "recruiter")
    query = db.query(Job).filter(Job.recruiter_id == recruiter_id)
    rows = job_with_counts(db, query).order_by(Job.created_at.desc()).all()
    return [to_job_out(job, count) for job, count in rows]


@router.get(
    "/recruiter/jobs/{job_id}/applications",
    response_model=List[RecruiterApplicationOut],
)
def list_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    recruiter_id = require_role(current_user, "recruiter")
    job = (
        db.query(Job)
        .filter(Job.job_id == job_id, Job.recruiter_id == recruiter_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    rows = (
        db.query(JobApplication, Job, User, CandidateProfile)
        .join(Job, Job.job_id == JobApplication.job_id)
        .join(User, User.user_id == JobApplication.candidate_id)
        .outerjoin(CandidateProfile, CandidateProfile.user_id == User.user_id)
        .filter(JobApplication.job_id == job_id)
        .order_by(JobApplication.applied_at.desc())
        .all()
    )
    return [
        RecruiterApplicationOut(
            application_id=application.application_id,
            job_id=application.job_id,
            job_title=job.title,
            company=job.company,
            status=application.status,
            applied_at=application.applied_at,
            updated_at=application.updated_at,
            candidate={
                "user_id": candidate.user_id,
                "full_name": candidate.full_name,
                "email": candidate.email,
                "location": profile.location_pref if profile else "",
                "skills": get_candidate_skills(profile),
                "readiness": (
                    profile.readiness_score if profile and profile.readiness_score else 0
                ),
                "phone": None,
                "experience": None,
                "education": None,
                "summary": None,
                "resume": None,
            },
        )
        for application, job, candidate, profile in rows
    ]


@router.get("/recruiter/applications", response_model=List[RecruiterApplicationOut])
def list_recruiter_applications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    recruiter_id = require_role(current_user, "recruiter")
    rows = (
        db.query(JobApplication, Job, User, CandidateProfile)
        .join(Job, Job.job_id == JobApplication.job_id)
        .join(User, User.user_id == JobApplication.candidate_id)
        .outerjoin(CandidateProfile, CandidateProfile.user_id == User.user_id)
        .filter(Job.recruiter_id == recruiter_id)
        .order_by(JobApplication.applied_at.desc())
        .all()
    )
    return [
        RecruiterApplicationOut(
            application_id=application.application_id,
            job_id=application.job_id,
            job_title=job.title,
            company=job.company,
            status=application.status,
            applied_at=application.applied_at,
            updated_at=application.updated_at,
            candidate={
                "user_id": candidate.user_id,
                "full_name": candidate.full_name,
                "email": candidate.email,
                "location": profile.location_pref if profile else "",
                "skills": get_candidate_skills(profile),
                "readiness": (
                    profile.readiness_score if profile and profile.readiness_score else 0
                ),
            },
        )
        for application, job, candidate, profile in rows
    ]


@router.post(
    "/jobs/{job_id}/apply",
    response_model=CandidateApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_job(
    job_id: int,
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    candidate_id = require_role(current_user, "candidate")
    job = (
        db.query(Job)
        .filter(Job.job_id == job_id, Job.status == "active")
        .with_for_update()
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Active job not found")

    existing = (
        db.query(JobApplication)
        .filter(
            JobApplication.job_id == job_id,
            JobApplication.candidate_id == candidate_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already applied to this job")

    application = JobApplication(
        job_id=job_id,
        candidate_id=candidate_id,
        status="under_review",
    )
    db.add(application)
    try:
        db.flush()
        db.add(
            ApplicationEvent(
                application_id=application.application_id,
                actor_user_id=candidate_id,
                old_status=None,
                new_status="under_review",
                note=payload.cover_note,
            )
        )
        db.add(
            Notification(
                recipient_id=job.recruiter_id,
                application_id=application.application_id,
                notification_type="new_application",
                title="New job application",
                message=f"A candidate applied for {job.title} at {job.company}.",
            )
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        duplicate = (
            db.query(JobApplication)
            .filter(
                JobApplication.job_id == job_id,
                JobApplication.candidate_id == candidate_id,
            )
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Already applied to this job",
            ) from None
        raise

    db.refresh(application)
    return CandidateApplicationOut(
        application_id=application.application_id,
        job={"job_id": job.job_id, "title": job.title, "company": job.company},
        status=application.status,
        applied_at=application.applied_at,
        updated_at=application.updated_at,
    )


@router.get("/me/applications", response_model=List[CandidateApplicationOut])
def list_my_applications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    candidate_id = require_role(current_user, "candidate")
    rows = (
        db.query(JobApplication, Job)
        .join(Job, Job.job_id == JobApplication.job_id)
        .filter(JobApplication.candidate_id == candidate_id)
        .order_by(JobApplication.applied_at.desc())
        .all()
    )
    return [
        CandidateApplicationOut(
            application_id=application.application_id,
            job={"job_id": job.job_id, "title": job.title, "company": job.company},
            status=application.status,
            applied_at=application.applied_at,
            updated_at=application.updated_at,
        )
        for application, job in rows
    ]


@router.patch(
    "/recruiter/applications/{application_id}/status",
    response_model=RecruiterApplicationOut,
)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    recruiter_id = require_role(current_user, "recruiter")
    row = (
        db.query(JobApplication, Job)
        .join(Job, Job.job_id == JobApplication.job_id)
        .filter(
            JobApplication.application_id == application_id,
            Job.recruiter_id == recruiter_id,
        )
        .with_for_update()
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")

    application, job = row
    previous_status = application.status
    if previous_status != payload.status:
        application.status = payload.status
        application.updated_at = datetime.now(timezone.utc)
        db.add(
            ApplicationEvent(
                application_id=application.application_id,
                actor_user_id=recruiter_id,
                old_status=previous_status,
                new_status=payload.status,
                note=payload.note,
            )
        )
        db.add(
            Notification(
                recipient_id=application.candidate_id,
                application_id=application.application_id,
                notification_type="application_status_changed",
                title="Application status updated",
                message=(
                    f"Your application for {job.title} at {job.company} "
                    f"was marked {payload.status.replace('_', ' ')}."
                ),
            )
        )
        db.commit()
        db.refresh(application)

    candidate, profile = (
        db.query(User, CandidateProfile)
        .outerjoin(CandidateProfile, CandidateProfile.user_id == User.user_id)
        .filter(User.user_id == application.candidate_id)
        .first()
    )
    return RecruiterApplicationOut(
        application_id=application.application_id,
        job_id=application.job_id,
        job_title=job.title,
        company=job.company,
        status=application.status,
        applied_at=application.applied_at,
        updated_at=application.updated_at,
        candidate={
            "user_id": candidate.user_id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "location": profile.location_pref if profile else "",
            "skills": get_candidate_skills(profile),
            "readiness": (
                profile.readiness_score if profile and profile.readiness_score else 0
            ),
        },
    )


@router.get("/me/notifications", response_model=List[NotificationOut])
def list_my_notifications(
    unread_only: bool = Query(default=False, alias="unreadOnly"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    user_id = current_user["user_id"]
    query = db.query(Notification).filter(Notification.recipient_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).all()


@router.patch(
    "/me/notifications/{notification_id}/read",
    response_model=NotificationReadOut,
)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id,
            Notification.recipient_id == current_user["user_id"],
        )
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
    return notification
