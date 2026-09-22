from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.gap_mapping import GapFlag, ValidationVote
from app.schemas.base import BaseCamelModel

router = APIRouter(prefix="/gaps", tags=["Gap Mapping & Ownership Execution"])

class GapFlagCreate(BaseCamelModel):
    gap_type: str 
    assigned_owner_id: int
    due_days: int = 14

class GapVoteRequest(BaseCamelModel):
    vote_type: str 

@router.post("")
def create_gap(payload: GapFlagCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    due_date = datetime.now(timezone.utc) + timedelta(days=payload.due_days)
    gap = GapFlag(
        gap_type=payload.gap_type,
        assigned_owner_id=payload.assigned_owner_id,
        due_date=due_date,
        status_pipeline_stage="flagged",
    )
    db.add(gap)
    db.commit()
    db.refresh(gap)
    return gap

@router.post("/{gap_id}/vote")
def vote_on_gap(gap_id: int, payload: GapVoteRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    vote = ValidationVote(
        voter_id=current_user["user_id"],
        target_gap_id=gap_id,
        vote_type=payload.vote_type,
    )
    db.add(vote)
    db.commit()
    return {"status": "success", "message": "Employer validation vote recorded"}