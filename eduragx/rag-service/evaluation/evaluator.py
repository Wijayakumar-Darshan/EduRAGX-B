"""
EduRAGX RAG Evaluation Engine.

Evaluates:
- Precision@5
- Context Relevance
- Answer Relevance
- Groundedness
- Overall RAG Score

The evaluator intentionally uses GLOBAL semantic retrieval.

Reason:
The evaluation dataset contains cross-document questions.
Therefore a hard category filter would incorrectly hide relevant
documents from the retriever.
"""

from __future__ import annotations

import csv
import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.core.rag_engine import get_rag_engine
from app.core.vector_store import get_vector_store
from evaluation.dataset import EVALUATION_DATASET


logger = logging.getLogger(__name__)

settings = get_settings()


# ═════════════════════════════════════════════════════════════════════════════
# RESULTS
# ═════════════════════════════════════════════════════════════════════════════

RESULTS_DIR = (
    Path(__file__).parent / "results"
)

RESULTS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

JSON_PATH = (
    RESULTS_DIR / "evaluation.json"
)

CSV_PATH = (
    RESULTS_DIR / "evaluation.csv"
)


# ═════════════════════════════════════════════════════════════════════════════
# NORMALIZATION
# ═════════════════════════════════════════════════════════════════════════════

def _normalize(
    text: str,
) -> str:

    text = str(
        text or ""
    ).lower()

    # Normalize common mathematical / formatting variations.
    text = text.replace(
        "maxscore",
        "max score",
    )

    text = text.replace(
        "creditvalue",
        "credit value",
    )

    text = text.replace(
        "credit_earned",
        "credit earned",
    )

    text = text.replace(
        "one-on-one",
        "one on one",
    )

    text = text.replace(
        "bi-weekly",
        "bi weekly",
    )

    text = re.sub(
        r"[^a-z0-9%]+",
        " ",
        text,
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


# ═════════════════════════════════════════════════════════════════════════════
# CONCEPT ALIASES
# ═════════════════════════════════════════════════════════════════════════════

CONCEPT_ALIASES = {

    "score/maxScore": [
        "score max score",
        "score divided by max score",
        "score / maxscore",
        "score maxscore",
    ],

    "creditValue": [
        "credit value",
        "creditvalue",
    ],

    "credit_earned": [
        "credit earned",
        "credit_earned",
    ],

    "daily tutoring": [
        "daily tutoring",
        "individual daily tutoring",
    ],

    "reassessment": [
        "reassessment",
        "reassessment opportunities",
        "additional attempts",
    ],

    "parent notification": [
        "parent notification",
        "parent communication",
    ],

    "weekly progress tracking": [
        "weekly progress tracking",
        "monitor improvement weekly",
        "weekly monitoring",
    ],

    "supplementary materials": [
        "supplementary materials",
        "supplementary learning materials",
        "additional resources",
    ],

    "study buddy": [
        "study buddy",
        "study buddy pairing",
        "pairing",
    ],

    "Business Admin": [
        "business administration",
        "business admin",
    ],

    "75%+": [
        "75%",
        "75% or higher",
        "75 plus",
    ],

    "within 48 hours": [
        "48 hours",
        "within 48 hours",
    ],

    "3 improvement steps": [
        "three clear improvement steps",
        "3 clear improvement steps",
        "three improvement steps",
        "3 improvement steps",
    ],

    "individual tutoring": [
        "individual tutoring",
        "one on one tutoring",
        "individual daily tutoring",
    ],

    "small group": [
        "small group tutoring",
        "small group",
    ],

    "study plan": [
        "individual study plan",
        "study plan",
        "personalised learning roadmap",
    ],

    "extra practice": [
        "extra practice",
        "additional practice",
        "additional learning materials",
    ],

    "HIGH priority": [
        "high priority",
    ],

    "MEDIUM": [
        "medium",
        "medium monitoring",
    ],

    "score below 60%": [
        "score below 60%",
        "below 60%",
    ],

    "Below 50%": [
        "below 50%",
        "less than 50%",
    ],

    "50-70%": [
        "50 70%",
        "50% and 70%",
        "between 50% and 70%",
    ],

    "early warning": [
        "early warning",
        "early warning indicators",
    ],

    "missing submissions": [
        "missing submissions",
        "two or more missing submissions",
    ],

    "declining trend": [
        "declining trend",
        "performance is getting worse",
    ],

    "zero scores": [
        "zero scores",
        "zero score",
    ],

    "Tier 1": [
        "tier 1",
    ],

    "Tier 2": [
        "tier 2",
    ],

    "Tier 3": [
        "tier 3",
    ],
}


def _concept_variants(
    concept: str,
) -> List[str]:

    variants = [
        concept
    ]

    variants.extend(
        CONCEPT_ALIASES.get(
            concept,
            [],
        )
    )

    return [
        _normalize(item)
        for item in variants
        if item
    ]


def _concept_found(
    text: str,
    concept: str,
) -> bool:

    normalized = _normalize(
        text
    )

    variants = _concept_variants(
        concept
    )

    return any(
        variant in normalized
        for variant in variants
    )


# ═════════════════════════════════════════════════════════════════════════════
# DOCUMENT TEXT
# ═════════════════════════════════════════════════════════════════════════════

def _doc_text(
    doc: Any,
) -> str:

    if hasattr(
        doc,
        "page_content",
    ):

        return str(
            doc.page_content
        )

    return str(doc)


# ═════════════════════════════════════════════════════════════════════════════
# PRECISION@K
# ═════════════════════════════════════════════════════════════════════════════

def calculate_precision_at_k(
    retrieved_docs: List[Any],
    expected_concepts: List[str],
    k: int = 5,
) -> float:

    if not retrieved_docs:
        return 0.0

    top_k = retrieved_docs[
        :k
    ]

    relevant = 0

    for doc in top_k:

        content = _doc_text(
            doc
        )

        if any(
            _concept_found(
                content,
                concept,
            )
            for concept in expected_concepts
        ):

            relevant += 1

    # Standard Precision@K denominator is K.
    return round(
        relevant / k,
        4,
    )


# ═════════════════════════════════════════════════════════════════════════════
# CONCEPT COVERAGE
# ═════════════════════════════════════════════════════════════════════════════

def calculate_concept_coverage(
    retrieved_docs: List[Any],
    expected_concepts: List[str],
) -> float:

    if not expected_concepts:
        return 1.0

    context = " ".join(
        _doc_text(doc)
        for doc in retrieved_docs
    )

    hits = sum(
        1
        for concept in expected_concepts
        if _concept_found(
            context,
            concept,
        )
    )

    return round(
        hits / len(expected_concepts),
        4,
    )


# ═════════════════════════════════════════════════════════════════════════════
# CONTEXT RELEVANCE
# ═════════════════════════════════════════════════════════════════════════════

def calculate_context_relevance(
    question: str,
    retrieved_docs: List[Any],
    expected_concepts: List[str],
) -> float:

    if not retrieved_docs:
        return 0.0

    # Relevance of each retrieved document.
    relevant_documents = 0

    for doc in retrieved_docs:

        content = _doc_text(
            doc
        )

        concept_hits = sum(
            1
            for concept in expected_concepts
            if _concept_found(
                content,
                concept,
            )
        )

        # A document is considered relevant when
        # it contains at least one expected concept.
        if concept_hits > 0:

            relevant_documents += 1

    document_relevance = (
        relevant_documents
        / len(retrieved_docs)
    )

    concept_coverage = (
        calculate_concept_coverage(
            retrieved_docs,
            expected_concepts,
        )
    )

    # Balanced context score.
    score = (
        0.60 * document_relevance
        + 0.40 * concept_coverage
    )

    return round(
        score,
        4,
    )


# ═════════════════════════════════════════════════════════════════════════════
# ANSWER RELEVANCE
# ═════════════════════════════════════════════════════════════════════════════

def calculate_answer_relevance(
    question: str,
    answer: str,
    expected_concepts: List[str],
) -> float:

    if not answer.strip():
        return 0.0

    concept_hits = sum(
        1
        for concept in expected_concepts
        if _concept_found(
            answer,
            concept,
        )
    )

    concept_score = (
        concept_hits
        / max(
            len(expected_concepts),
            1,
        )
    )

    question_terms = {
        term
        for term in _normalize(
            question
        ).split()
        if len(term) > 3
    }

    answer_terms = set(
        _normalize(
            answer
        ).split()
    )

    overlap = (
        len(
            question_terms
            & answer_terms
        )
        / max(
            len(question_terms),
            1,
        )
    )

    # Do not reward verbosity too heavily.
    answer_length = len(
        answer.split()
    )

    if answer_length >= 20:
        length_score = 1.0

    elif answer_length >= 10:
        length_score = 0.75

    elif answer_length >= 5:
        length_score = 0.5

    else:
        length_score = 0.25

    score = (
        0.55 * concept_score
        + 0.30 * overlap
        + 0.15 * length_score
    )

    return round(
        min(
            score,
            1.0,
        ),
        4,
    )


# ═════════════════════════════════════════════════════════════════════════════
# GROUNDEDNESS
# ═════════════════════════════════════════════════════════════════════════════

def calculate_groundedness(
    answer: str,
    retrieved_docs: List[Any],
) -> float:

    if (
        not answer.strip()
        or not retrieved_docs
    ):
        return 0.0

    context = " ".join(
        _doc_text(doc)
        for doc in retrieved_docs
    )

    context_norm = _normalize(
        context
    )

    sentences = re.split(
        r"[.!?]+",
        answer,
    )

    sentences = [
        sentence.strip()
        for sentence in sentences
        if len(
            sentence.strip().split()
        ) >= 5
    ]

    if not sentences:
        return 0.5

    grounded_count = 0

    for sentence in sentences:

        words = [
            word
            for word in _normalize(
                sentence
            ).split()
            if len(word) > 3
        ]

        if not words:
            continue

        hits = sum(
            1
            for word in words
            if word in context_norm
        )

        ratio = (
            hits
            / len(words)
        )

        if ratio >= 0.40:
            grounded_count += 1

    return round(
        grounded_count
        / len(sentences),
        4,
    )


# ═════════════════════════════════════════════════════════════════════════════
# LLM JUDGE
# ═════════════════════════════════════════════════════════════════════════════

JUDGE_SYSTEM = """
You are an expert evaluator of a Retrieval-Augmented Generation system.

Evaluate:

QUESTION
RETRIEVED CONTEXT
GENERATED ANSWER

Return ONLY valid JSON.

{
  "context_relevance": 0.0,
  "answer_relevance": 0.0,
  "groundedness": 0.0
}

Scoring:

context_relevance:
How useful and relevant is the retrieved context for answering the question?

answer_relevance:
How directly and completely does the answer answer the question?

groundedness:
How strongly is the answer supported by the retrieved context?
Penalize unsupported claims and hallucinations.

Scores must be between 0.0 and 1.0.
"""


async def llm_judge(
    question: str,
    context: str,
    answer: str,
) -> Dict[str, float]:

    try:

        engine = get_rag_engine()

        user_prompt = (
            f"QUESTION:\n{question}\n\n"
            f"RETRIEVED CONTEXT:\n{context[:6000]}\n\n"
            f"GENERATED ANSWER:\n{answer[:3000]}"
        )

        raw = await engine._call_llm(
            JUDGE_SYSTEM,
            user_prompt,
        )

        data = json.loads(
            raw.strip()
        )

        result = {
            "context_relevance": float(
                data.get(
                    "context_relevance",
                    0.5,
                )
            ),
            "answer_relevance": float(
                data.get(
                    "answer_relevance",
                    0.5,
                )
            ),
            "groundedness": float(
                data.get(
                    "groundedness",
                    0.5,
                )
            ),
        }

        return {
            key: max(
                0.0,
                min(
                    1.0,
                    value,
                ),
            )
            for key, value
            in result.items()
        }

    except Exception as exc:

        logger.warning(
            "LLM judge failed: %s",
            exc,
        )

        return {}


# ═════════════════════════════════════════════════════════════════════════════
# SINGLE QUESTION
# ═════════════════════════════════════════════════════════════════════════════

async def evaluate_single(
    item: Dict[str, Any],
    use_llm_judge: bool = True,
    k: int = 5,
) -> Dict[str, Any]:

    question = item[
        "question"
    ]

    expected = item.get(
        "expected_concepts",
        [],
    )

    qid = item[
        "id"
    ]

    category = item.get(
        "category",
        "",
    )

    logger.info(
        "Evaluating %s: %s",
        qid,
        question,
    )

    # ═════════════════════════════════════════════════════════════════════
    # IMPORTANT:
    #
    # DO NOT hard-filter by category here.
    #
    # The evaluation dataset contains cross-document questions.
    # ═════════════════════════════════════════════════════════════════════

    vs = get_vector_store()

    retrieved_docs = (
        vs.enhanced_retrieval(
            question,
            k=k,
            use_mmr=False,
        )
    )

    # If retrieval returns fewer than k documents,
    # keep whatever semantic results are available.
    #
    # We intentionally do NOT perform a category-filtered search.

    context_parts = [
        _doc_text(doc)
        for doc in retrieved_docs
    ]

    context = (
        "\n\n---\n\n".join(
            context_parts
        )
    )

    # ═════════════════════════════════════════════════════════════════════
    # GENERATION
    # ═════════════════════════════════════════════════════════════════════

    system_prompt = """
You are an educational assistant for EduRAGX.

Answer the user's question using ONLY the provided knowledge context.

Rules:

1. Do not invent information.
2. Do not use external knowledge.
3. If the context is insufficient, clearly say that.
4. Preserve exact numbers, percentages and names.
5. Answer directly.
6. Use bullet points when useful.
"""

    user_prompt = (
        f"KNOWLEDGE CONTEXT:\n"
        f"{context}\n\n"
        f"QUESTION:\n"
        f"{question}\n\n"
        f"ANSWER:"
    )

    engine = get_rag_engine()

    try:

        answer = await engine._call_llm(
            system_prompt,
            user_prompt,
        )

    except Exception as exc:

        logger.error(
            "Generation failed for %s: %s",
            qid,
            exc,
        )

        answer = (
            f"[Generation error: {exc}]"
        )

    # ═════════════════════════════════════════════════════════════════════
    # METRICS
    # ═════════════════════════════════════════════════════════════════════

    precision = (
        calculate_precision_at_k(
            retrieved_docs,
            expected,
            k=k,
        )
    )

    context_relevance = (
        calculate_context_relevance(
            question,
            retrieved_docs,
            expected,
        )
    )

    answer_relevance = (
        calculate_answer_relevance(
            question,
            answer,
            expected,
        )
    )

    groundedness = (
        calculate_groundedness(
            answer,
            retrieved_docs,
        )
    )

    # ═════════════════════════════════════════════════════════════════════
    # LLM JUDGE
    # ═════════════════════════════════════════════════════════════════════

    if use_llm_judge:

        judge_scores = await llm_judge(
            question,
            context,
            answer,
        )

        if judge_scores:

            context_relevance = (
                judge_scores[
                    "context_relevance"
                ]
            )

            answer_relevance = (
                judge_scores[
                    "answer_relevance"
                ]
            )

            groundedness = (
                judge_scores[
                    "groundedness"
                ]
            )

    # ═════════════════════════════════════════════════════════════════════
    # OVERALL
    # ═════════════════════════════════════════════════════════════════════

    overall = (
        precision
        + context_relevance
        + answer_relevance
        + groundedness
    ) / 4.0

    # ═════════════════════════════════════════════════════════════════════
    # RETURN
    # ═════════════════════════════════════════════════════════════════════

    return {
        "id": qid,
        "question": question,
        "category": category,
        "num_retrieved": len(
            retrieved_docs
        ),
        "precision_at_5": round(
            precision,
            4,
        ),
        "context_relevance": round(
            context_relevance,
            4,
        ),
        "answer_relevance": round(
            answer_relevance,
            4,
        ),
        "groundedness": round(
            groundedness,
            4,
        ),
        "overall_score": round(
            overall,
            4,
        ),
        "answer_preview": (
            answer[:300]
            + (
                "..."
                if len(answer) > 300
                else ""
            )
        ),
        "retrieved_titles": [
            doc.metadata.get(
                "title",
                "unknown",
            )
            if hasattr(
                doc,
                "metadata",
            )
            else "unknown"
            for doc in retrieved_docs
        ],
    }


# ═════════════════════════════════════════════════════════════════════════════
# FULL EVALUATION
# ═════════════════════════════════════════════════════════════════════════════

async def run_rag_evaluation(
    use_llm_judge: bool = True,
    max_questions: Optional[int] = None,
) -> Dict[str, Any]:

    logger.info(
        "======================================================="
    )

    logger.info(
        "Starting EduRAGX RAG Evaluation"
    )

    dataset = EVALUATION_DATASET

    if max_questions is not None:

        dataset = dataset[
            :max_questions
        ]

    results: List[
        Dict[str, Any]
    ] = []

    for item in dataset:

        try:

            result = await evaluate_single(
                item,
                use_llm_judge=use_llm_judge,
                k=5,
            )

            results.append(
                result
            )

        except Exception as exc:

            logger.exception(
                "Failed on %s: %s",
                item["id"],
                exc,
            )

            results.append(
                {
                    "id": item["id"],
                    "question": item["question"],
                    "category": item.get(
                        "category",
                        "",
                    ),
                    "num_retrieved": 0,
                    "precision_at_5": 0.0,
                    "context_relevance": 0.0,
                    "answer_relevance": 0.0,
                    "groundedness": 0.0,
                    "overall_score": 0.0,
                    "answer_preview": "",
                    "error": str(exc),
                }
            )

    # ═════════════════════════════════════════════════════════════════════
    # AVERAGES
    # ═════════════════════════════════════════════════════════════════════

    def average(
        key: str,
    ) -> float:

        values = [
            result[key]
            for result in results
            if isinstance(
                result.get(key),
                (int, float),
            )
        ]

        if not values:
            return 0.0

        return round(
            sum(values)
            / len(values),
            4,
        )

    summary = {
        "total_questions": len(
            results
        ),
        "precision_at_5": average(
            "precision_at_5"
        ),
        "context_relevance": average(
            "context_relevance"
        ),
        "answer_relevance": average(
            "answer_relevance"
        ),
        "groundedness": average(
            "groundedness"
        ),
        "overall_score": average(
            "overall_score"
        ),
        "timestamp": datetime.now().isoformat(),
        "model": settings.llm_model,
        "embedding_model": settings.embedding_model,
        "retrieval_top_k": settings.retrieval_top_k,
        "retrieval_final_k": settings.retrieval_final_k,
        "chunk_size": settings.chunk_size,
        "chunk_overlap": settings.chunk_overlap,
        "use_mmr": settings.use_mmr,
        "used_llm_judge": use_llm_judge,
        "knowledge_base_version": settings.knowledge_base_version,
        "results": results,
    }

    # ═════════════════════════════════════════════════════════════════════
    # SAVE JSON
    # ═════════════════════════════════════════════════════════════════════

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
            "Evaluation JSON saved: %s",
            JSON_PATH,
        )

    except Exception as exc:

        logger.exception(
            "Failed to save evaluation JSON: %s",
            exc,
        )

    # ═════════════════════════════════════════════════════════════════════
    # SAVE CSV
    # ═════════════════════════════════════════════════════════════════════

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

                writer.writerow(
                    result
                )

        logger.info(
            "Evaluation CSV saved: %s",
            CSV_PATH,
        )

    except Exception as exc:

        logger.exception(
            "Failed to save evaluation CSV: %s",
            exc,
        )

    # ═════════════════════════════════════════════════════════════════════
    # LOG SUMMARY
    # ═════════════════════════════════════════════════════════════════════

    logger.info(
        "======================================================="
    )

    logger.info(
        "Evaluation complete."
    )

    logger.info(
        "Precision@5       : %.2f%%",
        summary["precision_at_5"] * 100,
    )

    logger.info(
        "Context Relevance : %.2f%%",
        summary["context_relevance"] * 100,
    )

    logger.info(
        "Answer Relevance  : %.2f%%",
        summary["answer_relevance"] * 100,
    )

    logger.info(
        "Groundedness      : %.2f%%",
        summary["groundedness"] * 100,
    )

    logger.info(
        "Overall RAG Score : %.2f%%",
        summary["overall_score"] * 100,
    )

    logger.info(
        "======================================================="
    )

    summary["files"] = {
        "json": str(
            JSON_PATH
        ),
        "csv": str(
            CSV_PATH
        ),
    }

    return summary