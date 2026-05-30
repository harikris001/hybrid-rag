from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    prompt: str
    conversation_id: str
