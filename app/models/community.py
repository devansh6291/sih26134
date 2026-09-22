from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Community(Base):
    __tablename__ = "communities"

    community_id = Column(Integer, primary_key=True, index=True)
    skill_tag = Column(String(100), unique=True, index=True, nullable=False)
    member_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    threads = relationship("Thread", back_populates="community")

class Thread(Base):
    __tablename__ = "threads"

    thread_id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    thread_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    community = relationship("Community", back_populates="threads")
    posts = relationship("ThreadPost", back_populates="thread")

class ThreadPost(Base):
    __tablename__ = "thread_posts"

    post_id = Column(Integer, primary_key=True, index=True)
    parent_thread_id = Column(Integer, ForeignKey("threads.thread_id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    content_body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    thread = relationship("Thread", back_populates="posts")

class FollowRelation(Base):
    __tablename__ = "follow_relations"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    followed_entity_type = Column(String(50), nullable=False)
    followed_entity_id = Column(String(100), nullable=False)

class FeedItem(Base):
    __tablename__ = "feed_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    feed_ranking_score = Column(Float, default=0.0)
    item_type = Column(String(50), nullable=False)
    item_id = Column(Integer, nullable=False)