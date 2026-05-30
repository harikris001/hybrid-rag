from docling.datamodel.base_models import InputFormat
from functools import lru_cache
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter, PdfFormatOption

import chromadb
import os
import uuid

from services.embedding_service import EmbeddingService, get_embedding_service


COLLECTION_NAME = "knowledge_base"


class IngestionService:
    def __init__(self, embedding_service: EmbeddingService):
        self.pipeline_options = PdfPipelineOptions()
        self.pipeline_options.do_table_structure = True
        self.pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE

        self.embedding_service = embedding_service

        self.converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=self.pipeline_options)
            }
        )

        self.chunker = HybridChunker(max_tokens=512)

        self.db_client = chromadb.PersistentClient(path="./chromadb")

    async def ingest_document(self, file_path: str) -> dict:
        """
        Ingest a single document: convert → chunk → embed → store in ChromaDB.
        Uses UUID-based chunk IDs to avoid collisions across multiple uploads.
        """
        filename = os.path.basename(file_path)
        collection = self.db_client.get_or_create_collection(name=COLLECTION_NAME)

        # Check if this file has already been ingested
        existing = collection.get(where={"source": filename})
        if existing and existing["ids"]:
            return {
                "message": "Document already ingested",
                "filename": filename,
                "existing_chunks": len(existing["ids"]),
            }

        # Convert and chunk the document
        docling_document = self.converter.convert(source=file_path).document
        chunks = self.chunker.chunk(dl_doc=docling_document, max_tokens=512)
        texts = [item.text for item in chunks]

        if not texts:
            return {"message": "No text content found in document", "filename": filename}

        # Generate embeddings
        vectors = self.embedding_service.embed_documents(texts)

        # Use UUIDs for chunk IDs to prevent collisions across documents
        chunk_ids = [f"{filename}_{uuid.uuid4().hex[:12]}" for _ in texts]

        # Store in ChromaDB
        collection.add(
            ids=chunk_ids,
            documents=texts,
            embeddings=vectors,
            metadatas=[
                {"source": filename, "chunk_number": i}
                for i in range(len(texts))
            ],
        )

        return {
            "message": "Success",
            "filename": filename,
            "chunks_ingested": len(texts),
        }


@lru_cache()
def get_ingestion_service() -> IngestionService:
    """Singleton factory — creates IngestionService with its own EmbeddingService."""
    return IngestionService(get_embedding_service())