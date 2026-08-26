"""
Evaluation dataset for EduRAGX RAG service.
Questions are deliberately aligned with the 4 documents currently loaded
in the knowledge base (Assessment Credit Value System, Teaching Strategies,
Career Paths, Student Support Framework).
"""

EVALUATION_DATASET = [
    # ── Assessment Credit System ──────────────────────────────────────────────
    {
        "id": "Q01",
        "question": "How is credit earned calculated for an assessment in EduRAGX?",
        "expected_concepts": [
            "credit_earned",
            "score/maxScore",
            "creditValue",
            "assessment"
        ],
        "category": "assessment"
    },
    {
        "id": "Q02",
        "question": "What are the performance thresholds used in the assessment credit system?",
        "expected_concepts": [
            "Excellent",
            "Good",
            "Average",
            "Below Average",
            "At Risk",
            "80%",
            "65%",
            "50%",
            "35%"
        ],
        "category": "assessment"
    },
    {
        "id": "Q03",
        "question": "Which assessments should teachers prioritise when a student has low credit utilisation?",
        "expected_concepts": [
            "highest creditValue",
            "score below 60%",
            "priority",
            "credit ratio"
        ],
        "category": "assessment"
    },

    # ── Teaching Strategies ───────────────────────────────────────────────────
    {
        "id": "Q04",
        "question": "What formative assessment strategies are recommended for improving student performance?",
        "expected_concepts": [
            "low-stakes quizzes",
            "weekly reviews",
            "one-on-one feedback",
            "peer review",
            "self-assessment"
        ],
        "category": "teaching"
    },
    {
        "id": "Q05",
        "question": "What interventions should be used for students scoring below 50%?",
        "expected_concepts": [
            "daily tutoring",
            "reassessment",
            "parent notification",
            "weekly progress tracking"
        ],
        "category": "teaching"
    },
    {
        "id": "Q06",
        "question": "How quickly should teachers provide feedback and what should it include?",
        "expected_concepts": [
            "48 hours",
            "specific",
            "topic",
            "assessment",
            "3 improvement steps"
        ],
        "category": "teaching"
    },
    {
        "id": "Q07",
        "question": "What support is recommended for students performing between 50% and 70%?",
        "expected_concepts": [
            "bi-weekly check-ins",
            "supplementary materials",
            "study buddy",
            "pairing"
        ],
        "category": "teaching"
    },

    # ── Student Support Framework ─────────────────────────────────────────────
    {
        "id": "Q08",
        "question": "Describe the multi-tiered student support system used in EduRAGX.",
        "expected_concepts": [
            "Tier 1",
            "Tier 2",
            "Tier 3",
            "quality instruction",
            "small group tutoring",
            "individual daily tutoring"
        ],
        "category": "intervention"
    },
    {
        "id": "Q09",
        "question": "What are the early warning signs that a student may need intensive support?",
        "expected_concepts": [
            "score below 40%",
            "missing submissions",
            "declining trend",
            "zero scores"
        ],
        "category": "intervention"
    },
    {
        "id": "Q10",
        "question": "What actions are recommended for Tier 3 students scoring below 50%?",
        "expected_concepts": [
            "individual daily tutoring",
            "weekly meetings",
            "student",
            "teacher",
            "parent",
            "credit recovery"
        ],
        "category": "intervention"
    },

    # ── Career Paths ──────────────────────────────────────────────────────────
    {
        "id": "Q11",
        "question": "Which career paths are recommended for students strong in quantitative subjects?",
        "expected_concepts": [
            "STEM",
            "Software Engineering",
            "Data Science",
            "Biomedical Engineering",
            "Cybersecurity",
            "AI Research"
        ],
        "category": "career"
    },
    {
        "id": "Q12",
        "question": "What career options suit students who perform well in language and communication subjects?",
        "expected_concepts": [
            "Journalism",
            "Law",
            "Education",
            "Psychology",
            "Public Relations"
        ],
        "category": "career"
    },
    {
        "id": "Q13",
        "question": "What readiness indicators suggest a student is prepared for advanced career pathways?",
        "expected_concepts": [
            "75%+",
            "credit ratio",
            "improvement trend",
            "practical assessments"
        ],
        "category": "career"
    },

    # ── Mixed / Cross-document questions ──────────────────────────────────────
    {
        "id": "Q14",
        "question": "How can teachers identify students who require additional academic support?",
        "expected_concepts": [
            "early warning",
            "score below 40%",
            "missing submissions",
            "declining trend",
            "credit ratio",
            "Below 50%"
        ],
        "category": "intervention"
    },
    {
        "id": "Q15",
        "question": "What evidence-based strategies can improve student assessment performance?",
        "expected_concepts": [
            "formative assessment",
            "feedback",
            "tutoring",
            "targeted interventions",
            "creditValue"
        ],
        "category": "teaching"
    },
    {
        "id": "Q16",
        "question": "How should personalised learning support be provided to struggling students?",
        "expected_concepts": [
            "individual tutoring",
            "small group",
            "study plan",
            "extra practice",
            "Tier 2",
            "Tier 3"
        ],
        "category": "intervention"
    },
    {
        "id": "Q17",
        "question": "What is the recommended approach when a student has a credit utilisation ratio below 50%?",
        "expected_concepts": [
            "HIGH priority",
            "daily tutoring",
            "parent notification",
            "credit recovery",
            "intervention"
        ],
        "category": "assessment"
    },
    {
        "id": "Q18",
        "question": "How can career guidance be linked to a student's current module performance?",
        "expected_concepts": [
            "strength areas",
            "improvement areas",
            "relevant modules",
            "suitability",
            "career paths"
        ],
        "category": "career"
    },
    {
        "id": "Q19",
        "question": "What combination of teaching and support strategies is recommended for at-risk students?",
        "expected_concepts": [
            "daily tutoring",
            "weekly meetings",
            "parent",
            "reassessment",
            "progress tracking",
            "Tier 3"
        ],
        "category": "intervention"
    },
    {
        "id": "Q20",
        "question": "How does the assessment credit value system help teachers prioritise interventions?",
        "expected_concepts": [
            "creditValue",
            "credit ratio",
            "highest creditValue",
            "score below 60%",
            "HIGH priority",
            "MEDIUM"
        ],
        "category": "assessment"
    },
    {
        "id": "Q21",
        "question": "What feedback practices improve student outcomes according to the teaching strategies?",
        "expected_concepts": [
            "within 48 hours",
            "specific",
            "topic",
            "assessment",
            "improvement steps"
        ],
        "category": "teaching"
    },
    {
        "id": "Q22",
        "question": "Which healthcare career paths are suggested for students strong in science?",
        "expected_concepts": [
            "Medicine",
            "Nursing",
            "Pharmacy",
            "Public Health",
            "science"
        ],
        "category": "career"
    },
    {
        "id": "Q23",
        "question": "What is the difference between Tier 2 and Tier 3 support in the student support framework?",
        "expected_concepts": [
            "Tier 2",
            "Tier 3",
            "small group tutoring",
            "individual daily tutoring",
            "bi-weekly",
            "weekly meetings",
            "parent"
        ],
        "category": "intervention"
    },
    {
        "id": "Q24",
        "question": "How should teachers use assessment data to decide intervention priority?",
        "expected_concepts": [
            "credit ratio",
            "Below 50%",
            "HIGH priority",
            "50-70%",
            "MEDIUM",
            "score"
        ],
        "category": "assessment"
    },
    {
        "id": "Q25",
        "question": "What business-related careers are recommended for students strong in economics-related modules?",
        "expected_concepts": [
            "Business Admin",
            "Financial Analysis",
            "Marketing",
            "Entrepreneurship"
        ],
        "category": "career"
    },
]