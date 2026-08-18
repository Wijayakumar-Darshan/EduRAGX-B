from langchain.schema import Document
from typing import List
import logging
from app.core.vector_store import get_vector_store

logger = logging.getLogger(__name__)

KNOWLEDGE_DOCUMENTS = [
    {"title":"Assessment Credit Value System","category":"assessment","content":"""
# Assessment Credit Value System in EduRAGX
Each assessment has creditValue and maxScore. credit_earned = (score/maxScore)*creditValue.
Thresholds: Excellent>=80%, Good 65-79%, Average 50-64%, Below Average 35-49%, At Risk<35%.
Strategies: Focus on highest creditValue assessments first. Target assessments where score<60%.
Teacher Interventions: Below 50% credit ratio = HIGH priority. 50-70% = MEDIUM monitoring."""},
    {"title":"Teaching Strategies","category":"teaching","content":"""
# Evidence-Based Teaching Strategies for EduRAGX
Formative: Low-stakes quizzes, weekly reviews, one-on-one feedback, peer review, self-assessment.
Below 50%: Daily tutoring, reassessment opportunities, parent notification, weekly progress tracking.
50-70%: Bi-weekly check-ins, supplementary materials, study buddy pairing.
Feedback: Within 48 hours, specific to topic and assessment, include 3 improvement steps."""},
    {"title":"Career Paths","category":"career","content":"""
# Career Guidance Framework for EduRAGX Students
STEM (>75% quantitative): Software Engineering, Data Science, Biomedical Engineering, Cybersecurity, AI Research.
Business (strong economics): Business Admin, Financial Analysis, Marketing, Entrepreneurship.
Healthcare (strong science): Medicine, Nursing, Pharmacy, Public Health.
Arts/Communication (strong language): Journalism, Law, Education, Psychology, Public Relations.
Readiness: Consistent 75%+ credit ratio, improvement trend, strong practical assessments."""},
    {"title":"Student Support Framework","category":"intervention","content":"""
# Multi-Tiered Student Support System
Tier 1 (All): Quality instruction, clear criteria, regular feedback, transparent credit tracking.
Tier 2 (50-70%): Small group tutoring 2-3x/week, extra practice, bi-weekly monitoring, study plan.
Tier 3 (<50%): Individual daily tutoring, weekly meetings with student+teacher+parent, credit recovery.
Early Warning: Score below 40%, 2+ missing submissions, declining trend, zero scores in any topic."""},
]

async def initialize_knowledge_base():
    vs    = get_vector_store()
    count = vs.get_document_count()
    if count > 0:
        logger.info(f"Knowledge base already has {count} documents. Skipping init.")
        return
    logger.info("Initializing knowledge base with default documents...")
    documents = [Document(page_content=d["content"], metadata={"title":d["title"],"category":d["category"],"source":"knowledge_base"}) for d in KNOWLEDGE_DOCUMENTS]
    vs.add_documents(documents)
    logger.info(f"Knowledge base initialized with {len(documents)} documents")
