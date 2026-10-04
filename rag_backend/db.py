import os
import chromadb
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

load_dotenv()

# DATABASE_URL = 'postgresql://postgres:hari2001@localhost:5432/jamit'
DATABASE_URL = os.environ.get("DATABASE_URL")

engine_kwargs = {"echo": True}
if DATABASE_URL and DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

async_sessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)
print("Connected To DATABASE")

async def get_db():
    db = async_sessionLocal()
    try:
        yield db
    finally:
        await db.close()

# ChromaDB Configuration
CHROMA_COLLECTION_NAME = "knowledge_base"
CHROMA_COLLECTION_METADATA = {
    "hnsw:space": "ip",
    "hnsw:M": 32,                 # Max bidirectional links per node in HNSW graph
    "hnsw:construction_ef": 200,  # Search depth during index construction
    "hnsw:search_ef": 50,         # Search depth during query time
}

# ChromaDB Client Singleton
_chroma_client = None

def get_chroma_client() -> chromadb.PersistentClient:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path="./chromadb")
        print("Connected To ChromaDB")
    return _chroma_client

def get_knowledge_base_collection(client: chromadb.PersistentClient = None):
    """Returns or creates the knowledge_base collection configured with inner product (ip) metric."""
    if client is None:
        client = get_chroma_client()
    return client.get_or_create_collection(
        name=CHROMA_COLLECTION_NAME,
        metadata=CHROMA_COLLECTION_METADATA
    )