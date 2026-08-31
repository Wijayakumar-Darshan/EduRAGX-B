"""
EduRAGX RAG Engine
Local Ollama LLM + ChromaDB knowledge retrieval.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, Optional

import httpx

from langchain.schema import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from app.config import get_settings
from app.core.vector_store import get_vector_store


logger = logging.getLogger(__name__)

settings = get_settings()

LLM_TIMEOUT = settings.llm_timeout


# ═════════════════════════════════════════════════════════════════════════════
# OLLAMA WARM UP
# ═════════════════════════════════════════════════════════════════════════════

async def warm_up_model(
    model: str,
    base_url: Optional[str] = None,
) -> bool:

    base_url = (
        base_url
        or settings.ollama_base_url
    )

    logger.info(
        "Warming up Ollama model '%s'...",
        model,
    )

    try:

        timeout = httpx.Timeout(
            300.0
        )

        async with httpx.AsyncClient(
            timeout=timeout
        ) as client:

            response = await client.post(
                f"{base_url}/api/generate",
                json={
                    "model": model,
                    "prompt": "Hi",
                    "stream": False,
                },
            )

            response.raise_for_status()

        logger.info(
            "Ollama model '%s' is ready.",
            model,
        )

        return True

    except httpx.ConnectError:

        logger.warning(
            "Ollama is not reachable. "
            "Start Ollama with: ollama serve"
        )

        return False

    except Exception as exc:

        logger.warning(
            "Ollama warm-up failed: %s",
            exc,
        )

        return False


# ═════════════════════════════════════════════════════════════════════════════
# LLM
# ═════════════════════════════════════════════════════════════════════════════

def _make_llm() -> ChatOllama:

    return ChatOllama(
        model=settings.llm_model,
        base_url=settings.ollama_base_url,
        temperature=settings.temperature,
        num_predict=settings.num_predict,
        num_ctx=settings.num_ctx,
        keep_alive="10m",
        request_timeout=LLM_TIMEOUT,
    )


# ═════════════════════════════════════════════════════════════════════════════
# JSON PARSER
# ═════════════════════════════════════════════════════════════════════════════

def _parse_json(text: str) -> dict:

    text = text.strip()

    # Remove markdown code fences.
    if "```" in text:

        parts = text.split("```")

        for part in parts:

            part = part.strip()

            if part.startswith("json"):
                part = part[4:].strip()

            if not part:
                continue

            try:
                parsed = json.loads(part)

                if isinstance(parsed, dict):
                    return parsed

            except json.JSONDecodeError:
                continue

    # Direct JSON.
    try:

        parsed = json.loads(text)

        if isinstance(parsed, dict):
            return parsed

    except json.JSONDecodeError:
        pass

    # Search for JSON object.
    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end > start:

        candidate = text[
            start:end + 1
        ]

        try:

            parsed = json.loads(
                candidate
            )

            if isinstance(parsed, dict):
                return parsed

        except json.JSONDecodeError:
            pass

    raise json.JSONDecodeError(
        "No valid JSON object found.",
        text,
        0,
    )


# ═════════════════════════════════════════════════════════════════════════════
# SANITIZE TEACHER RESULT
# ═════════════════════════════════════════════════════════════════════════════

def _sanitize(raw: dict) -> dict:

    # Strength areas
    strength_areas = raw.get(
        "strength_areas",
        [],
    )

    if isinstance(
        strength_areas,
        str,
    ):

        if strength_areas.lower() in (
            "",
            "none",
            "n/a",
        ):
            strength_areas = []

        else:
            strength_areas = [
                strength_areas
            ]

    raw["strength_areas"] = (
        strength_areas
        if isinstance(
            strength_areas,
            list,
        )
        else []
    )

    # Improvement areas
    improvement_areas = raw.get(
        "improvement_areas",
        [],
    )

    if isinstance(
        improvement_areas,
        str,
    ):

        improvement_areas = (
            [improvement_areas]
            if improvement_areas
            else []
        )

    raw["improvement_areas"] = (
        improvement_areas
        if isinstance(
            improvement_areas,
            list,
        )
        else []
    )

    # Recommended actions
    actions = raw.get(
        "recommended_actions",
        [],
    )

    cleaned_actions = []

    if isinstance(
        actions,
        list,
    ):

        for action in actions:

            if not isinstance(
                action,
                dict,
            ):
                continue

            priority = str(
                action.get(
                    "priority",
                    "MEDIUM",
                )
            ).strip()

            if "|" in priority:
                priority = (
                    priority
                    .split("|")[0]
                    .strip()
                )

            if priority not in (
                "HIGH",
                "MEDIUM",
                "LOW",
            ):
                priority = "MEDIUM"

            cleaned_actions.append(
                {
                    "action": str(
                        action.get(
                            "action",
                            "Review student performance",
                        )
                    ),
                    "priority": priority,
                    "timeline": str(
                        action.get(
                            "timeline",
                            "This week",
                        )
                    ),
                    "expected_impact": str(
                        action.get(
                            "expected_impact",
                            "Improved performance",
                        )
                    ),
                }
            )

    raw["recommended_actions"] = (
        cleaned_actions
    )

    # Performance summary
    performance_summary = raw.get(
        "performance_summary",
        {},
    )

    if isinstance(
        performance_summary,
        str,
    ):

        try:

            performance_summary = json.loads(
                performance_summary
            )

        except json.JSONDecodeError:

            performance_summary = {}

    if not isinstance(
        performance_summary,
        dict,
    ):
        performance_summary = {}

    valid_statuses = {
        "EXCELLENT",
        "GOOD",
        "AVERAGE",
        "NEEDS_IMPROVEMENT",
        "AT_RISK",
    }

    status = str(
        performance_summary.get(
            "overall_status",
            "AVERAGE",
        )
    ).strip()

    if status not in valid_statuses:

        found = None

        for item in status.split("|"):

            item = item.strip()

            if item in valid_statuses:
                found = item
                break

        status = (
            found
            or "AVERAGE"
        )

    performance_summary[
        "overall_status"
    ] = status

    performance_summary[
        "credit_utilization"
    ] = str(
        performance_summary.get(
            "credit_utilization",
            "",
        )
    )

    trend = str(
        performance_summary.get(
            "trend",
            "STABLE",
        )
    ).strip()

    if trend not in (
        "IMPROVING",
        "STABLE",
        "DECLINING",
    ):
        trend = "STABLE"

    performance_summary[
        "trend"
    ] = trend

    raw[
        "performance_summary"
    ] = performance_summary

    # Strings
    for key in (
        "analysis",
        "suggestions",
    ):

        value = raw.get(
            key,
            "",
        )

        if isinstance(
            value,
            dict,
        ):

            raw[key] = json.dumps(
                value,
                ensure_ascii=False,
            )

        elif not isinstance(
            value,
            str,
        ):

            raw[key] = str(value)

    return raw


# ═════════════════════════════════════════════════════════════════════════════
# PERFORMANCE CONTEXT
# ═════════════════════════════════════════════════════════════════════════════

def _build_context(
    performance_data: dict,
) -> str:

    lines = [
        f"Student: {performance_data.get('student_name', '')}",
        f"Overall Score: {performance_data.get('overall_percentage', 0)}%",
        (
            "Credits: "
            f"{performance_data.get('overall_credits_earned', 0)}"
            "/"
            f"{performance_data.get('overall_total_credits', 0)}"
        ),
        "",
        "MODULES:",
    ]

    for module in (
        performance_data.get(
            "modules",
            [],
        )
        or []
    ):

        lines.append(
            "  - "
            f"{module.get('module_name', 'Unknown')}: "
            f"{module.get('percentage', 0)}% "
            f"("
            f"{module.get('credits_earned', 0)}"
            "/"
            f"{module.get('total_credits', 0)}"
            " credits)"
        )

        for assessment in (
            module.get(
                "assessments",
                [],
            )
            or []
        ):

            if (
                assessment.get(
                    "marks_obtained"
                )
                is not None
            ):

                score = (
                    f"{assessment.get('marks_obtained')}"
                    "/"
                    f"{assessment.get('max_marks')}"
                )

            else:

                score = "not submitted"

            lines.append(
                "      * "
                f"{assessment.get('title', 'Assessment')}: "
                f"{score}"
            )

    return "\n".join(lines)


# ═════════════════════════════════════════════════════════════════════════════
# KNOWLEDGE RETRIEVAL
# ═════════════════════════════════════════════════════════════════════════════

def _get_knowledge(
    query: str,
    k: int = 4,
) -> str:

    try:

        docs = get_vector_store().enhanced_retrieval(
            query,
            k=k,
            use_mmr=False,
        )

        if not docs:
            return ""

        return "\n\n".join(
            doc.page_content
            for doc in docs
        )

    except Exception as exc:

        logger.warning(
            "Knowledge retrieval failed: %s",
            exc,
        )

        return ""


# ═════════════════════════════════════════════════════════════════════════════
# PROMPTS
# ═════════════════════════════════════════════════════════════════════════════

TEACHER_SYSTEM = """
You are an educational AI advisor for EduRAGX.

Output ONLY one valid JSON object.

Do not output markdown.
Do not output explanations outside JSON.

Use this exact structure:

{
  "analysis": "Plain readable analysis.",
  "suggestions": "Plain readable suggestions.",
  "strength_areas": ["Area 1"],
  "improvement_areas": ["Area 1"],
  "recommended_actions": [
    {
      "action": "Action",
      "priority": "HIGH",
      "timeline": "This week",
      "expected_impact": "Expected impact"
    }
  ],
  "performance_summary": {
    "overall_status": "NEEDS_IMPROVEMENT",
    "credit_utilization": "Description",
    "trend": "STABLE"
  }
}

Rules:

priority MUST be exactly:
HIGH
MEDIUM
LOW

overall_status MUST be exactly one of:
EXCELLENT
GOOD
AVERAGE
NEEDS_IMPROVEMENT
AT_RISK

trend MUST be exactly one of:
IMPROVING
STABLE
DECLINING

Use the provided student data and knowledge reference.
Do not invent numerical student results.
"""


CAREER_SYSTEM = """
You are a career counselor AI for EduRAGX.

Output ONLY one valid JSON object.

Do not output markdown.
Do not output explanations outside JSON.

Use this structure:

{
  "career_paths": [
    {
      "career": "Career",
      "suitability_score": 80,
      "reasoning": "Reasoning",
      "required_improvements": ["Improvement"],
      "relevant_modules": ["Module"]
    }
  ],
  "strength_areas": ["Area"],
  "improvement_areas": ["Area"],
  "recommendations": "Recommendation",
  "action_plan": "Action plan",
  "module_specific_advice": [
    {
      "module": "Mathematics",
      "current_performance": "Good at 72%",
      "improvement_strategy": "Practice regularly",
      "career_relevance": "Relevant to the career"
    }
  ]
}

Rules:

suitability_score MUST be a number from 0 to 100.

Use the provided student performance and knowledge reference.

Do not invent student scores.
"""


# ═════════════════════════════════════════════════════════════════════════════
# RAG ENGINE
# ═════════════════════════════════════════════════════════════════════════════

class RAGEngine:

    def __init__(self):

        self.llm = _make_llm()

    async def _call_llm(
        self,
        system: str,
        user: str,
    ) -> str:

        response = await asyncio.wait_for(
            self.llm.ainvoke(
                [
                    SystemMessage(
                        content=system
                    ),
                    HumanMessage(
                        content=user
                    ),
                ]
            ),
            timeout=LLM_TIMEOUT,
        )

        return response.content

    # ═════════════════════════════════════════════════════════════════════
    # TEACHER SUGGESTIONS
    # ═════════════════════════════════════════════════════════════════════

    async def generate_teacher_suggestions(
        self,
        performance_data: dict,
        specific_concerns: Optional[str] = None,
        focus_areas: Optional[list] = None,
    ) -> Dict[str, Any]:

        context = _build_context(
            performance_data
        )

        knowledge = _get_knowledge(
            "formative assessment strategies "
            "student support interventions "
            "feedback tutoring progress monitoring",
            k=5,
        )

        concerns = (
            f"\nConcerns: {specific_concerns}"
            if specific_concerns
            else ""
        )

        focus = (
            "\nFocus areas: "
            + ", ".join(focus_areas)
            if focus_areas
            else ""
        )

        reference = (
            "\n\nKNOWLEDGE BASE REFERENCE:\n"
            + knowledge
            if knowledge
            else ""
        )

        user_prompt = (
            "Analyse the student using the supplied "
            "performance information and knowledge reference.\n\n"
            f"{context}"
            f"{concerns}"
            f"{focus}"
            f"{reference}"
        )

        try:

            logger.info(
                "Calling Ollama [%s] for teacher suggestions...",
                settings.llm_model,
            )

            raw = await self._call_llm(
                TEACHER_SYSTEM,
                user_prompt,
            )

            result = _parse_json(
                raw
            )

            logger.info(
                "Teacher suggestions generated successfully."
            )

            return _sanitize(
                result
            )

        except json.JSONDecodeError:

            logger.warning(
                "Teacher response was not valid JSON. "
                "Using deterministic fallback."
            )

            modules = performance_data.get(
                "modules",
                [],
            )

            improvement = [
                module.get(
                    "module_name",
                    "Unknown",
                )
                for module in modules
                if module.get(
                    "percentage",
                    100,
                ) < 60
            ]

            strengths = [
                module.get(
                    "module_name",
                    "Unknown",
                )
                for module in modules
                if module.get(
                    "percentage",
                    0,
                ) >= 70
            ]

            actions = []

            for module in modules:

                percentage = float(
                    module.get(
                        "percentage",
                        0,
                    )
                )

                if percentage < 70:

                    priority = (
                        "HIGH"
                        if percentage < 50
                        else "MEDIUM"
                    )

                    actions.append(
                        {
                            "action": (
                                "Review "
                                f"{module.get('module_name', 'module')} "
                                f"currently at {percentage}%"
                            ),
                            "priority": priority,
                            "timeline": "This week",
                            "expected_impact": (
                                "Improved performance "
                                "and credit accumulation"
                            ),
                        }
                    )

            overall = float(
                performance_data.get(
                    "overall_percentage",
                    0,
                )
            )

            if overall >= 80:
                status = "EXCELLENT"
            elif overall >= 65:
                status = "GOOD"
            elif overall >= 50:
                status = "AVERAGE"
            elif overall >= 35:
                status = "NEEDS_IMPROVEMENT"
            else:
                status = "AT_RISK"

            fallback = {
                "analysis": (
                    f"Student "
                    f"{performance_data.get('student_name', '')} "
                    f"has an overall score of {overall}%."
                ),
                "suggestions": (
                    "Focus support on the lowest-performing "
                    "modules and monitor progress regularly."
                ),
                "strength_areas": strengths,
                "improvement_areas": improvement,
                "recommended_actions": actions[:3],
                "performance_summary": {
                    "overall_status": status,
                    "credit_utilization": (
                        f"Student earned "
                        f"{performance_data.get('overall_credits_earned', 0)} "
                        "of "
                        f"{performance_data.get('overall_total_credits', 0)} "
                        "credits"
                    ),
                    "trend": "STABLE",
                },
            }

            return _sanitize(
                fallback
            )

        except asyncio.TimeoutError:

            raise RuntimeError(
                f"Ollama model '{settings.llm_model}' "
                f"timed out after "
                f"{LLM_TIMEOUT // 60} minutes."
            )

        except Exception as exc:

            logger.exception(
                "Teacher suggestion failed: %s",
                exc,
            )

            raise

    # ═════════════════════════════════════════════════════════════════════
    # CAREER GUIDANCE
    # ═════════════════════════════════════════════════════════════════════

    async def generate_career_guidance(
        self,
        performance_data: dict,
        interests: Optional[list] = None,
        preferred_fields: Optional[list] = None,
    ) -> Dict[str, Any]:

        context = _build_context(
            performance_data
        )

        knowledge = _get_knowledge(
            "STEM career pathways "
            "business careers "
            "healthcare careers "
            "arts communication "
            "career readiness indicators",
            k=6,
        )

        interests_text = (
            "\nInterests: "
            + ", ".join(interests)
            if interests
            else ""
        )

        fields_text = (
            "\nPreferred fields: "
            + ", ".join(preferred_fields)
            if preferred_fields
            else ""
        )

        reference = (
            "\n\nKNOWLEDGE BASE REFERENCE:\n"
            + knowledge
            if knowledge
            else ""
        )

        user_prompt = (
            "Provide career guidance based on the "
            "student performance and knowledge reference.\n\n"
            f"{context}"
            f"{interests_text}"
            f"{fields_text}"
            f"{reference}"
        )

        try:

            logger.info(
                "Calling Ollama [%s] for career guidance...",
                settings.llm_model,
            )

            raw = await self._call_llm(
                CAREER_SYSTEM,
                user_prompt,
            )

            result = _parse_json(
                raw
            )

            for career in result.get(
                "career_paths",
                [],
            ):

                try:

                    score = int(
                        float(
                            str(
                                career.get(
                                    "suitability_score",
                                    70,
                                )
                            ).replace(
                                "%",
                                "",
                            )
                        )
                    )

                    career[
                        "suitability_score"
                    ] = max(
                        0,
                        min(
                            100,
                            score,
                        ),
                    )

                except Exception:

                    career[
                        "suitability_score"
                    ] = 70

            return result

        except json.JSONDecodeError:

            overall = float(
                performance_data.get(
                    "overall_percentage",
                    0,
                )
            )

            modules = performance_data.get(
                "modules",
                [],
            )

            return {
                "career_paths": [
                    {
                        "career": "General Professional",
                        "suitability_score": int(
                            max(
                                0,
                                min(
                                    100,
                                    overall,
                                ),
                            )
                        ),
                        "reasoning": (
                            f"Overall performance is "
                            f"{overall}%."
                        ),
                        "required_improvements": [
                            "Improve weaker module scores"
                        ],
                        "relevant_modules": [
                            module.get(
                                "module_name",
                                "Unknown",
                            )
                            for module in modules
                        ],
                    }
                ],
                "strength_areas": [],
                "improvement_areas": [
                    module.get(
                        "module_name",
                        "Unknown",
                    )
                    for module in modules
                    if module.get(
                        "percentage",
                        100,
                    ) < 60
                ],
                "recommendations": (
                    "Improve weaker modules while "
                    "considering personal interests."
                ),
                "action_plan": (
                    "Step 1: Identify weaker modules. "
                    "Step 2: Seek additional support. "
                    "Step 3: Review progress."
                ),
                "module_specific_advice": [],
            }

        except asyncio.TimeoutError:

            raise RuntimeError(
                f"Ollama model '{settings.llm_model}' "
                "timed out during career guidance."
            )

        except Exception as exc:

            logger.exception(
                "Career guidance failed: %s",
                exc,
            )

            raise

    # ═════════════════════════════════════════════════════════════════════
    # FULL REPORT
    # ═════════════════════════════════════════════════════════════════════

    async def generate_full_report(
        self,
        performance_data: dict,
        teacher_comments: Optional[str] = None,
        teacher_suggestions: Optional[str] = None,
        include_career_guidance: bool = True,
    ) -> Dict[str, Any]:

        ai_result = (
            await self.generate_teacher_suggestions(
                performance_data
            )
        )

        career_result = None

        if include_career_guidance:

            career_result = (
                await self.generate_career_guidance(
                    performance_data
                )
            )

        separator = "=" * 60

        lines = [
            separator,
            "       EDURAGX STUDENT PERFORMANCE REPORT",
            separator,
            (
                "Student : "
                f"{performance_data.get('student_name', '')}"
            ),
            (
                "Overall : "
                f"{performance_data.get('overall_percentage', 0)}%"
            ),
            (
                "Credits : "
                f"{performance_data.get('overall_credits_earned', 0)}"
                "/"
                f"{performance_data.get('overall_total_credits', 0)}"
            ),
            "",
            separator,
            "AI PERFORMANCE ANALYSIS",
            separator,
            ai_result.get(
                "analysis",
                "",
            ),
            "",
            separator,
            "AI SUGGESTIONS",
            separator,
            ai_result.get(
                "suggestions",
                "",
            ),
            "",
        ]

        if ai_result.get(
            "strength_areas"
        ):

            lines.append(
                "STRENGTH AREAS:"
            )

            for item in ai_result[
                "strength_areas"
            ]:

                lines.append(
                    f"  ✓ {item}"
                )

        if ai_result.get(
            "improvement_areas"
        ):

            lines.append(
                "IMPROVEMENT AREAS:"
            )

            for item in ai_result[
                "improvement_areas"
            ]:

                lines.append(
                    f"  ⚠ {item}"
                )

        for index, action in enumerate(
            ai_result.get(
                "recommended_actions",
                [],
            ),
            start=1,
        ):

            lines.append(
                f"  {index}. "
                f"[{action.get('priority', '')}] "
                f"{action.get('action', '')}"
            )

        if teacher_comments:

            lines.extend(
                [
                    separator,
                    "TEACHER COMMENTS",
                    separator,
                    teacher_comments,
                    "",
                ]
            )

        if teacher_suggestions:

            lines.extend(
                [
                    separator,
                    "TEACHER SUGGESTIONS",
                    separator,
                    teacher_suggestions,
                    "",
                ]
            )

        if career_result:

            lines.extend(
                [
                    separator,
                    "CAREER GUIDANCE",
                    separator,
                    career_result.get(
                        "recommendations",
                        "",
                    ),
                    "",
                    "ACTION PLAN:",
                    career_result.get(
                        "action_plan",
                        "",
                    ),
                    "",
                ]
            )

        lines.append(
            separator
        )

        return {
            "ai_analysis": ai_result.get(
                "analysis",
                "",
            ),
            "ai_suggestions": json.dumps(
                ai_result,
                ensure_ascii=False,
            ),
            "ai_career_guidance": (
                json.dumps(
                    career_result,
                    ensure_ascii=False,
                )
                if career_result
                else None
            ),
            "final_report": "\n".join(
                lines
            ),
            "performance_summary": ai_result.get(
                "performance_summary",
                {},
            ),
        }


# ═════════════════════════════════════════════════════════════════════════════
# SINGLETON ENGINE
# ═════════════════════════════════════════════════════════════════════════════

_rag_engine: Optional[RAGEngine] = None


def get_rag_engine() -> RAGEngine:

    global _rag_engine

    if _rag_engine is None:

        _rag_engine = RAGEngine()

    return _rag_engine