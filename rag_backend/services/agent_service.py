from dataclasses import dataclass, field
from typing import AsyncIterator
from pydantic_ai import Agent, RunContext
import chromadb
import asyncio
from ddgs import DDGS
from sympy import sympify, simplify
from services.embedding_service import EmbeddingService, get_embedding_service
from dotenv import load_dotenv
load_dotenv()


@dataclass
class RagDependencies:
    db_client: chromadb.PersistentClient
    embedding_service: EmbeddingService
    retrieved_metadata: list = field(default_factory=list)
    event_queue: asyncio.Queue = field(default_factory=asyncio.Queue)


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
async def search_documents(ctx: RunContext[RagDependencies], query: str) -> str:
    """Search the vector database for documents related to the query."""

    # Notifying the quere about the event
    await ctx.deps.event_queue.put({
        "event": "tool_start", "tool": "search_documents",
        "query": query
    })
    
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
    await ctx.deps.event_queue.put({
        "event": "tool_complete", 
        "tool": "search_documents"
    })
    return "\n\n------\n\n".join(formatted_output)

@rag_agent.tool
async def web_search(ctx: RunContext[RagDependencies], query:str) -> str:
    """Search the web for the latest and updated information about a query that might need an updated information"""
    await ctx.deps.event_queue.put({
        "event": "tool_start",
        "tool": "web_search",
        "query": query
    })
    with DDGS() as ddgs:
        results = ddgs.text(query, max_results=5)
        output = "\n\n------\n\n".join([f"Title: {r['title']}\nSnippet: {r['body']}\nLink: {r['href']}" for r in results])
    await ctx.deps.event_queue.put({
        "event": "tool_complete",
        "tool": "web_search"
    })
    return output

@rag_agent.tool
async def solve_math(ctx: RunContext[RagDependencies], expression) -> str:
    """Solves mathematical expressions and returns the simplified result"""
    await ctx.deps.event_queue.put({
        "event": "tool_start",
        "tool": "solve_math",
        "query": str(expression)
    })
    expr = sympify(expression)
    result = simplify(expr)
    output = str(result)
    await ctx.deps.event_queue.put({
        "event": "tool_complete",
        "tool": "solve_math"
    })
    return output

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
            "answer": result.output,
            "messages": result.all_messages()
        }

    async def stream_query(self, user_prompt: str, message_history: list = None) -> AsyncIterator[dict]:
        """Stream the agent's response, tool calls, and metadata as a unified event stream."""
        event_queue = asyncio.Queue()
        deps = RagDependencies(
            db_client=self.db_client,
            embedding_service=self.embedding_service,
            event_queue=event_queue
        )
        
        async def run_agent():
            try:
                async with rag_agent.run_stream(
                    user_prompt,
                    deps=deps,
                    message_history=message_history or []
                ) as result:
                    async for chunk in result.stream_text(delta=True):
                        await event_queue.put({"event": "text", "content": chunk})
                
                # Yield final sources/metadata
                await event_queue.put({"event": "metadata", "sources": deps.retrieved_metadata})
            finally:
                # Sentinel to tell the consumer we are done
                await event_queue.put(None)

        # Start the agent task in the background
        task = asyncio.create_task(run_agent())

        # Yield items from queue as they arrive
        while True:
            item = await event_queue.get()
            if item is None:
                break
            yield item
            
        await task

_agent_service_instance: AgentService | None = None

def get_agent_service() -> AgentService:
    """Singleton factory for AgentService."""
    global _agent_service_instance
    if _agent_service_instance is None:
        _agent_service_instance = AgentService(get_embedding_service())
    return _agent_service_instance
