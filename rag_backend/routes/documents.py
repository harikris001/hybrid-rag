from fastapi import HTTPException
from fastapi import APIRouter, UploadFile, File, BackgroundTasks
import os
import shutil

from services.ingestion_service import get_ingestion_service
from db import get_chroma_client

router = APIRouter()

DOCS_FOLDER = "./docs"

db_client = get_chroma_client()

# Function to list all the documents that is uploaded into to ./docs folder.
@router.get("/")
def get_files(): 
    """
    Returns a list of all documents present in the ./docs folder.
    """
    os.makedirs(DOCS_FOLDER, exist_ok=True)
    files = os.listdir(DOCS_FOLDER)
    
    return {"files": files}


@router.post("/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload a document and trigger ingestion into the vector database.
    The embedding + ingestion runs as a background task so the upload
    response returns immediately.
    """
    os.makedirs(DOCS_FOLDER, exist_ok=True)

    if file.filename in os.listdir(DOCS_FOLDER):
        return {"message": "File already exists"}

    file_path = os.path.join(DOCS_FOLDER, file.filename)

    # Save the uploaded file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Trigger background ingestion into ChromaDB
    background_tasks.add_task(run_ingestion, file_path, file.filename)

    return {
        "filename": file.filename,
        "saved_to": file_path,
        "message": "File uploaded. Ingestion into vector database started in background.",
    }

@router.get("/chunks/{chunk_id}")
def get_chunk_by_id(chunk_id: str):
    """
    Fetch a single chunk's text and metadata by its ChromaDB ID.
    """
    collection = db_client.get_or_create_collection(name="knowledge_base")
    try:
        result = collection.get(ids=[chunk_id], include=["documents", "metadatas"])
        if not result["ids"]:
            raise HTTPException(status_code=404, detail="Chunk not found")
        
        return {
            "id": result["ids"][0],
            "document": result["documents"][0],
            "metadata": result["metadatas"][0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def run_ingestion(file_path: str, filename: str):
    """Background task that ingests the document into the vector DB."""
    try:
        ingestion_service = get_ingestion_service()
        result = await ingestion_service.ingest_document(file_path)
        print(f"[Ingestion] {filename}: {result}")
    except Exception as e:
        print(f"[Ingestion Error] {filename}: {e}")
