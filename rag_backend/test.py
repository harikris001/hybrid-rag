from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode
from docling.chunking import HybridChunker
from pydantic_ai import Agent, RunContext
from google import genai
from google.genai import types
from dotenv import load_dotenv
import chromadb


load_dotenv() 

pipeline_options = PdfPipelineOptions()

pipeline_options.do_table_structure = True
pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE

converter = DocumentConverter(
    format_options= {
        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    }
)

docling_doc = converter.convert(source="./docs/Attention-is-all-you-need.pdf").document

chunker = HybridChunker(max_tokens = 512)

client = genai.Client()

chunks = chunker.chunk(dl_doc=docling_doc, max_tokens=512)

dbclient = chromadb.PersistentClient(path = "./chromadb")
collection = dbclient.get_or_create_collection(name = "attention-is-all-you-need")

if collection.count() == 0:
    print("Database, empty. Processing PDF......")
    texts = [item.text for item in chunks]
    contents = [types.Content(parts=[types.Part(text=t)]) for t in texts]
    embeddings_response = client.models.embed_content(
        model="gemini-embedding-2",
        contents=contents,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT", output_dimensionality=512)
    )
    vectors = [e.values for e in embeddings_response.embeddings]

    collection.add(
        ids=[f"chunk_{i}" for i in range(len(texts))],
        documents=texts,
        embeddings=vectors,
        metadatas=[{"source": "Attention-is-all-you-need.pdf", "chunk_number": i} for i in range(len(texts))]
    )
else:
    print("Database not empty. Skipping PDF processing.")



agent = Agent(
    model="google:gemini-3.1-flash-lite",
    system_prompt="You are a helpful assistant that provide concise answers about questions that have been asked about. Never answer questions that are not related to the context provided to you. Answer only for what is asked and required.",
    #capabilities = [WebSearch()]

)

@agent.tool
def search_rag_docs(ctx: RunContext,  query: str) -> str:
    """ Search the documents vector database and return the relevant information."""
    
    query_embedding = client.models.embed_content(
        model="gemini-embedding-2",
        contents=query,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY", output_dimensionality=512)
    ).embeddings[0].values
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=5,
        include=['documents', 'metadatas']
    )

    found_text = "\n\n------\n\n".join(results['documents'][0])
   
    return found_text

chat_history = []

while True:
    query = input("You: ")
    if query == "quit":
        break
    
    response = agent.run_sync(query, message_history = chat_history)
    
    print(f"AI: {response.output}\n")
    chat_history = response.all_messages()