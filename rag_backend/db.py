import os
import chromadb
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

load_dotenv()

# DATABASE_URL = 'postgresql://postgres:hari2001@localhost:5432/jamit'
DATABASE_URL = os.environ.get("DATABASE_URL")


engine = create_async_engine(DATABASE_URL, echo=True, connect_args={"check_same_thread": False})

async_sessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)
print("Connected To DATABASE")

async def get_db():
    db = async_sessionLocal()
    try:
        yield db
    finally:
        await db.close()

# ChromaDB Client Singleton
_chroma_client = None

def get_chroma_client() -> chromadb.PersistentClient:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path="./chromadb")
        print("Connected To ChromaDB")
    return _chroma_client