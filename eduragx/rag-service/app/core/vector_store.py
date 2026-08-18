import chromadb
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from typing import List, Optional
import os, logging
from app.config import get_settings

logger   = logging.getLogger(__name__)
settings = get_settings()

class VectorStoreManager:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized: return
        self._initialized = True
        self.embeddings = OllamaEmbeddings(model=settings.embedding_model, base_url="http://localhost:11434")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size, chunk_overlap=settings.chunk_overlap,
            separators=["\n\n","\n",". "," ",""])
        os.makedirs(settings.chroma_persist_dir, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        self.vector_store  = Chroma(client=self.chroma_client, collection_name="eduragx_knowledge", embedding_function=self.embeddings)
        logger.info("Vector store initialized")

    def add_documents(self, documents: List[Document]) -> List[str]:
        splits = self.text_splitter.split_documents(documents)
        ids    = self.vector_store.add_documents(splits)
        logger.info(f"Added {len(splits)} chunks"); return ids

    def add_text(self, text: str, metadata: Optional[dict]=None) -> List[str]:
        return self.add_documents([Document(page_content=text, metadata=metadata or {})])

    def similarity_search(self, query: str, k: int=None, filter_dict: Optional[dict]=None) -> List[Document]:
        k = k or settings.retrieval_top_k
        return self.vector_store.similarity_search(query, k=k, filter=filter_dict)

    def get_document_count(self) -> int:
        try: return self.chroma_client.get_collection("eduragx_knowledge").count()
        except: return 0

def get_vector_store() -> VectorStoreManager:
    return VectorStoreManager()
