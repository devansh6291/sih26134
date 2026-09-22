import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.certification import SkillTrack, PracticalProjectSubmission, MentorEvaluation, Certificate, CreditLedgerEntry
from app.schemas.certification import (
    SkillTrackCreate, SkillTrackOut,
    PracticalSubmissionCreate, PracticalSubmissionOut,
    MentorEvaluationCreate, CertificateOut
)
from app.services.video_verifier import VideoLinkVerifier

router = APIRouter(prefix="/certifications", tags=["Credit & Practical Certification"])

@router.post("/tracks", response_model=SkillTrackOut)
def create_track(payload: SkillTrackCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    track = SkillTrack(
        track_name=payload.track_name,
        required_course_ids=",".join(payload.required_course_ids),
        certificate_validity_months=payload.certificate_validity_months,
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return track

@router.get("/tracks", response_model=List[SkillTrackOut])
def get_tracks(db: Session = Depends(get_db)):
    return db.query(SkillTrack).all()

@router.post("/submissions", response_model=PracticalSubmissionOut)
def submit_practical_project(payload: PracticalSubmissionCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    is_valid, platform = VideoLinkVerifier.verify_and_detect_platform(payload.video_link)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid video submission. You must supply a valid YouTube (public/unlisted) or Google Drive viewable URL."
        )

    submission = PracticalProjectSubmission(
        candidate_id=current_user["user_id"],
        skill_track_id=payload.skill_track_id,
        video_link=payload.video_link,
        video_platform=platform,
        submission_status="pending",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@router.get("/submissions/queue", response_model=List[PracticalSubmissionOut])
def get_mentor_queue(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    if current_user["role"] not in ["mentor", "institute_admin"]:
        raise HTTPException(status_code=403, detail="Only mentors and admins can view the evaluation queue")
    return db.query(PracticalProjectSubmission).filter(PracticalProjectSubmission.submission_status == "pending").all()

@router.post("/evaluations")
def evaluate_submission(payload: MentorEvaluationCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    if current_user["role"] != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can evaluate submissions")

    submission = db.query(PracticalProjectSubmission).filter(
        PracticalProjectSubmission.submission_id == payload.submission_id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    evaluation = MentorEvaluation(
        submission_id=payload.submission_id,
        mentor_id=current_user["user_id"],
        evaluation_status=payload.evaluation_status,
        feedback_notes=payload.feedback_notes,
    )
    db.add(evaluation)
    submission.submission_status = payload.evaluation_status

    if payload.evaluation_status == "approved":
        credits = db.query(CreditLedgerEntry).filter(
            CreditLedgerEntry.candidate_id == submission.candidate_id,
            CreditLedgerEntry.credit_status == "pending"
        ).all()
        for c in credits:
            c.credit_status = "released"

        track = db.query(SkillTrack).filter(SkillTrack.skill_track_id == submission.skill_track_id).first()
        validity_months = track.certificate_validity_months if track else 12
        now = datetime.now(timezone.utc)
        valid_until = now + timedelta(days=validity_months * 30)

        certificate = Certificate(
            skill_track_id=submission.skill_track_id,
            candidate_id=submission.candidate_id,
            issued_date=now,
            valid_until=valid_until,
            certificate_status="active",
            verification_code=f"KSHL-{uuid.uuid4().hex[:10].upper()}",
        )
        db.add(certificate)

    db.commit()
    return {"status": "success", "evaluationStatus": payload.evaluation_status}

@router.get("/verify/{code}", response_model=CertificateOut)
def verify_certificate(code: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.verification_code == code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate verification code not found")
    return cert