from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime
from sqlalchemy import select, delete, update

from models.conversations import Conversation
from models.message import Message
from schemas.title_update import TitleUpdate
from db import get_db

router = APIRouter()


@router.get("/list")
async def get_conversations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation))
    return result.scalars().all()


@router.post("/new")
async def new_conversation(db: AsyncSession = Depends(get_db)):

    id = str(uuid.uuid4())
    now = datetime.utcnow()
    new_conversation = Conversation(id=id, title=str(now), created_at=now)
    db.add(new_conversation)
    await db.commit()
    return {
        "id": id,
        "title": str(now),
        "created_at": now.isoformat()
    }

@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages_result = await db.execute(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.timestamp))
    messages = messages_result.scalars().all()
    
    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "timestamp": msg.timestamp,
                "conversation_id": msg.conversation_id,
                "role": msg.role,
                "metadata": msg.metadata_,
            }
            for msg in messages
        ]
    }

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    await db.execute(delete(Message).where(Message.conversation_id == conversation_id))
    await db.execute(delete(Conversation).where(Conversation.id == conversation_id))
    await db.commit()
    
    return {
        "message": "Conversation deleted successfully"
    }

@router.patch("/{conversation_id}/title")
async def update_conversation_title(conversation_id: str, request: TitleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    await db.execute(update(Conversation).where(Conversation.id == conversation_id).values(title=request.title))
    await db.commit()
    
    return {
        "id": conversation_id,
        "title": request.title
    }
