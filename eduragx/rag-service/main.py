from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.api.routes import router
from app.config import get_settings
from app.knowledge_base.loader import initialize_knowledge_base
from app.core.rag_engine import warm_up_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger   = logging.getLogger(__name__)
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("="*55)
    logger.info("  EduRAGX RAG Service starting...")
    logger.info(f"  LLM model       : {settings.llm_model}")
    logger.info(f"  Embedding model : {settings.embedding_model}")
    logger.info(f"  Chroma dir      : {settings.chroma_persist_dir}")
    logger.info("="*55)
    try:
        await initialize_knowledge_base()
        logger.info("✅ Knowledge base ready")
    except Exception as e:
        logger.error(f"⚠ Knowledge base init failed: {e}")
    await warm_up_model(settings.llm_model)
    logger.info("🚀 RAG Service ready — waiting for requests")
    yield
    logger.info("RAG Service shutting down...")

app = FastAPI(title="EduRAGX RAG AI Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:5173",settings.node_backend_url],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(router, prefix="/api/rag", tags=["RAG AI"])

@app.get("/health")
async def health():
    return {"status":"ok","service":"EduRAGX RAG AI Service","llm_model":settings.llm_model,"embedding_model":settings.embedding_model}

@app.get("/")
async def root():
    return {"service":"EduRAGX RAG AI Service","version":"1.0.0","status":"running","docs":"/docs"}
