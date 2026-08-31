"""
EduRAGX Vector Store Manager
Enhanced semantic retrieval with ChromaDB + Ollama embeddings.
"""

from __future__ import annotations

import logging
import os
from typing import List, Optional, Tuple

import chromadb
import numpy as np
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings

from app.config import get_settings


logger = logging.getLogger(__name__)

settings = get_settings()


class VectorStoreManager:
    """
    Singleton manager for the EduRAGX ChromaDB vector store.
    """

    _instance = None

    COLLECTION_NAME = "eduragx_knowledge"

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False

        return cls._instance

    def __init__(self):

        if self._initialized:
            return

        self._initialized = True

        logger.info("Initializing VectorStoreManager...")

        # ─────────────────────────────────────────────────────────────────
        # Embeddings
        # ─────────────────────────────────────────────────────────────────

        self.embeddings = OllamaEmbeddings(
            model=settings.embedding_model,
            base_url=settings.ollama_base_url,
        )

        # ─────────────────────────────────────────────────────────────────
        # Text splitter
        # ─────────────────────────────────────────────────────────────────

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=[
                "\n\n# ",
                "\n\n## ",
                "\n\n### ",
                "\n\n",
                "\n",
                ". ",
                ": ",
                "; ",
                ", ",
                " ",
                "",
            ],
            length_function=len,
            is_separator_regex=False,
        )

        # ─────────────────────────────────────────────────────────────────
        # Chroma persistence
        # ─────────────────────────────────────────────────────────────────

        os.makedirs(
            settings.chroma_persist_dir,
            exist_ok=True,
        )

        self.chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir
        )

        # ─────────────────────────────────────────────────────────────────
        # Vector store
        # ─────────────────────────────────────────────────────────────────

        self.vector_store = Chroma(
            client=self.chroma_client,
            collection_name=self.COLLECTION_NAME,
            embedding_function=self.embeddings,
            collection_metadata={
                "hnsw:space": "cosine",
                "hnsw:construction_ef": 200,
                "hnsw:M": 64,
            },
        )

        logger.info(
            "Vector store initialized: %s",
            self.COLLECTION_NAME,
        )

    # ═════════════════════════════════════════════════════════════════════
    # INSERT DOCUMENTS
    # ═════════════════════════════════════════════════════════════════════

    def add_documents(
        self,
        documents: List[Document],
    ) -> List[str]:

        if not documents:
            logger.warning("No documents supplied for insertion.")
            return []

        splits = self.text_splitter.split_documents(documents)

        for index, split in enumerate(splits):

            original_metadata = dict(split.metadata or {})

            split.metadata = {
                **original_metadata,
                "chunk_index": index,
                "chunk_size": len(split.page_content),
                "word_count": len(split.page_content.split()),
            }

        ids = self.vector_store.add_documents(splits)

        logger.info(
            "Added %d chunks from %d source documents.",
            len(splits),
            len(documents),
        )

        return ids

    # ═════════════════════════════════════════════════════════════════════
    # BASIC SEMANTIC SEARCH
    # ═════════════════════════════════════════════════════════════════════

    def similarity_search(
        self,
        query: str,
        k: Optional[int] = None,
        filter_dict: Optional[dict] = None,
        score_threshold: Optional[float] = None,
    ) -> List[Document]:

        k = k or settings.retrieval_final_k

        if score_threshold is None:
            score_threshold = settings.retrieval_score_threshold

        try:

            results = self.vector_store.similarity_search_with_score(
                query,
                k=max(k * 2, k),
                filter=filter_dict,
            )

        except Exception as exc:

            logger.exception(
                "Similarity search failed: %s",
                exc,
            )

            return []

        # Chroma returns cosine DISTANCE.
        # Smaller distance = better result.
        filtered = [
            (doc, float(score))
            for doc, score in results
            if float(score) <= score_threshold
        ]

        filtered.sort(key=lambda item: item[1])

        return [
            doc
            for doc, _ in filtered[:k]
        ]

    # ═════════════════════════════════════════════════════════════════════
    # SEARCH WITH SCORES
    # ═════════════════════════════════════════════════════════════════════

    def similarity_search_with_scores(
        self,
        query: str,
        k: Optional[int] = None,
        filter_dict: Optional[dict] = None,
    ) -> List[Tuple[Document, float]]:

        k = k or settings.retrieval_top_k

        try:

            results = self.vector_store.similarity_search_with_score(
                query,
                k=k,
                filter=filter_dict,
            )

            return [
                (doc, float(score))
                for doc, score in results
            ]

        except Exception as exc:

            logger.exception(
                "Similarity search with scores failed: %s",
                exc,
            )

            return []

    # ═════════════════════════════════════════════════════════════════════
    # MMR
    # ═════════════════════════════════════════════════════════════════════

    def _mmr_selection(
        self,
        query: str,
        documents: List[Tuple[Document, float]],
        k: int,
        lambda_mult: float = 0.65,
    ) -> List[Document]:

        if not documents:
            return []

        if len(documents) <= k:
            return [doc for doc, _ in documents]

        try:

            texts = [
                doc.page_content
                for doc, _ in documents
            ]

            doc_embeddings = self.embeddings.embed_documents(
                texts
            )

            query_embedding = self.embeddings.embed_query(
                query
            )

            query_vec = np.asarray(
                query_embedding,
                dtype=np.float32,
            )

            doc_vecs = np.asarray(
                doc_embeddings,
                dtype=np.float32,
            )

            query_norm = np.linalg.norm(query_vec)

            if query_norm == 0:
                return [
                    doc
                    for doc, _ in documents[:k]
                ]

            query_vec = query_vec / query_norm

            doc_norms = np.linalg.norm(
                doc_vecs,
                axis=1,
                keepdims=True,
            )

            doc_norms[doc_norms == 0] = 1

            doc_vecs = doc_vecs / doc_norms

            relevance_scores = np.dot(
                doc_vecs,
                query_vec,
            )

            selected_indices: List[int] = []

            target_k = min(
                k,
                len(documents),
            )

            while len(selected_indices) < target_k:

                best_index = None
                best_score = -float("inf")

                for i in range(len(documents)):

                    if i in selected_indices:
                        continue

                    relevance = float(
                        relevance_scores[i]
                    )

                    if selected_indices:

                        similarities = [
                            float(
                                np.dot(
                                    doc_vecs[i],
                                    doc_vecs[j],
                                )
                            )
                            for j in selected_indices
                        ]

                        diversity_penalty = max(
                            similarities
                        )

                    else:

                        diversity_penalty = 0.0

                    mmr_score = (
                        lambda_mult * relevance
                        - (
                            1.0 - lambda_mult
                        ) * diversity_penalty
                    )

                    if mmr_score > best_score:

                        best_score = mmr_score
                        best_index = i

                if best_index is None:
                    break

                selected_indices.append(
                    best_index
                )

            return [
                documents[index][0]
                for index in selected_indices
            ]

        except Exception as exc:

            logger.warning(
                "MMR calculation failed. "
                "Using similarity results: %s",
                exc,
            )

            return [
                doc
                for doc, _ in documents[:k]
            ]

    # ═════════════════════════════════════════════════════════════════════
    # MMR SEARCH
    # ═════════════════════════════════════════════════════════════════════

    def mmr_search(
        self,
        query: str,
        k: Optional[int] = None,
        filter_dict: Optional[dict] = None,
        lambda_mult: Optional[float] = None,
    ) -> List[Document]:

        k = k or settings.retrieval_final_k

        lambda_mult = (
            settings.mmr_lambda
            if lambda_mult is None
            else lambda_mult
        )

        if not settings.use_mmr:
            return self.similarity_search(
                query,
                k=k,
                filter_dict=filter_dict,
            )

        candidate_k = max(
            k * 3,
            settings.retrieval_top_k,
        )

        candidates = self.similarity_search_with_scores(
            query,
            k=candidate_k,
            filter_dict=filter_dict,
        )

        if not candidates:
            return []

        return self._mmr_selection(
            query=query,
            documents=candidates,
            k=k,
            lambda_mult=lambda_mult,
        )

    # ═════════════════════════════════════════════════════════════════════
    # ENHANCED RETRIEVAL
    # ═════════════════════════════════════════════════════════════════════

    def enhanced_retrieval(
        self,
        query: str,
        k: Optional[int] = None,
        filter_dict: Optional[dict] = None,
        use_mmr: bool = True,
    ) -> List[Document]:

        k = k or settings.retrieval_final_k

        if use_mmr and settings.use_mmr:

            results = self.mmr_search(
                query,
                k=k,
                filter_dict=filter_dict,
            )

            if results:
                return results

        return self.similarity_search(
            query,
            k=k,
            filter_dict=filter_dict,
        )

    # ═════════════════════════════════════════════════════════════════════
    # CATEGORY SEARCH
    # ═════════════════════════════════════════════════════════════════════

    def search_by_category(
        self,
        query: str,
        category: str,
        k: Optional[int] = None,
    ) -> List[Document]:

        """
        Category search is intentionally kept as an explicit method.

        IMPORTANT:
        Evaluation should NOT automatically use this method for every
        question because some evaluation questions are cross-document.
        """

        k = k or settings.retrieval_final_k

        filter_dict = {
            "category": category
        }

        return self.enhanced_retrieval(
            query=query,
            k=k,
            filter_dict=filter_dict,
        )

    # ═════════════════════════════════════════════════════════════════════
    # DOCUMENT COUNT
    # ═════════════════════════════════════════════════════════════════════

    def get_document_count(self) -> int:

        try:

            collection = self.chroma_client.get_collection(
                self.COLLECTION_NAME
            )

            return collection.count()

        except Exception as exc:

            logger.warning(
                "Could not get collection count: %s",
                exc,
            )

            return 0

    # ═════════════════════════════════════════════════════════════════════
    # DELETE COLLECTION
    # ═════════════════════════════════════════════════════════════════════

    def delete_collection(self) -> None:

        try:

            self.chroma_client.delete_collection(
                self.COLLECTION_NAME
            )

            logger.info(
                "Deleted Chroma collection: %s",
                self.COLLECTION_NAME,
            )

        except Exception as exc:

            logger.warning(
                "Could not delete collection: %s",
                exc,
            )

        # Recreate the vector store object.
        self.vector_store = Chroma(
            client=self.chroma_client,
            collection_name=self.COLLECTION_NAME,
            embedding_function=self.embeddings,
            collection_metadata={
                "hnsw:space": "cosine",
                "hnsw:construction_ef": 200,
                "hnsw:M": 64,
            },
        )

    # ═════════════════════════════════════════════════════════════════════
    # REBUILD
    # ═════════════════════════════════════════════════════════════════════

    def rebuild(
        self,
        documents: List[Document],
    ) -> int:

        logger.info(
            "Rebuilding EduRAGX knowledge base..."
        )

        self.delete_collection()

        ids = self.add_documents(
            documents
        )

        logger.info(
            "Knowledge base rebuild complete. "
            "Stored chunks: %d",
            len(ids),
        )

        return len(ids)


def get_vector_store() -> VectorStoreManager:
    return VectorStoreManager()