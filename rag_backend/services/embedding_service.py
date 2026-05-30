# services/embedding_service.py
from google import genai
from google.genai import types
from functools import lru_cache

class EmbeddingService:
    def __init__(self):
        self.ai_client = genai.Client()
        self.model_name = "gemini-embedding-2"
        self.dimensions = 512

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Used by the IngestService for chunked documents"""
        contents = [types.Content(parts=[types.Part(text=t)]) for t in texts]
        response = self.ai_client.models.embed_content(
            model=self.model_name,
            contents=contents,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT", output_dimensionality=self.dimensions)
        )
        return [e.values for e in response.embeddings]

    def embed_query(self, query: str) -> list[float]:
        """Used later by your Retrieval Agent/Query API"""
        response = self.ai_client.models.embed_content(
            model=self.model_name,
            contents=query,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY", output_dimensionality=self.dimensions)
        )
        return response.embeddings[0].values

@lru_cache()
def get_embedding_service() -> EmbeddingService:
    return EmbeddingService()
