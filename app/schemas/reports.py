from typing import List, Dict, Any
from app.schemas.base import BaseCamelModel

class WeeklyDigest(BaseCamelModel):
    trending_skills: List[str]
    hot_threads: List[Dict[str, Any]]
    new_job_posts: List[Dict[str, Any]]

class MonthlyIntelReport(BaseCamelModel):
    demand_trend: str
    top_requested_skills: List[str]
    flagged_obsolete_topics: List[str]

class DistrictRollupReport(BaseCamelModel):
    district_id: str
    capacity_gap_summary: Dict[str, Any]
    trainer_dev_needs: List[str]