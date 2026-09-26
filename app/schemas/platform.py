from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import Field, field_validator, model_validator

from app.schemas.base import BaseCamelModel


SignalSource = Literal[
    "job_posting",
    "employer_survey",
    "industry_consultation",
    "sector_growth",
    "placement_outcome",
    "emerging_technology",
]
ProficiencyLevel = Literal[
    "beginner",
    "intermediate",
    "advanced",
    "expert",
    "unspecified",
]

CourseStatus = Literal["active", "under_review", "obsolete", "oversupplied"]


class MarketSignalCreate(BaseCamelModel):
    source_type: SignalSource
    source_reference: Optional[str] = Field(default=None, max_length=255)
    role_title: str = Field(min_length=1, max_length=255)
    sector: Optional[str] = Field(default=None, max_length=150)
    location: str = Field(min_length=1, max_length=255)
    skill_name: str = Field(min_length=1, max_length=150)
    proficiency_level: ProficiencyLevel = "unspecified"
    demand_value: float = Field(default=1, ge=0)
    evidence_summary: Optional[str] = Field(default=None, max_length=5000)

    @field_validator("role_title", "location", "skill_name")
    @classmethod
    def reject_blank_values(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class MarketSignalOut(BaseCamelModel):
    signal_id: int
    source_type: SignalSource
    source_reference: Optional[str]
    role_title: str
    sector: Optional[str]
    location: str
    skill_name: str
    proficiency_level: str
    demand_value: float
    evidence_summary: Optional[str]
    contributor_id: Optional[int]
    observed_at: datetime
    validation_count: int = 0


class EmployerValidationCreate(BaseCamelModel):
    validation_status: Literal["endorsed", "needs_revision", "rejected"]
    comments: Optional[str] = Field(default=None, max_length=2000)


class EmployerValidationOut(BaseCamelModel):
    validation_id: int
    signal_id: int
    employer_id: int
    validation_status: str
    comments: Optional[str]
    created_at: datetime


class CourseCreate(BaseCamelModel):
    course_code: str = Field(min_length=1, max_length=100)
    course_name: str = Field(min_length=1, max_length=255)
    qualification: Optional[str] = Field(default=None, max_length=255)
    sector: str = Field(min_length=1, max_length=150)
    target_role: str = Field(min_length=1, max_length=255)
    skills: List[str] = Field(default_factory=list, max_length=100)
    proficiency_levels: Dict[str, ProficiencyLevel] = Field(default_factory=dict)
    equipment_required: List[str] = Field(default_factory=list, max_length=100)
    trainer_capabilities: List[str] = Field(default_factory=list, max_length=100)
    curriculum_version: Optional[str] = Field(default=None, max_length=100)
    placement_rate: Optional[float] = Field(default=None, ge=0, le=100)
    enrollment_count: int = Field(default=0, ge=0)
    course_status: CourseStatus = "active"

    @field_validator("course_code", "course_name", "sector", "target_role")
    @classmethod
    def reject_blank_course_fields(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class CourseUpdate(BaseCamelModel):
    course_code: Optional[str] = Field(default=None, min_length=1, max_length=100)
    course_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    qualification: Optional[str] = Field(default=None, max_length=255)
    sector: Optional[str] = Field(default=None, min_length=1, max_length=150)
    target_role: Optional[str] = Field(default=None, min_length=1, max_length=255)
    skills: Optional[List[str]] = Field(default=None, max_length=100)
    proficiency_levels: Optional[Dict[str, ProficiencyLevel]] = None
    equipment_required: Optional[List[str]] = Field(default=None, max_length=100)
    trainer_capabilities: Optional[List[str]] = Field(default=None, max_length=100)
    curriculum_version: Optional[str] = Field(default=None, max_length=100)
    placement_rate: Optional[float] = Field(default=None, ge=0, le=100)
    enrollment_count: Optional[int] = Field(default=None, ge=0)
    course_status: Optional[CourseStatus] = None

    @model_validator(mode="after")
    def reject_null_non_nullable_fields(self):
        nullable_fields = {"qualification", "curriculum_version", "placement_rate"}
        for field in self.model_fields_set - nullable_fields:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        for field in ("course_code", "course_name", "sector", "target_role"):
            value = getattr(self, field)
            if value is not None:
                value = value.strip()
                if not value:
                    raise ValueError(f"{field} cannot be blank")
                setattr(self, field, value)
        return self


class CourseOut(BaseCamelModel):
    course_id: int
    course_code: str
    course_name: str
    qualification: Optional[str]
    sector: str
    target_role: str
    skills: List[str]
    proficiency_levels: Dict[str, ProficiencyLevel]
    equipment_required: List[str]
    trainer_capabilities: List[str]
    curriculum_version: Optional[str]
    placement_rate: Optional[float]
    enrollment_count: int
    course_status: CourseStatus
    recommended_update: Optional[str]
    updated_at: datetime


class CourseAnalysisOut(BaseCamelModel):
    course: CourseOut
    demand_score: float
    missing_high_demand_skills: List[str]
    demand_matched_skills: List[str]
    proficiency_gaps: List[str]
    recommendation: str


class TrainingCapacityCreate(BaseCamelModel):
    district_id: str = Field(min_length=1, max_length=100)
    course_id: Optional[int] = Field(default=None, ge=1)
    seats: int = Field(default=0, ge=0)
    trainer_count: int = Field(default=0, ge=0)
    trainer_capabilities: List[str] = Field(default_factory=list, max_length=100)
    equipment_available: List[str] = Field(default_factory=list, max_length=200)
    equipment_readiness: float = Field(default=0, ge=0, le=100)
    infrastructure_readiness: float = Field(default=0, ge=0, le=100)


class TrainingCapacityUpdate(BaseCamelModel):
    district_id: Optional[str] = Field(default=None, min_length=1, max_length=100)
    course_id: Optional[int] = Field(default=None, ge=1)
    seats: Optional[int] = Field(default=None, ge=0)
    trainer_count: Optional[int] = Field(default=None, ge=0)
    trainer_capabilities: Optional[List[str]] = Field(default=None, max_length=100)
    equipment_available: Optional[List[str]] = Field(default=None, max_length=200)
    equipment_readiness: Optional[float] = Field(default=None, ge=0, le=100)
    infrastructure_readiness: Optional[float] = Field(default=None, ge=0, le=100)

    @model_validator(mode="after")
    def reject_null_non_nullable_fields(self):
        nullable_fields = {"course_id"}
        for field in self.model_fields_set - nullable_fields:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        if self.district_id is not None:
            self.district_id = self.district_id.strip()
            if not self.district_id:
                raise ValueError("district_id cannot be blank")
        return self


class TrainingCapacityOut(BaseCamelModel):
    capacity_id: int
    district_id: str
    course_id: Optional[int]
    seats: int
    trainer_count: int
    trainer_capabilities: List[str]
    equipment_available: List[str]
    equipment_readiness: float
    infrastructure_readiness: float
    updated_at: datetime


class PlacementOutcomeCreate(BaseCamelModel):
    course_id: Optional[int] = None
    role_title: str = Field(min_length=1, max_length=255)
    sector: Optional[str] = Field(default=None, max_length=150)
    district_id: str = Field(min_length=1, max_length=100)
    placed: bool = True
    candidate_rating: Optional[float] = Field(default=None, ge=1, le=5)
    employer_rating: Optional[float] = Field(default=None, ge=1, le=5)
    course_relevance_score: Optional[float] = Field(default=None, ge=0, le=100)
    feedback_notes: Optional[str] = Field(default=None, max_length=5000)


class PlacementOutcomeOut(BaseCamelModel):
    outcome_id: int
    candidate_id: Optional[int]
    course_id: Optional[int]
    role_title: str
    sector: Optional[str]
    district_id: str
    placed: bool
    candidate_rating: Optional[float]
    employer_rating: Optional[float]
    course_relevance_score: Optional[float]
    feedback_notes: Optional[str]
    reported_at: datetime


class DemandSummary(BaseCamelModel):
    skill_name: str
    demand_value: float
    signal_count: int


class RoleDemandSummary(BaseCamelModel):
    role_title: str
    demand_value: float
    signal_count: int


class LocationDemandSummary(BaseCamelModel):
    location: str
    demand_value: float
    signal_count: int


class ProficiencyDemandSummary(BaseCamelModel):
    proficiency_level: str
    demand_value: float
    signal_count: int


class DemandBreakdown(BaseCamelModel):
    top_roles: List[RoleDemandSummary]
    top_skills: List[DemandSummary]
    top_locations: List[LocationDemandSummary]
    proficiency_levels: List[ProficiencyDemandSummary]


class IntelligenceOverview(BaseCamelModel):
    total_signals: int
    signals_by_source: Dict[str, int]
    top_skills: List[DemandSummary]
    top_roles: List[RoleDemandSummary]
    top_locations: List[LocationDemandSummary]
    proficiency_levels: List[ProficiencyDemandSummary]
    courses_by_status: Dict[str, int]
    districts_covered: int
    training_seats: int
    trainer_count: int
    placements_reported: int
    placement_rate: Optional[float]
    average_employer_rating: Optional[float]


class DistrictPlanOut(BaseCamelModel):
    district_id: str
    priority_roles: List[RoleDemandSummary]
    priority_skills: List[DemandSummary]
    available_seats: int
    trainer_count: int
    equipment_readiness: Optional[float]
    infrastructure_readiness: Optional[float]
    equipment_gaps: List[str]
    trainer_capability_gaps: List[str]
    actions: List[str]
