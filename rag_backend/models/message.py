from models.base import Base

from sqlalchemy import Column, TEXT, TIMESTAMP, ForeignKey, JSON
from datetime import datetime

class Message(Base):
    __tablename__ = "messages"
    id = Column(TEXT, primary_key=True)
    content = Column(TEXT)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    conversation_id = Column(TEXT, ForeignKey("conversations.id"))
    role = Column(TEXT)
    metadata_ = Column("metadata", JSON, nullable=True)