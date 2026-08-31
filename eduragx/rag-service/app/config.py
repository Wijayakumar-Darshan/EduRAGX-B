from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ─────────────────────────────────────────────────────────────────────
    # Application
    # ─────────────────────────────────────────────────────────────────────

    database_url: str = ""

    chroma_persist_dir: str = "./chroma_data"

    rag_service_port: int = 8000

    node_backend_url: str = "http://localhost:5000"

    # ─────────────────────────────────────────────────────────────────────
    # AI Models
    # ─────────────────────────────────────────────────────────────────────

    embedding_model: str = "nomic-embed-text"

    # Your current project should use the model actually installed in Ollama.
    # Change this to llama3.2:1b if that is the model you currently have.
    llm_model: str = "llama3.2:3b"

    # ─────────────────────────────────────────────────────────────────────
    # Ollama
    # ─────────────────────────────────────────────────────────────────────

    ollama_base_url: str = "http://localhost:11434"

    # ─────────────────────────────────────────────────────────────────────
    # RAG Configuration
    # ─────────────────────────────────────────────────────────────────────

    chunk_size: int = 700

    chunk_overlap: int = 100

    retrieval_top_k: int = 8

    retrieval_final_k: int = 5

    # Chroma cosine distance:
    # lower = better
    #
    # 0.0 = identical
    # 1.0 = relatively weak
    # >1.0 = very weak
    retrieval_score_threshold: float = 1.20

    # ─────────────────────────────────────────────────────────────────────
    # MMR
    # ─────────────────────────────────────────────────────────────────────

    use_mmr: bool = False

    mmr_lambda: float = 0.65

    # ─────────────────────────────────────────────────────────────────────
    # Generation
    # ─────────────────────────────────────────────────────────────────────

    temperature: float = 0.1

    num_predict: int = 600

    num_ctx: int = 4096

    llm_timeout: int = 600

    # ─────────────────────────────────────────────────────────────────────
    # Knowledge Base
    # ─────────────────────────────────────────────────────────────────────

    knowledge_base_version: str = "4.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()