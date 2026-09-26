from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.intelligence import JobPosting, PlacementFeedback, TrendVelocity, DemandForecast
from app.models.platform import MarketSignal
from app.schemas.intelligence import JobPostingCreate, JobPostingOut, PlacementFeedbackCreate, PlacementFeedbackOut, TrendVelocityOut, DemandForecastOut
from app.services.predictive_engine import PredictiveEngine

router = APIRouter(prefix="/intelligence", tags=["Signal Capture & Predictive Layer"])

@router.post("/jobs", response_model=JobPostingOut)
def create_job(payload: JobPostingCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    if current_user.get("role") not in {"recruiter", "policy_officer"}:
        raise HTTPException(status_code=403, detail="Only recruiters and policy officers can submit job-market signals")
    job = JobPosting(
        role_title=payload.role_title,
        required_skills=payload.required_skills,
        location=payload.location,
        source_type=payload.source_type,
    )
    db.add(job)
    db.flush()
    for skill in payload.required_skills:
        db.add(
            MarketSignal(
                source_type="job_posting",
                source_reference=f"job-posting:{job.job_id}",
                role_title=payload.role_title,
                location=payload.location,
                skill_name=skill,
                proficiency_level="unspecified",
                demand_value=1,
                contributor_id=current_user["user_id"],
            )
        )
    db.commit()
    db.refresh(job)
    return job

@router.get("/jobs", response_model=List[JobPostingOut])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(JobPosting).order_by(JobPosting.job_id.desc()).limit(50).all()

@router.post("/feedback", response_model=PlacementFeedbackOut)
def submit_feedback(payload: PlacementFeedbackCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    fb = PlacementFeedback(
        candidate_rating=payload.candidate_rating,
        recruiter_rating=payload.recruiter_rating,
        course_relevance_score=payload.course_relevance_score,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb

@router.get("/trends", response_model=List[TrendVelocityOut])
def get_trends(db: Session = Depends(get_db)):
    return db.query(TrendVelocity).all()

@router.get("/forecast/{skill_keyword}", response_model=DemandForecastOut)
def get_skill_forecast(skill_keyword: str, months: int = 6, db: Session = Depends(get_db)):
    curve = PredictiveEngine.forecast_curve(base_frequency=45, growth_rate=0.28, months=months)
    return DemandForecastOut(
        skill_keyword=skill_keyword,
        forecast_window_months=months,
        projected_demand_curve=curve,
        model_type="time_series",
    )