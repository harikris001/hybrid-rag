# services/embedding_service.py
from google import genai
from google.genai import types
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

import time

class EmbeddingService:
    def __init__(self):
        self.ai_client = genai.Client()
        self.model_name = "gemini-embedding-2"
        self.dimensions = 512

    def embed_documents(self, texts: list[str], batch_size: int = 20) -> list[list[float]]:
        """Used by the IngestService for chunked documents, with batching and rate-limit backoff."""
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            contents = [types.Content(parts=[types.Part(text=t)]) for t in batch]

            max_retries = 5
            for attempt in range(max_retries):
                try:
                    response = self.ai_client.models.embed_content(
                        model=self.model_name,
                        contents=contents,
                        config=types.EmbedContentConfig(
                            task_type="RETRIEVAL_DOCUMENT",
                            output_dimensionality=self.dimensions
                        )
                    )
                    all_embeddings.extend([e.values for e in response.embeddings])
                    break
                except Exception as e:
                    if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                        wait_time = 15 * (attempt + 1)
                        print(f"[EmbeddingService] Rate limit hit (429). Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                    else:
                        raise e
            else:
                raise RuntimeError(f"Failed to embed batch starting at index {i} after {max_retries} retries.")

        return all_embeddings

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
