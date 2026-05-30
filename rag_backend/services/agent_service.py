from dataclasses import dataclass, field
from typing import AsyncIterator
from pydantic_ai import Agent, RunContext
import chromadb
from services.embedding_service import EmbeddingService, get_embedding_service
from dotenv import load_dotenv

load_dotenv()


@dataclass
class RagDependencies:
    db_client: chromadb.PersistentClient
    embedding_service: EmbeddingService
    retrieved_metadata: list = field(default_factory=list)


rag_agent = Agent(
    model="google:gemini-2.5-flash",
    deps_type=RagDependencies,
    system_prompt=(
        "You are a helpful expert assistant. "
        "You answer questions based on the provided documents. Explicitly state from which document and chunk the information is being taken from."
        "Always use the 'search_documents' tool to find relevant context before answering. "
        "If you cannot find the answer in the context, explicitly state that you do not know. "
        "Keep your answers concise and accurate."
        "If you cant find the answer you can let the user know that you dont know about it from the documents and need to search web."
    ),
)

@rag_agent.tool
def search_documents(ctx: RunContext[RagDependencies], query: str) -> str:
    """Search the vector database for documents related to the query."""
    
    print(f"Agent is searching ChromaDB for: '{query}'")
    
    query_vector = ctx.deps.embedding_service.embed_query(query)
    
    collection = ctx.deps.db_client.get_or_create_collection("knowledge_base")
    
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=5,
        include=['documents', 'metadatas']
    )
    
    if not results['documents'] or not results['documents'][0]:
        return "No relevant documents found in the database."
        
    ctx.deps.retrieved_metadata.extend(results['metadatas'][0])

    formatted_output = []
    for doc, meta in zip(results['documents'][0], results['metadatas'][0]):
        formatted_output.append(f"Source: {meta['source']}\nChunk: {meta['chunk_number']}\nText: {doc}\n")
    return "\n\n------\n\n".join(formatted_output)


class AgentService:
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
        self.db_client = chromadb.PersistentClient(path="./chromadb")

    async def query(self, user_prompt: str, message_history: list = None):
        """Method to run the agent with the user's prompt."""
        
        deps = RagDependencies(
            db_client=self.db_client,
            embedding_service=self.embedding_service,
        )
        
        result = await rag_agent.run(
            user_prompt, 
            deps=deps,
            message_history=message_history or []
        )
        
        return {
            "answer": result.data,
            "messages": result.all_messages()
        }

    async def stream_query(self, user_prompt: str, message_history: list = None) -> AsyncIterator[str]:
        """Stream the agent's response token-by-token using run_stream."""
        
        deps = RagDependencies(
            db_client=self.db_client,
            embedding_service=self.embedding_service,
        )
        
        async with rag_agent.run_stream(
            user_prompt,
            deps=deps,
            message_history=message_history or []
        ) as result:
            async for chunk in result.stream_text(delta=True):
                yield chunk
            yield {"sources": deps.retrieved_metadata}

_agent_service_instance: AgentService | None = None

def get_agent_service() -> AgentService:
    """Singleton factory for AgentService."""
    global _agent_service_instance
    if _agent_service_instance is None:
        _agent_service_instance = AgentService(get_embedding_service())
    return _agent_service_instance
