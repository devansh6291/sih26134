from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Integer, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.platform import (
    CourseOffering,
    EmployerValidation,
    MarketSignal,
    PlacementOutcome,
    TrainingCapacity,
)
from app.schemas.platform import (
    CourseAnalysisOut,
    CourseCreate,
    CourseOut,
    CourseUpdate,
    DemandBreakdown,
    DemandSummary,
    DistrictPlanOut,
    EmployerValidationCreate,
    EmployerValidationOut,
    IntelligenceOverview,
    MarketSignalCreate,
    MarketSignalOut,
    PlacementOutcomeCreate,
    PlacementOutcomeOut,
    RoleDemandSummary,
    TrainingCapacityCreate,
    TrainingCapacityOut,
    TrainingCapacityUpdate,
)

router = APIRouter(prefix="/intelligence", tags=["Labour Market Intelligence"])

SIGNAL_WRITERS = {
    "recruiter",
    "policy_officer",
    "institute_admin",
    "trainer",
}
PLATFORM_PLANNERS = {"policy_officer", "institute_admin"}


def require_role(current_user: dict, roles: set) -> int:
    role = current_user.get("role")
    if role not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action is not allowed for your role",
        )
    return current_user["user_id"]


def demand_summaries(db: Session, model_field, district_id: Optional[str] = None):
    query = db.query(
        model_field.label("name"),
        func.sum(MarketSignal.demand_value).label("demand_value"),
        func.count(MarketSignal.signal_id).label("signal_count"),
    )
    if district_id:
        query = query.filter(MarketSignal.location == district_id)
    rows = (
        query.group_by(model_field)
        .order_by(func.sum(MarketSignal.demand_value).desc())
        .limit(10)
        .all()
    )
    return [
        {
            "name": row.name,
            "demand_value": float(row.demand_value or 0),
            "signal_count": int(row.signal_count or 0),
        }
        for row in rows
    ]


def dimension_summaries(db: Session, model_field, location: Optional[str] = None):
    query = db.query(
        model_field.label("name"),
        func.sum(MarketSignal.demand_value).label("demand_value"),
        func.count(MarketSignal.signal_id).label("signal_count"),
    )
    if location:
        query = query.filter(MarketSignal.location == location)
    rows = (
        query.group_by(model_field)
        .order_by(func.sum(MarketSignal.demand_value).desc())
        .limit(10)
        .all()
    )
    return [
        {
            "name": row.name,
            "demand_value": float(row.demand_value or 0),
            "signal_count": int(row.signal_count or 0),
        }
        for row in rows
    ]


def calculate_course_analysis(db: Session, course: CourseOffering):
    role_query = db.query(
        MarketSignal.skill_name,
        func.sum(MarketSignal.demand_value).label("demand"),
    ).filter(MarketSignal.role_title.ilike(course.target_role))
    if course.sector:
        role_query = role_query.filter(MarketSignal.sector == course.sector)
    demand_rows = (
        role_query
        .group_by(MarketSignal.skill_name)
        .order_by(func.sum(MarketSignal.demand_value).desc())
        .limit(20)
        .all()
    )
    if not demand_rows:
        sector_query = db.query(
            MarketSignal.skill_name,
            func.sum(MarketSignal.demand_value).label("demand"),
        )
        if course.sector:
            sector_query = sector_query.filter(MarketSignal.sector == course.sector)
        demand_rows = (
            sector_query.group_by(MarketSignal.skill_name)
            .order_by(func.sum(MarketSignal.demand_value).desc())
            .limit(20)
            .all()
        )
    if not demand_rows:
        demand_rows = (
            db.query(
                MarketSignal.skill_name,
                func.sum(MarketSignal.demand_value).label("demand"),
            )
            .group_by(MarketSignal.skill_name)
            .order_by(func.sum(MarketSignal.demand_value).desc())
            .limit(20)
            .all()
        )

    demand_by_skill = {
        row.skill_name.casefold(): float(row.demand or 0)
        for row in demand_rows
    }
    proficiency_query = db.query(
        MarketSignal.skill_name,
        MarketSignal.proficiency_level,
        func.sum(MarketSignal.demand_value).label("demand"),
    ).filter(MarketSignal.role_title.ilike(course.target_role))
    if course.sector:
        proficiency_query = proficiency_query.filter(
            MarketSignal.sector == course.sector
        )
    proficiency_rows = (
        proficiency_query.group_by(
            MarketSignal.skill_name,
            MarketSignal.proficiency_level,
        ).all()
    )
    if not proficiency_rows:
        sector_proficiency_query = db.query(
            MarketSignal.skill_name,
            MarketSignal.proficiency_level,
            func.sum(MarketSignal.demand_value).label("demand"),
        )
        if course.sector:
            sector_proficiency_query = sector_proficiency_query.filter(
                MarketSignal.sector == course.sector
            )
        proficiency_rows = sector_proficiency_query.group_by(
            MarketSignal.skill_name,
            MarketSignal.proficiency_level,
        ).all()
    if not proficiency_rows:
        proficiency_rows = (
            db.query(
                MarketSignal.skill_name,
                MarketSignal.proficiency_level,
                func.sum(MarketSignal.demand_value).label("demand"),
            )
            .group_by(
                MarketSignal.skill_name,
                MarketSignal.proficiency_level,
            )
            .all()
        )
    proficiency_ranks = {
        "beginner": 1,
        "intermediate": 2,
        "advanced": 3,
        "expert": 4,
        "unspecified": 0,
    }
    requested_proficiency = {}
    for row in proficiency_rows:
        skill_key = row.skill_name.casefold()
        level = row.proficiency_level.casefold()
        if level not in proficiency_ranks or level == "unspecified":
            continue
        current = requested_proficiency.get(skill_key)
        if current is None or (
            float(row.demand or 0) > current[0]
            or (
                float(row.demand or 0) == current[0]
                and proficiency_ranks[level] > proficiency_ranks[current[1]]
            )
        ):
            requested_proficiency[skill_key] = (
                float(row.demand or 0),
                level,
            )
    course_skills = {
        skill.casefold(): skill
        for skill in (course.skills or [])
        if isinstance(skill, str)
    }
    top_demands = sorted(demand_by_skill.items(), key=lambda item: item[1], reverse=True)
    high_demand = [skill for skill, _ in top_demands[:5]]
    missing = [skill for skill in high_demand if skill not in course_skills]
    matched = [course_skills[skill] for skill in high_demand if skill in course_skills]
    course_proficiencies = {
        str(skill).casefold(): str(level).casefold()
        for skill, level in (course.proficiency_levels or {}).items()
    }
    proficiency_gaps = []
    for skill_key in high_demand:
        expected = requested_proficiency.get(skill_key)
        if skill_key not in course_skills or not expected:
            continue
        course_level = course_proficiencies.get(skill_key, "unspecified")
        if (
            course_level not in proficiency_ranks
            or proficiency_ranks[course_level] < proficiency_ranks[expected[1]]
        ):
            skill_label = course_skills[skill_key]
            proficiency_gaps.append(
                f"{skill_label}: demand {expected[1]}, "
                f"course {course_level}"
            )
    demand_score = sum(
        demand_by_skill.get(skill, 0) for skill in course_skills
    )
    total_top_demand = sum(value for _, value in top_demands[:5])

    recommendation = "No comparable labour-market signals are available yet."
    if top_demands:
        if missing:
            recommendation = (
                "Review the curriculum to include high-demand skills: "
                + ", ".join(missing)
                + ". Validate the proposed changes with employers before adoption."
            )
            if course.course_status not in {"obsolete", "oversupplied"}:
                course.course_status = "under_review"
            course.recommended_update = recommendation
        elif course.enrollment_count > 0 and demand_score < total_top_demand * 0.1:
            recommendation = (
                "Demand coverage is low relative to the observed top skills. "
                "Review this course's target role, skills, and enrolment before "
                "classifying it as oversupplied."
            )
            course.course_status = "under_review"
            course.recommended_update = recommendation
        else:
            recommendation = (
                "The course covers the currently observed high-demand skills. "
                "Continue monitoring new signals and employer validation."
            )
            course.recommended_update = None

    if proficiency_gaps:
        recommendation = (
            recommendation
            + " Review skill proficiency targets: "
            + "; ".join(proficiency_gaps)
            + "."
        )
        course.recommended_update = recommendation
        if course.course_status not in {"obsolete", "oversupplied"}:
            course.course_status = "under_review"

    return CourseAnalysisOut(
        course=course,
        demand_score=round(demand_score, 2),
        missing_high_demand_skills=missing,
        demand_matched_skills=matched,
        proficiency_gaps=proficiency_gaps,
        recommendation=recommendation,
    )


@router.get("/overview", response_model=IntelligenceOverview)
def get_intelligence_overview(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    source_rows = (
        db.query(MarketSignal.source_type, func.count(MarketSignal.signal_id))
        .group_by(MarketSignal.source_type)
        .all()
    )
    skill_rows = demand_summaries(db, MarketSignal.skill_name)
    role_rows = demand_summaries(db, MarketSignal.role_title)
    location_rows = dimension_summaries(db, MarketSignal.location)
    proficiency_rows = dimension_summaries(
        db,
        MarketSignal.proficiency_level,
    )
    course_rows = (
        db.query(CourseOffering.course_status, func.count(CourseOffering.course_id))
        .group_by(CourseOffering.course_status)
        .all()
    )
    capacities = db.query(
        func.count(func.distinct(TrainingCapacity.district_id)),
        func.coalesce(func.sum(TrainingCapacity.seats), 0),
        func.coalesce(func.sum(TrainingCapacity.trainer_count), 0),
    ).first()
    placement_count, placed_count, average_employer_rating = (
        db.query(
            func.count(PlacementOutcome.outcome_id),
            func.coalesce(func.sum(PlacementOutcome.placed.cast(Integer)), 0),
            func.avg(PlacementOutcome.employer_rating),
        ).first()
    )
    placement_rate = (
        round(placed_count * 100 / placement_count, 2)
        if placement_count
        else None
    )
    return IntelligenceOverview(
        total_signals=db.query(func.count(MarketSignal.signal_id)).scalar() or 0,
        signals_by_source={source: count for source, count in source_rows},
        top_skills=[
            {
                "skill_name": item["name"],
                "demand_value": item["demand_value"],
                "signal_count": item["signal_count"],
            }
            for item in skill_rows
        ],
        top_roles=[
            {
                "role_title": item["name"],
                "demand_value": item["demand_value"],
                "signal_count": item["signal_count"],
            }
            for item in role_rows
        ],
        top_locations=[
            {
                "location": item["name"],
                "demand_value": item["demand_value"],
                "signal_count": item["signal_count"],
            }
            for item in location_rows
        ],
        proficiency_levels=[
            {
                "proficiency_level": item["name"],
                "demand_value": item["demand_value"],
                "signal_count": item["signal_count"],
            }
            for item in proficiency_rows
        ],
        courses_by_status={course_status: count for course_status, count in course_rows},
        districts_covered=int(capacities[0] or 0),
        training_seats=int(capacities[1] or 0),
        trainer_count=int(capacities[2] or 0),
        placements_reported=int(placement_count or 0),
        placement_rate=placement_rate,
        average_employer_rating=(
            round(float(average_employer_rating), 2)
            if average_employer_rating is not None
            else None
        ),
    )


@router.get("/demand", response_model=DemandBreakdown)
def get_demand_breakdown(
    location: Optional[str] = Query(default=None, max_length=255),
    sector: Optional[str] = Query(default=None, max_length=150),
    role_title: Optional[str] = Query(
        default=None,
        alias="roleTitle",
        max_length=255,
    ),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    query = db.query(MarketSignal)
    if location:
        query = query.filter(MarketSignal.location == location)
    if sector:
        query = query.filter(MarketSignal.sector == sector)
    if role_title:
        query = query.filter(MarketSignal.role_title.ilike(f"%{role_title}%"))
    signal_query = query.subquery()

    def summarize(field):
        rows = (
            db.query(
                field.label("name"),
                func.sum(signal_query.c.demand_value).label("demand_value"),
                func.count(signal_query.c.signal_id).label("signal_count"),
            )
            .select_from(signal_query)
            .group_by(field)
            .order_by(func.sum(signal_query.c.demand_value).desc())
            .limit(20)
            .all()
        )
        return rows

    roles = summarize(signal_query.c.role_title)
    skills = summarize(signal_query.c.skill_name)
    locations = summarize(signal_query.c.location)
    proficiencies = summarize(signal_query.c.proficiency_level)
    return DemandBreakdown(
        top_roles=[
            {
                "role_title": row.name,
                "demand_value": float(row.demand_value or 0),
                "signal_count": int(row.signal_count or 0),
            }
            for row in roles
        ],
        top_skills=[
            {
                "skill_name": row.name,
                "demand_value": float(row.demand_value or 0),
                "signal_count": int(row.signal_count or 0),
            }
            for row in skills
        ],
        top_locations=[
            {
                "location": row.name,
                "demand_value": float(row.demand_value or 0),
                "signal_count": int(row.signal_count or 0),
            }
            for row in locations
        ],
        proficiency_levels=[
            {
                "proficiency_level": row.name,
                "demand_value": float(row.demand_value or 0),
                "signal_count": int(row.signal_count or 0),
            }
            for row in proficiencies
        ],
    )


@router.get("/signals", response_model=List[MarketSignalOut])
def list_market_signals(
    source_type: Optional[str] = Query(
        default=None,
        alias="sourceType",
        max_length=40,
    ),
    location: Optional[str] = Query(default=None, max_length=255),
    role_title: Optional[str] = Query(
        default=None,
        alias="roleTitle",
        max_length=255,
    ),
    skill: Optional[str] = Query(default=None, max_length=150),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    validation_counts = (
        db.query(
            EmployerValidation.signal_id,
            func.count(EmployerValidation.validation_id).label("count"),
        )
        .filter(EmployerValidation.validation_status == "endorsed")
        .group_by(EmployerValidation.signal_id)
        .subquery()
    )
    query = (
        db.query(MarketSignal, func.coalesce(validation_counts.c.count, 0))
        .outerjoin(
            validation_counts,
            validation_counts.c.signal_id == MarketSignal.signal_id,
        )
    )
    if source_type:
        query = query.filter(MarketSignal.source_type == source_type)
    if location:
        query = query.filter(MarketSignal.location == location)
    if role_title:
        query = query.filter(MarketSignal.role_title.ilike(f"%{role_title}%"))
    if skill:
        query = query.filter(MarketSignal.skill_name.ilike(f"%{skill}%"))
    rows = query.order_by(MarketSignal.observed_at.desc()).limit(limit).all()
    return [
        MarketSignalOut(
            signal_id=signal.signal_id,
            source_type=signal.source_type,
            source_reference=signal.source_reference,
            role_title=signal.role_title,
            sector=signal.sector,
            location=signal.location,
            skill_name=signal.skill_name,
            proficiency_level=signal.proficiency_level,
            demand_value=signal.demand_value,
            evidence_summary=signal.evidence_summary,
            contributor_id=signal.contributor_id,
            observed_at=signal.observed_at,
            validation_count=validation_count,
        )
        for signal, validation_count in rows
    ]


@router.post(
    "/signals",
    response_model=MarketSignalOut,
    status_code=status.HTTP_201_CREATED,
)
def create_market_signal(
    payload: MarketSignalCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    contributor_id = require_role(current_user, SIGNAL_WRITERS)
    signal = MarketSignal(
        source_type=payload.source_type,
        source_reference=payload.source_reference,
        role_title=payload.role_title.strip(),
        sector=payload.sector.strip() if payload.sector else None,
        location=payload.location.strip(),
        skill_name=payload.skill_name.strip(),
        proficiency_level=payload.proficiency_level.strip(),
        demand_value=payload.demand_value,
        evidence_summary=payload.evidence_summary,
        contributor_id=contributor_id,
    )
    db.add(signal)
    db.commit()
    db.refresh(signal)
    return MarketSignalOut(
        signal_id=signal.signal_id,
        source_type=signal.source_type,
        source_reference=signal.source_reference,
        role_title=signal.role_title,
        sector=signal.sector,
        location=signal.location,
        skill_name=signal.skill_name,
        proficiency_level=signal.proficiency_level,
        demand_value=signal.demand_value,
        evidence_summary=signal.evidence_summary,
        contributor_id=signal.contributor_id,
        observed_at=signal.observed_at,
        validation_count=0,
    )


@router.post(
    "/signals/{signal_id}/validation",
    response_model=EmployerValidationOut,
    status_code=status.HTTP_201_CREATED,
)
def validate_market_signal(
    signal_id: int,
    payload: EmployerValidationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    employer_id = require_role(current_user, {"recruiter"})
    signal = db.query(MarketSignal).filter(MarketSignal.signal_id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Market signal not found")
    validation = EmployerValidation(
        signal_id=signal_id,
        employer_id=employer_id,
        validation_status=payload.validation_status,
        comments=payload.comments,
    )
    db.add(validation)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="You have already validated this signal",
        ) from None
    db.refresh(validation)
    return validation


@router.get("/courses", response_model=List[CourseOut])
def list_courses(
    sector: Optional[str] = Query(default=None, max_length=150),
    course_status: Optional[str] = Query(
        default=None,
        alias="courseStatus",
        max_length=30,
    ),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    query = db.query(CourseOffering)
    if sector:
        query = query.filter(CourseOffering.sector == sector)
    if course_status:
        query = query.filter(CourseOffering.course_status == course_status)
    return query.order_by(CourseOffering.course_name.asc()).limit(500).all()


@router.post(
    "/courses",
    response_model=CourseOut,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    require_role(current_user, PLATFORM_PLANNERS)
    course = CourseOffering(
        course_code=payload.course_code.strip(),
        course_name=payload.course_name.strip(),
        qualification=payload.qualification,
        sector=payload.sector.strip(),
        target_role=payload.target_role.strip(),
        skills=[skill.strip() for skill in payload.skills if skill.strip()],
        proficiency_levels=payload.proficiency_levels,
        equipment_required=payload.equipment_required,
        trainer_capabilities=payload.trainer_capabilities,
        curriculum_version=payload.curriculum_version,
        placement_rate=payload.placement_rate,
        enrollment_count=payload.enrollment_count,
        course_status=payload.course_status,
    )
    db.add(course)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Course code already exists",
        ) from None
    db.refresh(course)
    return course


@router.patch("/courses/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    require_role(current_user, PLATFORM_PLANNERS)
    course = (
        db.query(CourseOffering)
        .filter(CourseOffering.course_id == course_id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    updates = payload.model_dump(exclude_unset=True)
    for field in ("course_code", "course_name", "sector", "target_role"):
        if field in updates and updates[field] is not None:
            updates[field] = updates[field].strip()
    if "skills" in updates and updates["skills"] is not None:
        updates["skills"] = [
            item.strip() for item in updates["skills"] if item.strip()
        ]
    for field, value in updates.items():
        setattr(course, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Course code already exists",
        ) from None
    db.refresh(course)
    return course


@router.get("/courses/{course_id}/analysis", response_model=CourseAnalysisOut)
def analyze_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    require_role(current_user, PLATFORM_PLANNERS)
    course = (
        db.query(CourseOffering)
        .filter(CourseOffering.course_id == course_id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    result = calculate_course_analysis(db, course)
    db.commit()
    db.refresh(course)
    result.course = course
    return result


@router.get("/capacity", response_model=List[TrainingCapacityOut])
def list_training_capacity(
    district_id: Optional[str] = Query(
        default=None,
        alias="districtId",
        max_length=100,
    ),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    query = db.query(TrainingCapacity)
    if district_id:
        query = query.filter(TrainingCapacity.district_id == district_id)
    return query.order_by(TrainingCapacity.district_id.asc()).limit(500).all()


@router.post(
    "/capacity",
    response_model=TrainingCapacityOut,
    status_code=status.HTTP_201_CREATED,
)
def create_training_capacity(
    payload: TrainingCapacityCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    require_role(current_user, PLATFORM_PLANNERS)
    if payload.course_id and not db.query(CourseOffering).filter(
        CourseOffering.course_id == payload.course_id
    ).first():
        raise HTTPException(status_code=404, detail="Course not found")
    capacity = TrainingCapacity(**payload.model_dump())
    db.add(capacity)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Capacity is already recorded for this district and course",
        ) from None
    db.refresh(capacity)
    return capacity


@router.patch("/capacity/{capacity_id}", response_model=TrainingCapacityOut)
def update_training_capacity(
    capacity_id: int,
    payload: TrainingCapacityUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    require_role(current_user, PLATFORM_PLANNERS)
    capacity = (
        db.query(TrainingCapacity)
        .filter(TrainingCapacity.capacity_id == capacity_id)
        .first()
    )
    if not capacity:
        raise HTTPException(status_code=404, detail="Training capacity not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("course_id") is not None and not db.query(
        CourseOffering.course_id
    ).filter(CourseOffering.course_id == updates["course_id"]).first():
        raise HTTPException(status_code=404, detail="Course not found")
    for field, value in updates.items():
        setattr(capacity, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Capacity is already recorded for this district and course",
        ) from None
    db.refresh(capacity)
    return capacity


@router.post(
    "/placements",
    response_model=PlacementOutcomeOut,
    status_code=status.HTTP_201_CREATED,
)
def record_placement_outcome(
    payload: PlacementOutcomeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    role = current_user.get("role")
    if role not in {"candidate", "recruiter", "policy_officer", "institute_admin"}:
        raise HTTPException(status_code=403, detail="Placement reporting is not allowed")
    if payload.course_id and not db.query(CourseOffering).filter(
        CourseOffering.course_id == payload.course_id
    ).first():
        raise HTTPException(status_code=404, detail="Course not found")
    outcome = PlacementOutcome(
        candidate_id=(
            current_user["user_id"] if role == "candidate" else None
        ),
        course_id=payload.course_id,
        role_title=payload.role_title.strip(),
        sector=payload.sector.strip() if payload.sector else None,
        district_id=payload.district_id.strip(),
        placed=payload.placed,
        candidate_rating=payload.candidate_rating,
        employer_rating=payload.employer_rating,
        course_relevance_score=payload.course_relevance_score,
        feedback_notes=payload.feedback_notes,
    )
    db.add(outcome)
    db.commit()
    db.refresh(outcome)
    return outcome


@router.get("/district-plans/{district_id}", response_model=DistrictPlanOut)
def get_district_training_plan(
    district_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    require_role(current_user, PLATFORM_PLANNERS)
    roles = demand_summaries(db, MarketSignal.role_title, district_id)
    skills = demand_summaries(db, MarketSignal.skill_name, district_id)
    capacities = (
        db.query(TrainingCapacity)
        .filter(TrainingCapacity.district_id == district_id)
        .all()
    )
    capacity_courses = {
        course.course_id: course
        for course in db.query(CourseOffering)
        .filter(CourseOffering.course_id.in_(
            [item.course_id for item in capacities if item.course_id is not None]
        ))
        .all()
    } if any(item.course_id is not None for item in capacities) else {}
    available_courses = (
        db.query(CourseOffering)
        .join(
            TrainingCapacity,
            TrainingCapacity.course_id == CourseOffering.course_id,
        )
        .filter(TrainingCapacity.district_id == district_id)
        .all()
    )
    supplied_skills = {
        skill.casefold()
        for course in available_courses
        for skill in (course.skills or [])
        if isinstance(skill, str)
    }
    available_equipment = {
        item.casefold()
        for capacity in capacities
        for item in (capacity.equipment_available or [])
        if isinstance(item, str)
    }
    required_equipment = {
        item
        for course in capacity_courses.values()
        for item in (course.equipment_required or [])
        if isinstance(item, str)
    }
    equipment_gaps = sorted(
        item for item in required_equipment
        if item.casefold() not in available_equipment
    )
    available_trainer_capabilities = {
        item.casefold()
        for capacity in capacities
        for item in (capacity.trainer_capabilities or [])
        if isinstance(item, str)
    }
    required_trainer_capabilities = {
        item
        for course in capacity_courses.values()
        for item in (course.trainer_capabilities or [])
        if isinstance(item, str)
    }
    trainer_capability_gaps = sorted(
        item for item in required_trainer_capabilities
        if item.casefold() not in available_trainer_capabilities
    )
    missing_skills = [
        item["name"]
        for item in skills
        if item["name"].casefold() not in supplied_skills
    ]
    seats = sum(item.seats for item in capacities)
    trainers = sum(item.trainer_count for item in capacities)
    actions = []
    if not skills:
        actions.append(
            "Collect local job-posting, employer-survey, or industry-consultation "
            "signals before setting training priorities."
        )
    if missing_skills:
        actions.append(
            "Review course and trainer coverage for high-demand skills: "
            + ", ".join(missing_skills[:10])
            + "."
        )
    if equipment_gaps:
        actions.append(
            "Plan equipment procurement or sharing for course requirements not "
            "reported as available: "
            + ", ".join(equipment_gaps[:10])
            + "."
        )
    if trainer_capability_gaps:
        actions.append(
            "Plan trainer development or recruitment for capabilities not "
            "currently reported: "
            + ", ".join(trainer_capability_gaps[:10])
            + "."
        )
    if not capacities:
        actions.append(
            "Collect institute seat, trainer, equipment, and infrastructure capacity."
        )
    if capacities and any(item.equipment_readiness < 70 for item in capacities):
        actions.append(
            "Prioritize equipment verification and procurement planning for "
            "courses below 70% readiness."
        )
    if capacities and any(item.infrastructure_readiness < 70 for item in capacities):
        actions.append(
            "Review infrastructure requirements for courses below 70% readiness."
        )
    if not actions:
        actions.append(
            "Current capacity covers the recorded priority skills; continue "
            "employer validation and monitor new signals."
        )

    return DistrictPlanOut(
        district_id=district_id,
        priority_roles=[
            {
                "role_title": item["name"],
                "demand_value": item["demand_value"],
                "signal_count": item["signal_count"],
            }
            for item in roles
        ],
        priority_skills=[
            {
                "skill_name": item["name"],
                "demand_value": item["demand_value"],
                "signal_count": item["signal_count"],
            }
            for item in skills
        ],
        available_seats=seats,
        trainer_count=trainers,
        equipment_readiness=(
            round(sum(item.equipment_readiness for item in capacities) / len(capacities), 2)
            if capacities
            else None
        ),
        infrastructure_readiness=(
            round(
                sum(item.infrastructure_readiness for item in capacities)
                / len(capacities),
                2,
            )
            if capacities
            else None
        ),
        equipment_gaps=equipment_gaps,
        trainer_capability_gaps=trainer_capability_gaps,
        actions=actions,
    )


@router.get("/candidate-guidance")
def get_candidate_guidance(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    if current_user.get("role") != "candidate":
        raise HTTPException(status_code=403, detail="Candidate access required")
    from app.models.user import CandidateProfile

    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user["user_id"])
        .first()
    )
    profile_data = profile.skill_gap_profile if profile else {}
    candidate_skills = {
        item.casefold()
        for item in (
            profile_data.get("skills", [])
            if isinstance(profile_data, dict)
            and isinstance(profile_data.get("skills", []), list)
            else []
        )
        if isinstance(item, str)
    }
    location = profile.location_pref if profile else None
    demand_rows = (
        db.query(
            MarketSignal.skill_name,
            func.sum(MarketSignal.demand_value).label("demand"),
        )
        .filter(
            (MarketSignal.location == location) if location else True
        )
        .group_by(MarketSignal.skill_name)
        .order_by(func.sum(MarketSignal.demand_value).desc())
        .limit(20)
        .all()
    )
    high_demand_gaps = [
        row.skill_name
        for row in demand_rows
        if row.skill_name.casefold() not in candidate_skills
    ]
    courses = db.query(CourseOffering).filter(
        CourseOffering.course_status == "active"
    ).all()
    recommendations = [
        {
            "courseId": course.course_id,
            "courseName": course.course_name,
            "targetRole": course.target_role,
            "matchingSkills": [
                skill for skill in (course.skills or [])
                if isinstance(skill, str)
                and skill.casefold() in {gap.casefold() for gap in high_demand_gaps}
            ],
        }
        for course in courses
    ]
    recommendations = [
        item for item in recommendations if item["matchingSkills"]
    ]
    return {
        "location": location,
        "currentSkills": sorted(candidate_skills),
        "prioritySkillGaps": high_demand_gaps,
        "recommendedCourses": recommendations,
    }
