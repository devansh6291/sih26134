from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user_payload
from app.models.user import User, CandidateProfile, RecruiterProfile, InstituteAdmin, MentorProfile, TrainerProfile
from app.schemas.user import UserRegister, UserLogin, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    email = str(user_in.email).strip().lower()
    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role_type=user_in.role_type,
    )
    db.add(user)
    try:
        db.flush()

        if user.role_type == "candidate":
            db.add(
                CandidateProfile(
                    user_id=user.user_id,
                    location_pref=user_in.location_pref or "",
                    skill_gap_profile={"skills": user_in.skills},
                )
            )
        elif user.role_type == "recruiter":
            db.add(
                RecruiterProfile(
                    user_id=user.user_id,
                    org_name=user_in.org_name or "Independent",
                )
            )
        elif user.role_type == "mentor":
            db.add(
                MentorProfile(
                    mentor_id=user.user_id,
                    expertise_tags=["Python", "Cloud"],
                )
            )
        elif user.role_type == "institute_admin":
            db.add(
                InstituteAdmin(
                    user_id=user.user_id,
                    district_id=user_in.district_id or "IND-01",
                )
            )
        elif user.role_type == "trainer":
            db.add(TrainerProfile(user_id=user.user_id))

        db.commit()
    except IntegrityError:
        db.rollback()
        if db.query(User).filter(func.lower(User.email) == email).first():
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            ) from None
        raise
    db.refresh(user)

    token = create_access_token(subject=user.user_id, role=user.role_type)
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        role_type=user.role_type,
        full_name=user.full_name,
        email=user.email,
    )

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(func.lower(User.email) == str(login_data.email).strip().lower())
        .first()
    )
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=user.user_id, role=user.role_type)
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        role_type=user.role_type,
        full_name=user.full_name,
        email=user.email,
    )

@router.get("/me")
def get_current_user_profile(token_data: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    candidate_profile = user.candidate_profile
    skills = []
    if candidate_profile and isinstance(candidate_profile.skill_gap_profile, dict):
        raw_skills = candidate_profile.skill_gap_profile.get("skills", [])
        if isinstance(raw_skills, list):
            skills = [skill for skill in raw_skills if isinstance(skill, str)]
    return {
        "userId": user.user_id,
        "email": user.email,
        "fullName": user.full_name,
        "roleType": user.role_type,
        "skills": skills,
        "location": (
            candidate_profile.location_pref if candidate_profile else ""
        ),
        "readiness": (
            candidate_profile.readiness_score if candidate_profile else 0
        ),
    }