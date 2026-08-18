import asyncio, json, logging, traceback
from typing import Any, Dict, Optional
import httpx
from langchain.schema import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama
from app.config import get_settings
from app.core.vector_store import get_vector_store

logger   = logging.getLogger(__name__)
settings = get_settings()
LLM_TIMEOUT = 600  # 10 minutes

# ── Warm-up ───────────────────────────────────────────────────────────────────
async def warm_up_model(model: str, base_url: str = "http://localhost:11434") -> bool:
    logger.info(f"Warming up '{model}'…")
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
            r = await client.post(f"{base_url}/api/generate", json={"model":model,"prompt":"Hi","stream":False})
            r.raise_for_status()
        logger.info(f"✅ '{model}' is warm and ready."); return True
    except httpx.ConnectError:
        logger.warning("⚠ Warm-up failed: Ollama not reachable. Run: ollama serve"); return False
    except Exception as e:
        logger.warning(f"⚠ Warm-up failed: {type(e).__name__}: {e}"); return False

# ── Helpers ───────────────────────────────────────────────────────────────────
def _make_llm() -> ChatOllama:
    return ChatOllama(
        model=settings.llm_model, base_url="http://localhost:11434",
        temperature=0.1, num_predict=600, num_ctx=2048,
        keep_alive="10m", request_timeout=600.0,
    )

def _sanitize(raw: dict) -> dict:
    sa = raw.get("strength_areas",[])
    if isinstance(sa,str): raw["strength_areas"] = [] if sa.lower() in ("none","","n/a") else [sa]
    ia = raw.get("improvement_areas",[])
    if isinstance(ia,str): raw["improvement_areas"] = [ia] if ia else []
    actions = raw.get("recommended_actions",[])
    if isinstance(actions,list):
        cleaned = []
        for act in actions:
            if not isinstance(act,dict): continue
            p = str(act.get("priority","MEDIUM"))
            if "|" in p: p = p.split("|")[0].strip()
            if p not in ("HIGH","MEDIUM","LOW"): p = "MEDIUM"
            cleaned.append({"action":str(act.get("action","Review student performance")),"priority":p,"timeline":str(act.get("timeline","This week")),"expected_impact":str(act.get("expected_impact","Improved performance"))})
        raw["recommended_actions"] = cleaned
    ps = raw.get("performance_summary",{})
    if isinstance(ps,str):
        try: ps = json.loads(ps)
        except: ps = {}
        raw["performance_summary"] = ps
    if isinstance(ps,dict):
        status = str(ps.get("overall_status","AVERAGE"))
        valid  = {"EXCELLENT","GOOD","AVERAGE","NEEDS_IMPROVEMENT","AT_RISK"}
        if status not in valid:
            for s in status.split("|"):
                if s.strip() in valid: status = s.strip(); break
            else: status = "AVERAGE"
        ps["overall_status"]    = status
        ps["credit_utilization"]= str(ps.get("credit_utilization",""))
        trend = str(ps.get("trend","STABLE"))
        if trend not in ("IMPROVING","STABLE","DECLINING"): trend = "STABLE"
        ps["trend"] = trend
        raw["performance_summary"] = ps
    for k in ("analysis","suggestions"):
        v = raw.get(k,"")
        if isinstance(v,dict): raw[k] = json.dumps(v)
        elif not isinstance(v,str): raw[k] = str(v)
    return raw

def _parse_json(text: str) -> dict:
    text = text.strip()
    if "```" in text:
        for part in text.split("```"):
            part = part.strip()
            if part.startswith("json"): part = part[4:].strip()
            if part:
                try: return json.loads(part)
                except: continue
    try: return json.loads(text)
    except: pass
    s,e = text.find("{"), text.rfind("}")
    if s!=-1 and e>s:
        try: return json.loads(text[s:e+1])
        except: pass
    raise json.JSONDecodeError("No valid JSON", text, 0)

def _build_context(perf: dict) -> str:
    lines = [f"Student: {perf['student_name']}",f"Overall Score: {perf['overall_percentage']}%",
             f"Credits: {perf['overall_credits_earned']}/{perf['overall_total_credits']}","","MODULES:"]
    for mod in perf["modules"]:
        lines.append(f"  - {mod['module_name']}: {mod['percentage']}% ({mod['credits_earned']}/{mod['total_credits']} credits)")
        for a in (mod.get("assessments") or []):
            s = f"{a['marks_obtained']}/{a['max_marks']}" if a.get("marks_obtained") is not None else "not submitted"
            lines.append(f"      * {a['title']}: {s}")
    return "\n".join(lines)

def _get_knowledge(query: str) -> str:
    try:
        docs = get_vector_store().similarity_search(query, k=2)
        return "\n\n".join(d.page_content[:500] for d in docs) if docs else ""
    except: return ""

TEACHER_SYSTEM = """You are an educational AI advisor for EduRAGX. Output ONLY a single valid JSON object. No markdown, no explanation, no text outside the JSON.

EXAMPLE (copy this exact structure):
{
  "analysis": "The student shows weak performance in Mathematics at 45%. Science is also below average at 52%. Overall the student needs focused support in quantitative subjects.",
  "suggestions": "Schedule weekly one-on-one tutoring for Mathematics. Assign extra Science practice materials and monitor progress bi-weekly.",
  "strength_areas": ["History", "English"],
  "improvement_areas": ["Mathematics", "Science"],
  "recommended_actions": [
    {"action": "Schedule weekly Mathematics tutoring", "priority": "HIGH", "timeline": "This week", "expected_impact": "10-15% score improvement in 4 weeks"},
    {"action": "Assign extra Science practice", "priority": "MEDIUM", "timeline": "Next 2 weeks", "expected_impact": "Better topic understanding"}
  ],
  "performance_summary": {
    "overall_status": "NEEDS_IMPROVEMENT",
    "credit_utilization": "Student has earned 45% of available credits",
    "trend": "DECLINING"
  }
}
RULES: priority = exactly one of HIGH/MEDIUM/LOW. overall_status = one of EXCELLENT/GOOD/AVERAGE/NEEDS_IMPROVEMENT/AT_RISK. trend = one of IMPROVING/STABLE/DECLINING. All values must be plain readable strings."""

CAREER_SYSTEM = """You are a career counselor AI for EduRAGX. Output ONLY a single valid JSON object. No markdown, no explanation, no text outside the JSON.

EXAMPLE (copy this exact structure):
{
  "career_paths": [
    {"career": "Software Engineer", "suitability_score": 82, "reasoning": "Strong analytical skills shown in Mathematics and Science modules.", "required_improvements": ["Improve Science score to above 70%"], "relevant_modules": ["Mathematics", "Science"]}
  ],
  "strength_areas": ["Mathematics"],
  "improvement_areas": ["Science"],
  "recommendations": "Based on your performance, a career in technology is a strong match. Focus on strengthening Science and building programming fundamentals.",
  "action_plan": "Step 1: Improve Science score above 70% within 2 months. Step 2: Complete an online Python course. Step 3: Build a small project.",
  "module_specific_advice": [
    {"module": "Mathematics", "current_performance": "Good at 72%", "improvement_strategy": "Practice advanced problem sets weekly", "career_relevance": "Essential for data science and engineering roles"}
  ]
}
RULES: suitability_score must be a number 0-100. All text fields must be plain readable sentences."""

class RAGEngine:
    def __init__(self):
        self.llm = _make_llm()

    async def _call_llm(self, system: str, user: str) -> str:
        response = await asyncio.wait_for(
            self.llm.ainvoke([SystemMessage(content=system), HumanMessage(content=user)]),
            timeout=LLM_TIMEOUT)
        return response.content

    async def generate_teacher_suggestions(self, performance_data: dict,
        specific_concerns: Optional[str]=None, focus_areas: Optional[list]=None) -> Dict[str,Any]:
        context   = _build_context(performance_data)
        knowledge = _get_knowledge("teaching strategies student performance improvement")
        concerns  = f"\nConcerns: {specific_concerns}" if specific_concerns else ""
        focus     = f"\nFocus: {', '.join(focus_areas)}" if focus_areas else ""
        kb        = f"\n\nReference:\n{knowledge}" if knowledge else ""
        user_prompt = f"Analyse this student and respond with JSON only:\n\n{context}{concerns}{focus}{kb}"
        response = None
        try:
            logger.info(f"Calling Ollama [{settings.llm_model}] for teacher suggestions…")
            raw_text = await self._call_llm(TEACHER_SYSTEM, user_prompt)
            logger.info("✅ Teacher suggestions received.")
            return _sanitize(_parse_json(raw_text))
        except json.JSONDecodeError:
            logger.warning("JSON parse failed — building fallback from performance data")
            mods = performance_data.get("modules",[])
            return _sanitize({
                "analysis": f"Student {performance_data.get('student_name','')} has an overall score of {performance_data.get('overall_percentage',0)}%. Review individual module performance for specific intervention areas.",
                "suggestions": "Focus on the lowest-scoring modules first. Schedule regular check-ins and provide targeted feedback on weak assessment areas.",
                "strength_areas": [m["module_name"] for m in mods if m.get("percentage",0)>=70],
                "improvement_areas": [m["module_name"] for m in mods if m.get("percentage",100)<60],
                "recommended_actions": [{"action":f"Review {m['module_name']} — currently at {m['percentage']}%","priority":"HIGH" if m.get("percentage",100)<50 else "MEDIUM","timeline":"This week","expected_impact":"Improved credit accumulation"} for m in mods if m.get("percentage",100)<70][:3],
                "performance_summary": {
                    "overall_status":("AT_RISK" if performance_data.get("overall_percentage",0)<35 else "NEEDS_IMPROVEMENT" if performance_data.get("overall_percentage",0)<50 else "AVERAGE" if performance_data.get("overall_percentage",0)<65 else "GOOD" if performance_data.get("overall_percentage",0)<80 else "EXCELLENT"),
                    "credit_utilization":f"Student earned {performance_data.get('overall_credits_earned',0)} of {performance_data.get('overall_total_credits',0)} credits",
                    "trend":"STABLE",
                },
            })
        except asyncio.TimeoutError:
            raise RuntimeError(f"Ollama timed out after {LLM_TIMEOUT//60} min. Make sure llama3.2:1b is pulled and ollama serve is running.")
        except Exception as e:
            logger.exception("Teacher suggestion failed"); traceback.print_exc(); raise

    async def generate_career_guidance(self, performance_data: dict,
        interests: Optional[list]=None, preferred_fields: Optional[list]=None) -> Dict[str,Any]:
        context   = _build_context(performance_data)
        knowledge = _get_knowledge("career paths education professional development")
        interests_txt = f"\nInterests: {', '.join(interests)}" if interests else ""
        fields_txt    = f"\nPreferred: {', '.join(preferred_fields)}" if preferred_fields else ""
        kb            = f"\n\nReference:\n{knowledge}" if knowledge else ""
        user_prompt   = f"Provide career guidance as JSON only:\n\n{context}{interests_txt}{fields_txt}{kb}"
        try:
            logger.info(f"Calling Ollama [{settings.llm_model}] for career guidance…")
            raw_text = await self._call_llm(CAREER_SYSTEM, user_prompt)
            logger.info("✅ Career guidance received.")
            result = _parse_json(raw_text)
            for p in result.get("career_paths",[]):
                try: p["suitability_score"] = int(float(str(p.get("suitability_score",70)).replace("%","")))
                except: p["suitability_score"] = 70
            return result
        except json.JSONDecodeError:
            overall = performance_data.get("overall_percentage",0)
            return {"career_paths":[{"career":"General Professional","suitability_score":int(overall),"reasoning":f"With an overall score of {overall}%, several career paths are available depending on your interests.","required_improvements":["Improve scores in weak modules"],"relevant_modules":[m["module_name"] for m in performance_data.get("modules",[])]}],
                    "strength_areas":[],"improvement_areas":[m["module_name"] for m in performance_data.get("modules",[]) if m.get("percentage",100)<60],
                    "recommendations":"Focus on improving your weakest module scores to open more career opportunities.","action_plan":"Step 1: Identify your weakest module. Step 2: Seek extra help from your teacher. Step 3: Review assessment feedback.","module_specific_advice":[]}
        except asyncio.TimeoutError:
            raise RuntimeError("Ollama timed out for career guidance.")
        except Exception as e:
            logger.error(f"Career guidance failed: {e}"); raise

    async def generate_full_report(self, performance_data: dict,
        teacher_comments: Optional[str]=None, teacher_suggestions: Optional[str]=None,
        include_career_guidance: bool=True) -> Dict[str,Any]:
        ai_result     = await self.generate_teacher_suggestions(performance_data)
        career_result = await self.generate_career_guidance(performance_data) if include_career_guidance else None
        sep = "="*60
        lines = [sep,"       EDURAGX STUDENT PERFORMANCE REPORT",sep,
            f"Student : {performance_data['student_name']}",
            f"Overall : {performance_data['overall_percentage']}%",
            f"Credits : {performance_data['overall_credits_earned']}/{performance_data['overall_total_credits']}",
            "",sep,"AI PERFORMANCE ANALYSIS",sep,ai_result.get("analysis",""),"",
            sep,"AI SUGGESTIONS",sep,ai_result.get("suggestions",""),""]
        for s in ai_result.get("strength_areas",[]): lines.append(f"  ✓ {s}")
        for i in ai_result.get("improvement_areas",[]): lines.append(f"  ⚠ {i}")
        for idx,act in enumerate(ai_result.get("recommended_actions",[]),1):
            lines.append(f"  {idx}. [{act.get('priority','')}] {act.get('action','')}")
        if teacher_comments: lines+=[sep,"TEACHER COMMENTS",sep,teacher_comments,""]
        if teacher_suggestions: lines+=[sep,"TEACHER SUGGESTIONS",sep,teacher_suggestions,""]
        if career_result: lines+=[sep,"CAREER GUIDANCE",sep,career_result.get("recommendations",""),"","ACTION PLAN:",career_result.get("action_plan",""),""]
        lines.append(sep)
        return {"ai_analysis":ai_result.get("analysis",""),"ai_suggestions":json.dumps(ai_result),"ai_career_guidance":json.dumps(career_result) if career_result else None,"final_report":"\n".join(lines),"performance_summary":ai_result.get("performance_summary",{})}

def get_rag_engine() -> RAGEngine:
    return RAGEngine()
