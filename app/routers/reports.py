from fastapi import APIRouter
from app.schemas.reports import WeeklyDigest, MonthlyIntelReport, DistrictRollupReport

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/weekly", response_model=WeeklyDigest)
def get_weekly_digest():
    return WeeklyDigest(
        trending_skills=["FastAPI", "Generative AI", "Rust", "React 19"],
        hot_threads=[
            {"threadId": 101, "title": "Real-time WebSockets with FastAPI", "replies": 38},
            {"threadId": 104, "title": "Cracking Tier-1 SDE Interviews", "replies": 84}
        ],
        new_job_posts=[
            {"jobId": 401, "roleTitle": "Full Stack Engineer", "location": "Indore, MP"}
        ]
    )

@router.get("/monthly", response_model=MonthlyIntelReport)
def get_monthly_report():
    return MonthlyIntelReport(
        demand_trend="Surging demand for Cloud-native backend engineers and AI agent developers.",
        top_requested_skills=["Python", "FastAPI", "Docker", "PostgreSQL", "Next.js"],
        flagged_obsolete_topics=["Legacy COBOL", "PHP 5.x procedural syntax", "Manual VM provisioning"]
    )

@router.get("/district/{district_id}", response_model=DistrictRollupReport)
def get_district_report(district_id: str):
    return DistrictRollupReport(
        district_id=district_id,
        capacity_gap_summary={
            "totalTrained": 1420,
            "placedCount": 1180,
            "undersuppliedDomains": ["Embedded Systems", "Edge AI"]
        },
        trainer_dev_needs=[
            "Microcontroller programming with Rust",
            "Modern Async Python API Design"
        ]
    )