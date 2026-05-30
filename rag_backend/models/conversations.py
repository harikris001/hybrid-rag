from models.base import Base

from sqlalchemy import Column, TEXT, TIMESTAMP
from datetime import datetime

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(TEXT, primary_key=True)
    title = Column(TEXT, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    