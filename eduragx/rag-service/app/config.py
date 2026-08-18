from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url:       str   = ""
    chroma_persist_dir: str   = "./chroma_data"
    rag_service_port:   int   = 8000
    node_backend_url:   str   = "http://localhost:5000"
    embedding_model:    str   = "nomic-embed-text"
    llm_model:          str   = "llama3.2:1b"
    chunk_size:         int   = 1000
    chunk_overlap:      int   = 200
    temperature:        float = 0.1
    retrieval_top_k:    int   = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
