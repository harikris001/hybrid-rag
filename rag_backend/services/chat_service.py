from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import json
import asyncio
from fastapi import Depends
from db import get_db
from services.agent_service import get_agent_service

from pydantic_ai.messages import ModelRequest, ModelResponse, UserPromptPart, TextPart
from models.message import Message
from services.agent_service import AgentService
from services.memory_agent_service import MemoryAgentService
from db import async_sessionLocal


class ChatService:
    def __init__(self, db: AsyncSession, agent_service: AgentService, memory_service: MemoryAgentService):
        self.db = db
        self.agent_service = agent_service
        self.memory_service = memory_service

    async def get_history(self, conversation_id: str):
        """Fetch previous messages for a conversation."""
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.timestamp)
        )
        return result.scalars().all()

    def _format_history(self, db_messages: list[Message]) -> list[ModelRequest | ModelResponse]:
        """Convert DB messages into PydanticAI's message_history format."""
        history = []
        for msg in db_messages:
            if msg.role == "user":
                history.append(ModelRequest(parts=[UserPromptPart(content=msg.content)]))
            elif msg.role == "assistant":
                history.append(ModelResponse(parts=[TextPart(content=msg.content)]))
        return history

    async def _get_profile_context(self) -> str:
        """Fetch the user profile and format it as a context string for the RAG agent."""
        profile = await self.memory_service.get_profile("default_user")
        if profile and (profile.interests or profile.preferences):
            return f"Interests: {profile.interests}\nPreferences: {profile.preferences}"
        return ""

    async def process_message(self, conversation_id: str, prompt: str) -> str:
        """Handles fetching history, saving messages, and querying the agent."""
        db_messages = await self.get_history(conversation_id)
        formatted_history = self._format_history(db_messages)
        profile_context = await self._get_profile_context()

        user_msg = Message(
            id=str(uuid.uuid4()), 
            content=prompt, 
            conversation_id=conversation_id, 
            role="user"
        )
        self.db.add(user_msg)

        response_data = await self.agent_service.query(prompt, formatted_history, user_profile_context=profile_context)
        ai_text = response_data["answer"]

        ai_reply = Message(
            id=str(uuid.uuid4()), 
            content=ai_text, 
            conversation_id=conversation_id, 
            role="assistant"
        )
        self.db.add(ai_reply)

        await self.db.commit()

        # Fire-and-forget: run the memory agent in the background
        self._schedule_memory_update(prompt, ai_text)
        
        return ai_text

    async def stream_message(self, conversation_id: str, prompt: str):
        """Handles streaming responses and saving messages at the end."""
        db_messages = await self.get_history(conversation_id)
        formatted_history = self._format_history(db_messages)
        profile_context = await self._get_profile_context()

        user_msg = Message(id=str(uuid.uuid4()), content=prompt, conversation_id=conversation_id, role="user")
        self.db.add(user_msg)
        
        full_response = ""
        message_metadata = None
        try:
            async for event in self.agent_service.stream_query(prompt, formatted_history, user_profile_context=profile_context):
                event_type = event.get("event")
                if event_type == "text":
                    text_content = event["content"]
                    full_response += text_content
                    yield f"data: {json.dumps({'content': text_content})}\n\n"
                elif event_type in ("tool_start", "tool_complete"):
                    yield f"event: {event_type}\ndata: {json.dumps(event)}\n\n"
                elif event_type == "metadata":
                    message_metadata = event
                    metadata_json = json.dumps(event)
                    yield f"event: metadata\ndata: {metadata_json}\n\n"
            
            ai_reply = Message(
                id=str(uuid.uuid4()),
                content=full_response,
                conversation_id=conversation_id,
                role="assistant",
                metadata_=message_metadata
            )
            self.db.add(ai_reply)
            await self.db.commit()

            # Fire-and-forget: run the memory agent in the background
            self._schedule_memory_update(prompt, full_response)
            
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    def _schedule_memory_update(self, user_message: str, ai_response: str):
        """Fire-and-forget background task to analyze the conversation and update the user profile."""
        async def _bg_memory_update():
            try:
                async with async_sessionLocal() as session:
                    bg_memory = MemoryAgentService(session)
                    await bg_memory.analyze_and_update("default_user", user_message, ai_response)
            except Exception as e:
                print(f"[MemoryAgent Background] Error: {e}")

        asyncio.create_task(_bg_memory_update())


def get_chat_service(db: AsyncSession = Depends(get_db), agent_service: AgentService = Depends(get_agent_service)):
    memory_service = MemoryAgentService(db)
    return ChatService(db, agent_service, memory_service)
