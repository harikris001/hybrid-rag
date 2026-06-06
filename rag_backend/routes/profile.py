import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from db import get_db
from models.user_profile import UserProfile
from services.memory_events import memory_event_queue

router = APIRouter()


@router.get("/")
async def get_user_profile(db: AsyncSession = Depends(get_db)):
    """Returns the current user profile (interests, preferences, updated_at)."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == "default_user")
    )
    profile = result.scalar_one_or_none()

    if not profile:
        return {"interests": [], "preferences": [], "updated_at": None}

    return {
        "interests": profile.interests or [],
        "preferences": profile.preferences or [],
        "updated_at": str(profile.updated_at) if profile.updated_at else None,
    }


@router.get("/stream")
async def profile_stream():
    """
    Persistent SSE connection for real-time memory update notifications.
    The frontend opens an EventSource to this endpoint on app load.
    Events are pushed by the background memory agent via the global queue.
    """
    async def event_generator():
        while True:
            # Blocks until the memory agent pushes an event
            event = await memory_event_queue.get()
            yield f"event: memory_updated\ndata: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/")
async def clear_user_profile(db: AsyncSession = Depends(get_db)):
    """Clears the entire user profile (resets all memory)."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == "default_user")
    )
    profile = result.scalar_one_or_none()

    if not profile:
        return {"message": "No profile to clear"}

    profile.interests = []
    profile.preferences = []
    profile.updated_at = datetime.utcnow()
    await db.commit()

    return {"message": "Profile cleared successfully"}


@router.delete("/interests/{interest}")
async def delete_interest(interest: str, db: AsyncSession = Depends(get_db)):
    """Removes a single interest from the user profile."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == "default_user")
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    current = profile.interests or []
    if interest not in current:
        raise HTTPException(status_code=404, detail=f"Interest '{interest}' not found")

    current.remove(interest)
    profile.interests = current
    profile.updated_at = datetime.utcnow()
    await db.commit()

    return {"interests": profile.interests}


@router.delete("/preferences/{preference}")
async def delete_preference(preference: str, db: AsyncSession = Depends(get_db)):
    """Removes a single preference from the user profile."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == "default_user")
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    current = profile.preferences or []
    if preference not in current:
        raise HTTPException(status_code=404, detail=f"Preference '{preference}' not found")

    current.remove(preference)
    profile.preferences = current
    profile.updated_at = datetime.utcnow()
    await db.commit()

    return {"preferences": profile.preferences}
