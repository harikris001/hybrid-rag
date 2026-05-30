from fastapi import FastAPI
from contextlib import asynccontextmanager

from routes import documents
from routes import chat
from routes import conversation

from db import engine
from models.base import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup asynchronously
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(documents.router, prefix="/doc")
app.include_router(chat.router, prefix="/chat")
app.include_router(conversation.router, prefix="/conversations")

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/query")
async def query_rag(query: str):
    return {"message": "Hello World"}