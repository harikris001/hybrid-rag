from click import echo
import os
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