from fastapi import APIRouter, UploadFile, File, BackgroundTasks
import os
import shutil

from services.ingestion_service import get_ingestion_service

router = APIRouter()

DOCS_FOLDER = "./docs"


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


async def run_ingestion(file_path: str, filename: str):
    """Background task that ingests the document into the vector DB."""
    try:
        ingestion_service = get_ingestion_service()
        result = await ingestion_service.ingest_document(file_path)
        print(f"[Ingestion] {filename}: {result}")
    except Exception as e:
        print(f"[Ingestion Error] {filename}: {e}")
