from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.community import Community, Thread, ThreadPost, FollowRelation, FeedItem
from app.schemas.community import CommunityCreate, CommunityOut, ThreadCreate, ThreadOut, ThreadPostCreate, ThreadPostOut, FollowRequest, FeedItemOut

router = APIRouter(prefix="/communities", tags=["Communities & Threads"])

@router.post("", response_model=CommunityOut)
def create_community(payload: CommunityCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    existing = db.query(Community).filter(Community.skill_tag == payload.skill_tag).first()
    if existing:
        return existing
    community = Community(skill_tag=payload.skill_tag, member_count=1)
    db.add(community)
    db.commit()
    db.refresh(community)
    return community

@router.get("", response_model=List[CommunityOut])
def list_communities(db: Session = Depends(get_db)):
    return db.query(Community).all()

@router.post("/threads", response_model=ThreadOut)
def create_thread(payload: ThreadCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    thread = Thread(
        community_id=payload.community_id,
        thread_type=payload.thread_type,
        title=payload.title,
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)

    first_post = ThreadPost(
        parent_thread_id=thread.thread_id,
        author_id=current_user["user_id"],
        content_body=payload.first_post_body,
    )
    db.add(first_post)
    db.commit()
    db.refresh(thread)
    return thread

@router.get("/threads/{thread_id}", response_model=ThreadOut)
def get_thread(thread_id: int, db: Session = Depends(get_db)):
    thread = db.query(Thread).filter(Thread.thread_id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    return thread

@router.post("/threads/{thread_id}/posts", response_model=ThreadPostOut)
def add_post(thread_id: int, payload: ThreadPostCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    post = ThreadPost(
        parent_thread_id=thread_id,
        author_id=current_user["user_id"],
        content_body=payload.content_body,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.post("/follow")
def follow_entity(payload: FollowRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user_payload)):
    relation = FollowRelation(
        follower_id=current_user["user_id"],
        followed_entity_type=payload.followed_entity_type,
        followed_entity_id=payload.followed_entity_id,
    )
    db.add(relation)
    db.commit()
    return {"status": "success", "message": f"Followed {payload.followed_entity_type}"}

@router.get("/feed", response_model=List[FeedItemOut])
def get_feed(current_user: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    return db.query(FeedItem).filter(FeedItem.user_id == current_user["user_id"]).all()