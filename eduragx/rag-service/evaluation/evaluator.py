"""
RAG Evaluation Engine for EduRAGX.

Reuses the existing VectorStoreManager and RAGEngine so that evaluation
measures the actual production pipeline, not a separate implementation.

Evaluation results are always stored in the same two files:
    evaluation/results/evaluation.json
    evaluation/results/evaluation.csv

These files are updated on every evaluation run. No timestamped files
are generated.
"""

from __future__ import annotations

import csv
import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.vector_store import get_vector_store
from app.core.rag_engine import get_rag_engine
from app.config import get_settings
from evaluation.dataset import EVALUATION_DATASET


logger = logging.getLogger(__name__)
settings = get_settings()


# ─────────────────────────────────────────────────────────────────────────────
# Results directory
# ─────────────────────────────────────────────────────────────────────────────

RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


# Fixed result files.
# These files are updated every time the evaluation runs.
JSON_PATH = RESULTS_DIR / "evaluation.json"
CSV_PATH = RESULTS_DIR / "evaluation.csv"


# ─────────────────────────────────────────────────────────────────────────────
# Metric helpers
# ─────────────────────────────────────────────────────────────────────────────

def _normalize(text: str) -> str:
    """
    Lowercase text and collapse whitespace.
    """
    return re.sub(r"\s+", " ", text.lower().strip())


def calculate_precision_at_k(
    retrieved_docs: List[Any],
    expected_concepts: List[str],
    k: int = 5,
) -> float:
    """
    Precision@k using concept overlap.

    A retrieved chunk is considered relevant if it contains at least
    one of the expected concepts using case-insensitive substring matching.
    """

    if not retrieved_docs:
        return 0.0

    top_k = retrieved_docs[:k]

    relevant = 0

    for doc in top_k:
        content = _normalize(
            doc.page_content
            if hasattr(doc, "page_content")
            else str(doc)
        )

        if any(
            _normalize(concept) in content
            for concept in expected_concepts
        ):
            relevant += 1

    # Divide by k to keep Precision@k consistent.
    return relevant / k


def calculate_context_relevance(
    question: str,
    retrieved_docs: List[Any],
    expected_concepts: List[str],
) -> float:
    """
    Context relevance is the fraction of retrieved documents
    containing at least one expected concept.

    Range:
        0.0 - 1.0
    """

    if not retrieved_docs:
        return 0.0

    hits = 0

    for doc in retrieved_docs:
        content = _normalize(
            doc.page_content
            if hasattr(doc, "page_content")
            else str(doc)
        )

        if any(
            _normalize(concept) in content
            for concept in expected_concepts
        ):
            hits += 1

    return hits / len(retrieved_docs)


def calculate_answer_relevance(
    question: str,
    answer: str,
    expected_concepts: List[str],
) -> float:
    """
    Simple lexical answer relevance.

    Components:
        - 0.4 weight for expected concept coverage
        - 0.3 weight for question-word overlap
        - 0.3 weight for answer length
    """

    if not answer or not answer.strip():
        return 0.0

    ans_norm = _normalize(answer)
    q_norm = _normalize(question)

    # ── Concept coverage ─────────────────────────────────────────────────────

    concept_hits = sum(
        1
        for concept in expected_concepts
        if _normalize(concept) in ans_norm
    )

    concept_score = concept_hits / max(len(expected_concepts), 1)

    # ── Question term overlap ────────────────────────────────────────────────

    q_terms = {
        term
        for term in q_norm.split()
        if len(term) > 3
    }

    a_terms = set(ans_norm.split())

    overlap = len(q_terms & a_terms) / max(len(q_terms), 1)

    # ── Length heuristic ─────────────────────────────────────────────────────

    length_score = min(
        len(answer.split()) / 40.0,
        1.0,
    )

    return (
        0.4 * concept_score
        + 0.3 * overlap
        + 0.3 * length_score
    )


def calculate_groundedness(
    answer: str,
    retrieved_docs: List[Any],
) -> float:
    """
    Approximate groundedness.

    For every non-trivial sentence in the answer, checks whether
    a substantial portion of its content words appear in the
    retrieved context.
    """

    if not answer or not retrieved_docs:
        return 0.0

    context = " ".join(
        doc.page_content
        if hasattr(doc, "page_content")
        else str(doc)
        for doc in retrieved_docs
    )

    context_norm = _normalize(context)

    # Split answer into sentences.
    sentences = re.split(r"[.!?]+", answer)

    sentences = [
        sentence.strip()
        for sentence in sentences
        if len(sentence.strip().split()) > 4
    ]

    # Very short answers receive a neutral score.
    if not sentences:
        return 0.5

    grounded = 0

    for sentence in sentences:

        words = [
            word
            for word in _normalize(sentence).split()
            if len(word) > 3
        ]

        if not words:
            continue

        # A sentence is considered grounded when at least 40%
        # of its content words appear in the retrieved context.
        hits = sum(
            1
            for word in words
            if word in context_norm
        )

        if hits / len(words) >= 0.4:
            grounded += 1

    return grounded / len(sentences)


# ─────────────────────────────────────────────────────────────────────────────
# LLM-as-judge
# ─────────────────────────────────────────────────────────────────────────────

JUDGE_SYSTEM = """
You are an evaluation judge for a Retrieval-Augmented Generation system.

You will be given:

QUESTION
RETRIEVED CONTEXT
GENERATED ANSWER

Score the following three metrics from 0.0 to 1.0:

1. context_relevance
   How relevant is the retrieved context to the question?

2. answer_relevance
   How well does the answer address the question?

3. groundedness
   How well is the answer supported by the retrieved context?
   Penalize unsupported claims and hallucinations.

Reply with ONLY a valid JSON object.
Do not include markdown.
Do not include explanations.

Example:
{
    "context_relevance": 0.0,
    "answer_relevance": 0.0,
    "groundedness": 0.0
}
"""


async def llm_judge(
    question: str,
    context: str,
    answer: str,
) -> Dict[str, float]:
    """
    Optional higher-quality evaluation using the same Ollama LLM.
    """

    try:

        engine = get_rag_engine()

        user = (
            f"QUESTION:\n{question}\n\n"
            f"RETRIEVED CONTEXT:\n{context[:3000]}\n\n"
            f"GENERATED ANSWER:\n{answer[:2000]}"
        )

        raw = await engine._call_llm(
            JUDGE_SYSTEM,
            user,
        )

        raw = raw.strip()

        # Handle accidental markdown code fences.
        if "```" in raw:

            for part in raw.split("```"):

                part = part.strip()

                if part.startswith("json"):
                    part = part[4:].strip()

                if part.startswith("{"):
                    raw = part
                    break

        data = json.loads(raw)

        return {
            "context_relevance": float(
                data.get("context_relevance", 0.5)
            ),
            "answer_relevance": float(
                data.get("answer_relevance", 0.5)
            ),
            "groundedness": float(
                data.get("groundedness", 0.5)
            ),
        }

    except Exception as e:

        logger.warning(
            f"LLM judge failed, "
            f"falling back to lexical metrics: {e}"
        )

        return {}


# ─────────────────────────────────────────────────────────────────────────────
# Single question evaluation
# ─────────────────────────────────────────────────────────────────────────────

async def evaluate_single(
    item: Dict[str, Any],
    use_llm_judge: bool = False,
    k: int = 5,
) -> Dict[str, Any]:
    """
    Run one evaluation item through the existing RAG pipeline.
    """

    question = item["question"]

    expected = item.get(
        "expected_concepts",
        [],
    )

    qid = item["id"]

    logger.info(
        f"Evaluating {qid}: {question[:60]}…"
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Retrieval
    # ─────────────────────────────────────────────────────────────────────────

    vs = get_vector_store()

    retrieved_docs = vs.similarity_search(
        question,
        k=k,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Build context
    # ─────────────────────────────────────────────────────────────────────────

    context_parts = []

    for doc in retrieved_docs:

        content = (
            doc.page_content
            if hasattr(doc, "page_content")
            else str(doc)
        )

        context_parts.append(
            content[:800]
        )

    context = "\n\n".join(
        context_parts
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Generation
    # ─────────────────────────────────────────────────────────────────────────

    system_prompt = (
        "You are an educational assistant for EduRAGX. "
        "Answer the question using ONLY the provided context. "
        "If the context does not contain enough information, say so. "
        "Be concise and factual."
    )

    user_prompt = (
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        f"Answer:"
    )

    engine = get_rag_engine()

    try:

        answer = await engine._call_llm(
            system_prompt,
            user_prompt,
        )

    except Exception as e:

        logger.error(
            f"Generation failed for {qid}: {e}"
        )

        answer = f"[Generation error: {e}]"

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Calculate metrics
    # ─────────────────────────────────────────────────────────────────────────

    precision = calculate_precision_at_k(
        retrieved_docs,
        expected,
        k=k,
    )

    ctx_rel = calculate_context_relevance(
        question,
        retrieved_docs,
        expected,
    )

    ans_rel = calculate_answer_relevance(
        question,
        answer,
        expected,
    )

    grounded = calculate_groundedness(
        answer,
        retrieved_docs,
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Optional LLM judge
    # ─────────────────────────────────────────────────────────────────────────

    if use_llm_judge:

        judge_scores = await llm_judge(
            question,
            context,
            answer,
        )

        if judge_scores:

            ctx_rel = judge_scores.get(
                "context_relevance",
                ctx_rel,
            )

            ans_rel = judge_scores.get(
                "answer_relevance",
                ans_rel,
            )

            grounded = judge_scores.get(
                "groundedness",
                grounded,
            )

    # ─────────────────────────────────────────────────────────────────────────
    # 6. Overall score
    # ─────────────────────────────────────────────────────────────────────────

    overall = (
        precision
        + ctx_rel
        + ans_rel
        + grounded
    ) / 4.0

    # ─────────────────────────────────────────────────────────────────────────
    # 7. Return result
    # ─────────────────────────────────────────────────────────────────────────

    return {
        "id": qid,
        "question": question,
        "category": item.get("category", ""),
        "num_retrieved": len(retrieved_docs),

        "precision_at_5": round(
            precision,
            4,
        ),

        "context_relevance": round(
            ctx_rel,
            4,
        ),

        "answer_relevance": round(
            ans_rel,
            4,
        ),

        "groundedness": round(
            grounded,
            4,
        ),

        "overall_score": round(
            overall,
            4,
        ),

        "answer_preview": (
            answer[:300]
            + ("…" if len(answer) > 300 else "")
        ),

        "retrieved_titles": [
            (
                doc.metadata.get(
                    "title",
                    "unknown",
                )
                if hasattr(doc, "metadata")
                else "unknown"
            )
            for doc in retrieved_docs
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Full evaluation
# ─────────────────────────────────────────────────────────────────────────────

async def run_rag_evaluation(
    use_llm_judge: bool = False,
    max_questions: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Run the full evaluation suite.

    Results are always written to:

        evaluation/results/evaluation.json
        evaluation/results/evaluation.csv

    Existing files are updated rather than creating new timestamped files.
    """

    logger.info(
        "======================================================="
    )

    logger.info(
        "Starting EduRAGX RAG Evaluation..."
    )

    # ─────────────────────────────────────────────────────────────────────────
    # Load dataset
    # ─────────────────────────────────────────────────────────────────────────

    dataset = EVALUATION_DATASET

    if max_questions is not None:

        dataset = dataset[
            :max_questions
        ]

    results: List[Dict[str, Any]] = []

    # ─────────────────────────────────────────────────────────────────────────
    # Evaluate each question
    # ─────────────────────────────────────────────────────────────────────────

    for item in dataset:

        try:

            result = await evaluate_single(
                item,
                use_llm_judge=use_llm_judge,
            )

            results.append(result)

        except Exception as e:

            logger.exception(
                f"Failed on {item['id']}: {e}"
            )

            results.append({
                "id": item["id"],
                "question": item["question"],
                "category": item.get(
                    "category",
                    "",
                ),
                "num_retrieved": 0,
                "error": str(e),
                "precision_at_5": 0.0,
                "context_relevance": 0.0,
                "answer_relevance": 0.0,
                "groundedness": 0.0,
                "overall_score": 0.0,
                "answer_preview": "",
            })

    # ─────────────────────────────────────────────────────────────────────────
    # Aggregate metrics
    # ─────────────────────────────────────────────────────────────────────────

    n = len(results)

    def avg(key: str) -> float:

        values = [
            result[key]
            for result in results
            if (
                key in result
                and isinstance(
                    result[key],
                    (int, float),
                )
            )
        ]

        if not values:
            return 0.0

        return round(
            sum(values) / len(values),
            4,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Summary
    # ─────────────────────────────────────────────────────────────────────────

    summary = {

        "total_questions": n,

        "precision_at_5": avg(
            "precision_at_5"
        ),

        "context_relevance": avg(
            "context_relevance"
        ),

        "answer_relevance": avg(
            "answer_relevance"
        ),

        "groundedness": avg(
            "groundedness"
        ),

        "overall_score": avg(
            "overall_score"
        ),

        "timestamp": datetime.now().isoformat(),

        "model": settings.llm_model,

        "embedding_model": settings.embedding_model,

        "retrieval_top_k": settings.retrieval_top_k,

        "used_llm_judge": use_llm_judge,

        "results": results,
    }

    # ─────────────────────────────────────────────────────────────────────────
    # Save JSON
    # ─────────────────────────────────────────────────────────────────────────
    #
    # IMPORTANT:
    # No timestamp is used in the filename.
    #
    # Every run updates:
    #
    #     evaluation.json
    #
    # ─────────────────────────────────────────────────────────────────────────

    try:

        with open(
            JSON_PATH,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                summary,
                file,
                indent=2,
                ensure_ascii=False,
            )

        logger.info(
            f"JSON results updated → {JSON_PATH.name}"
        )

    except Exception as e:

        logger.error(
            f"Failed to save JSON results: {e}"
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Save CSV
    # ─────────────────────────────────────────────────────────────────────────
    #
    # IMPORTANT:
    # No timestamp is used in the filename.
    #
    # Every run updates:
    #
    #     evaluation.csv
    #
    # ─────────────────────────────────────────────────────────────────────────

    fieldnames = [
        "id",
        "question",
        "category",
        "precision_at_5",
        "context_relevance",
        "answer_relevance",
        "groundedness",
        "overall_score",
        "num_retrieved",
        "answer_preview",
    ]

    try:

        with open(
            CSV_PATH,
            "w",
            newline="",
            encoding="utf-8",
        ) as file:

            writer = csv.DictWriter(
                file,
                fieldnames=fieldnames,
                extrasaction="ignore",
            )

            writer.writeheader()

            for result in results:

                writer.writerow(result)

        logger.info(
            f"CSV results updated → {CSV_PATH.name}"
        )

    except Exception as e:

        logger.error(
            f"Failed to save CSV results: {e}"
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Final logging
    # ─────────────────────────────────────────────────────────────────────────

    logger.info(
        "======================================================="
    )

    logger.info(
        "Evaluation complete."
    )

    logger.info(
        "Overall RAG Quality Score: "
        f"{summary['overall_score']:.2%}"
    )

    logger.info(
        f"Results saved → "
        f"{JSON_PATH.name} / {CSV_PATH.name}"
    )

    logger.info(
        "======================================================="
    )

    # ─────────────────────────────────────────────────────────────────────────
    # Add file information to returned summary
    # ─────────────────────────────────────────────────────────────────────────

    summary["files"] = {
        "json": str(JSON_PATH),
        "csv": str(CSV_PATH),
    }

    return summary