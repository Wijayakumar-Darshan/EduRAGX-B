"""
EduRAGX Knowledge Base Loader - Enhanced with structured content.
"""

from __future__ import annotations

import logging
from typing import List

from langchain.schema import Document

from app.core.vector_store import get_vector_store
from app.config import get_settings


logger = logging.getLogger(__name__)
settings = get_settings()
KNOWLEDGE_BASE_VERSION = settings.knowledge_base_version

# ─────────────────────────────────────────────────────────────────────────────
# Knowledge Base Version - Increment to rebuild
# ─────────────────────────────────────────────────────────────────────────────

KNOWLEDGE_BASE_VERSION = "4.0"


# ─────────────────────────────────────────────────────────────────────────────
# Knowledge Documents - Enhanced with structured content
# ─────────────────────────────────────────────────────────────────────────────

KNOWLEDGE_DOCUMENTS = [

    # ═══════════════════════════════════════════════════════════════════════
    # Assessment Documents
    # ═══════════════════════════════════════════════════════════════════════

    {
        "title": "Assessment Credit Formula",
        "category": "assessment",
        "content": """
# Assessment Credit Calculation

The credit earned from an assessment is calculated using the formula:

credit_earned = (score / maxScore) * creditValue

Where:
- score: The student's actual score on the assessment
- maxScore: The maximum possible score on the assessment
- creditValue: The credit weight assigned to the assessment

Example: If a student scores 75 out of 100 on an assessment with creditValue 2.0, they earn (75/100) * 2.0 = 1.5 credits.
"""
    },
    {
        "title": "Performance Thresholds",
        "category": "assessment",
        "content": """
# Assessment Performance Thresholds

EduRAGX uses the following performance thresholds for assessments:

- Excellent: >= 80%
- Good: 65-79%
- Average: 50-64%
- Below Average: 35-49%
- At Risk: <35%

These thresholds are used to determine student performance levels and guide intervention decisions.
"""
    },
    {
        "title": "Credit Utilisation and Priority",
        "category": "assessment",
        "content": """
# Credit Utilisation and Intervention Priority

Teacher intervention priority is determined using the student's credit ratio:

- Below 50% credit ratio = HIGH priority
- 50-70% credit ratio = MEDIUM monitoring
- Above 70% credit ratio = LOW priority

Teachers should focus on the highest creditValue assessments first.
Teachers should target assessments where the student's score is below 60%.
"""
    },

    # ═══════════════════════════════════════════════════════════════════════
    # Teaching Documents
    # ═══════════════════════════════════════════════════════════════════════

    {
        "title": "Formative Assessment Strategies",
        "category": "teaching",
        "content": """
# Evidence-Based Formative Assessment Strategies

Recommended formative assessment strategies include:

1. Low-stakes quizzes: Regular, low-pressure assessments to gauge understanding
2. Weekly reviews: Structured review sessions to reinforce learning
3. One-on-one feedback: Personalised feedback sessions with students
4. Peer review: Students evaluate each other's work
5. Self-assessment: Students reflect on their own learning

These strategies help identify learning gaps and guide instruction.
"""
    },
    {
        "title": "Interventions for Below 50% Students",
        "category": "teaching",
        "content": """
# Recommended Interventions for Students Below 50%

For students scoring below 50%, the following interventions are recommended:

- Daily tutoring: One-on-one tutoring sessions every day
- Reassessment opportunities: Additional attempts to improve scores
- Parent notification: Regular communication with parents
- Weekly progress tracking: Monitor improvement weekly

These intensive interventions are designed to help students catch up quickly.
"""
    },
    {
        "title": "Support for 50-70% Students",
        "category": "teaching",
        "content": """
# Support for Students Scoring 50-70%

For students performing between 50% and 70%, recommended support includes:

- Bi-weekly check-ins: Regular progress monitoring every two weeks
- Supplementary learning materials: Additional resources for practice
- Study buddy pairing: Collaborative learning with peers

This moderate support helps maintain progress while building independence.
"""
    },
    {
        "title": "Feedback Best Practices",
        "category": "teaching",
        "content": """
# Feedback Best Practices

Effective feedback in EduRAGX should be:

1. Timely: Provided within 48 hours of assessment completion
2. Specific: Focused on the topic and assessment
3. Actionable: Include three clear improvement steps
4. Prioritised: Focus on highest creditValue assessments first
5. Targeted: Address assessments where score is below 60%
"""
    },

    # ═══════════════════════════════════════════════════════════════════════
    # Career Documents
    # ═══════════════════════════════════════════════════════════════════════

    {
        "title": "STEM Career Pathways",
        "category": "career",
        "content": """
# STEM Career Pathways for Quantitative Students

Students who demonstrate strong quantitative performance above 75% may be suitable for STEM-related pathways.

Recommended STEM career paths include:

- Software Engineering: Strong in programming and logic
- Data Science: Strong in statistics and analysis
- Biomedical Engineering: Strong in math and biology
- Cybersecurity: Strong in systems and cryptography
- AI Research: Strong in algorithms and machine learning

These careers require consistent 75%+ credit ratio in quantitative subjects.
"""
    },
    {
        "title": "Business Career Pathways",
        "category": "career",
        "content": """
# Business Career Pathways

Students who demonstrate strong performance in economics-related modules may be suitable for business pathways.

Recommended business career paths include:

- Business Administration: Strong in management and operations
- Financial Analysis: Strong in accounting and economics
- Marketing: Strong in communication and strategy
- Entrepreneurship: Strong in innovation and business planning
"""
    },
    {
        "title": "Healthcare Career Pathways",
        "category": "career",
        "content": """
# Healthcare Career Pathways

Students who demonstrate strong performance in science subjects may be suitable for healthcare pathways.

Recommended healthcare career paths include:

- Medicine: Strong in biology and chemistry
- Nursing: Strong in anatomy and patient care
- Pharmacy: Strong in chemistry and pharmacology
- Public Health: Strong in epidemiology and community health
"""
    },
    {
        "title": "Arts and Communication Pathways",
        "category": "career",
        "content": """
# Arts and Communication Career Pathways

Students who demonstrate strong performance in language and communication subjects may be suitable for Arts and Communication pathways.

Recommended career paths include:

- Journalism: Strong in writing and research
- Law: Strong in argumentation and analysis
- Education: Strong in communication and mentoring
- Psychology: Strong in interpersonal understanding
- Public Relations: Strong in communication and strategy
"""
    },
    {
        "title": "Career Readiness Indicators",
        "category": "career",
        "content": """
# Career Readiness Indicators

Students are prepared for advanced career pathways when they demonstrate:

1. Consistent 75% or higher credit ratio across core subjects
2. Positive improvement trend in performance over time
3. Strong practical assessment performance in relevant areas

These indicators show that students have mastered foundational knowledge and are ready for career-focused learning.
"""
    },

    # ═══════════════════════════════════════════════════════════════════════
    # Intervention Documents
    # ═══════════════════════════════════════════════════════════════════════

    {
        "title": "Tier 1: Universal Support",
        "category": "intervention",
        "content": """
# Tier 1: Universal Support for All Students

Tier 1 is the foundation of the support system, provided to all students.

Tier 1 includes:

- Quality instruction: Well-designed lessons and activities
- Clear assessment criteria: Transparent grading expectations
- Regular feedback: Timely, specific feedback on performance
- Transparent credit tracking: Clear visibility of credit progress
"""
    },
    {
        "title": "Tier 2: Targeted Support",
        "category": "intervention",
        "content": """
# Tier 2: Targeted Support for 50-70% Students

Tier 2 applies to students with a 50-70% performance or credit ratio.

Tier 2 support includes:

- Small group tutoring: 2-3 times per week in small groups
- Extra practice: Additional learning materials and activities
- Bi-weekly monitoring: Progress checks every two weeks
- Individual study plan: Personalised learning roadmap
"""
    },
    {
        "title": "Tier 3: Intensive Support",
        "category": "intervention",
        "content": """
# Tier 3: Intensive Support for Below 50% Students

Tier 3 applies to students performing below 50%.

Tier 3 support includes:

- Individual daily tutoring: One-on-one tutoring every day
- Weekly meetings: Student, teacher, and parent collaboration
- Credit recovery: Opportunities to earn missed credits
"""
    },
    {
        "title": "Early Warning Indicators",
        "category": "intervention",
        "content": """
# Early Warning Indicators for Intensive Support

Early warning signs that a student may need intensive support include:

- Score below 40% in any topic: Indicates serious gaps
- Two or more missing submissions: Suggests disengagement
- Declining trend in scores: Performance is getting worse
- Zero scores in any topic: Critical gaps in learning

Students showing these warning signs may require immediate Tier 3 intervention.
"""
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Build LangChain Documents
# ─────────────────────────────────────────────────────────────────────────────

def build_documents() -> List[Document]:

    documents = []

    for item in KNOWLEDGE_DOCUMENTS:

        document = Document(
            page_content=item["content"].strip(),
            metadata={
                "title": item["title"],
                "category": item["category"],
                "source": "knowledge_base",
                "kb_version": KNOWLEDGE_BASE_VERSION,
            },
        )

        documents.append(document)

    return documents


# ─────────────────────────────────────────────────────────────────────────────
# Check Knowledge Base Version
# ─────────────────────────────────────────────────────────────────────────────

def _needs_rebuild(
    existing_documents: int,
) -> bool:

    if existing_documents == 0:
        return True

    try:

        vs = get_vector_store()

        collection = vs.chroma_client.get_collection(
            vs.COLLECTION_NAME
        )

        sample = collection.get(
            limit=1,
            include=["metadatas"],
        )

        metadatas = sample.get(
            "metadatas",
            [],
        )

        if not metadatas:
            return True

        existing_version = metadatas[0].get(
            "kb_version"
        )

        if existing_version != KNOWLEDGE_BASE_VERSION:

            logger.info(
                "Knowledge base version changed: "
                f"{existing_version} → "
                f"{KNOWLEDGE_BASE_VERSION}"
            )

            return True

        return False

    except Exception as e:

        logger.warning(
            f"Could not determine KB version: {e}"
        )

        return False


# ─────────────────────────────────────────────────────────────────────────────
# Initialize Knowledge Base
# ─────────────────────────────────────────────────────────────────────────────

async def initialize_knowledge_base():

    vs = get_vector_store()

    count = vs.get_document_count()

    if count > 0 and not _needs_rebuild(count):

        logger.info(
            f"Knowledge base already has {count} chunks "
            f"(version {KNOWLEDGE_BASE_VERSION}). "
            f"Skipping initialization."
        )

        return

    logger.info(
        "Preparing EduRAGX knowledge base..."
    )

    documents = build_documents()

    logger.info(
        f"Source documents: {len(documents)}"
    )

    total_chunks = vs.rebuild(
        documents
    )

    logger.info(
        "======================================================="
    )

    logger.info(
        "EduRAGX knowledge base ready."
    )

    logger.info(
        f"Knowledge base version: "
        f"{KNOWLEDGE_BASE_VERSION}"
    )

    logger.info(
        f"Source documents: "
        f"{len(documents)}"
    )

    logger.info(
        f"Stored chunks: "
        f"{total_chunks}"
    )

    logger.info(
        "======================================================="
    )