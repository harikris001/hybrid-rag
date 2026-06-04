from models.base import Base

from sqlalchemy import Column, TEXT, JSON, TIMESTAMP
from datetime import datetime


class UserProfile(Base):
    __tablename__ = "user_profiles"
    user_id = Column(TEXT, primary_key=True)
    interests = Column(JSON, default=list)
    preferences = Column(JSON, default=list)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)