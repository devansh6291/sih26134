from datetime import datetime
from typing import List, Optional
from app.schemas.base import BaseCamelModel

class CommunityCreate(BaseCamelModel):
    skill_tag: str

class CommunityOut(BaseCamelModel):
    community_id: int
    skill_tag: str
    member_count: int

class ThreadCreate(BaseCamelModel):
    community_id: int
    thread_type: str 
    title: str
    first_post_body: str

class ThreadPostCreate(BaseCamelModel):
    content_body: str

class ThreadPostOut(BaseCamelModel):
    post_id: int
    parent_thread_id: int
    author_id: int
    content_body: str
    created_at: datetime

class ThreadOut(BaseCamelModel):
    thread_id: int
    community_id: int
    thread_type: str
    title: str
    created_at: datetime
    posts: List[ThreadPostOut] = []

class FollowRequest(BaseCamelModel):
    followed_entity_type: str 
    followed_entity_id: str

class FeedItemOut(BaseCamelModel):
    id: int
    item_type: str
    item_id: int
    feed_ranking_score: float