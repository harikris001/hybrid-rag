import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from schemas.chat import ChatRequest
from services.chat_service import ChatService, get_chat_service


router = APIRouter()


@router.post("/")
async def chat_endpoint(request: ChatRequest, chat_service: ChatService = Depends(get_chat_service)):
    response = await chat_service.process_message(request.conversation_id, request.prompt)
    return {"response": response}


@router.post("/stream")
async def chat_stream_endpoint(request: ChatRequest, chat_service: ChatService = Depends(get_chat_service)):
    """Stream the agent's response as Server-Sent Events (SSE)."""
    return StreamingResponse(
        chat_service.stream_message(request.conversation_id, request.prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering if behind a proxy
        }
    )