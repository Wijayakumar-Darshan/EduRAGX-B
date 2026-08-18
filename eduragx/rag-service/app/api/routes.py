from fastapi import APIRouter, HTTPException, Response
from datetime import datetime
import json, uuid, logging
from app.models.schemas import (
    TeacherSuggestionRequest, TeacherSuggestionResponse,
    CareerGuidanceRequest, CareerGuidanceResponse,
    ReportGenerationRequest, ReportGenerationResponse,
    DocumentUploadRequest, HealthCheckResponse)
from app.core.rag_engine import get_rag_engine
from app.core.vector_store import get_vector_store
from app.services.performance_analyzer import PerformanceAnalyzer
from app.services.report_generator import PDFReportGenerator

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    vs = get_vector_store()
    return HealthCheckResponse(status="healthy", vector_store_status="connected",
        document_count=vs.get_document_count(), timestamp=datetime.now())

@router.post("/teacher/suggestions", response_model=TeacherSuggestionResponse)
async def generate_teacher_suggestions(request: TeacherSuggestionRequest):
    try:
        engine   = get_rag_engine()
        perf     = request.performance_data.dict()
        result   = await engine.generate_teacher_suggestions(perf, request.specific_concerns, request.focus_areas)
        analyzer = PerformanceAnalyzer()
        patterns = analyzer.identify_patterns(request.performance_data)
        return TeacherSuggestionResponse(
            student_id=request.student_id,
            ai_analysis=result.get("analysis",""),
            ai_suggestions=result.get("suggestions",""),
            performance_summary=result.get("performance_summary", patterns),
            strength_areas=result.get("strength_areas", patterns.get("strengths",[])),
            improvement_areas=result.get("improvement_areas", patterns.get("weaknesses",[])),
            recommended_actions=result.get("recommended_actions",[]),
            generated_at=datetime.now())
    except Exception as e:
        logger.error(f"Teacher suggestions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/student/career-guidance", response_model=CareerGuidanceResponse)
async def generate_career_guidance(request: CareerGuidanceRequest):
    try:
        result = await get_rag_engine().generate_career_guidance(
            request.performance_data.dict(), request.interests, request.preferred_fields)
        return CareerGuidanceResponse(
            student_id=request.student_id,
            career_paths=result.get("career_paths",[]),
            strength_areas=result.get("strength_areas",[]),
            improvement_areas=result.get("improvement_areas",[]),
            recommendations=result.get("recommendations",""),
            action_plan=result.get("action_plan",""),
            module_specific_advice=result.get("module_specific_advice",[]),
            generated_at=datetime.now())
    except Exception as e:
        logger.error(f"Career guidance error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/report/generate", response_model=ReportGenerationResponse)
async def generate_report(request: ReportGenerationRequest):
    try:
        perf   = request.performance_data.dict()
        result = await get_rag_engine().generate_full_report(
            perf, request.teacher_comments, request.teacher_suggestions, request.include_career_guidance)
        return ReportGenerationResponse(
            report_id=str(uuid.uuid4()), student_id=request.student_id, teacher_id=request.teacher_id,
            ai_analysis=result["ai_analysis"], ai_suggestions=result["ai_suggestions"],
            ai_career_guidance=result.get("ai_career_guidance"),
            teacher_comments=request.teacher_comments, teacher_suggestions=request.teacher_suggestions,
            final_report=result["final_report"], status="AI_GENERATED", generated_at=datetime.now())
    except Exception as e:
        logger.error(f"Report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/report/pdf")
async def generate_pdf(request: ReportGenerationRequest):
    try:
        perf   = request.performance_data.dict()
        result = await get_rag_engine().generate_full_report(
            perf, request.teacher_comments, request.teacher_suggestions, request.include_career_guidance)
        result["teacher_comments"]    = request.teacher_comments
        result["teacher_suggestions"] = request.teacher_suggestions
        result["report_period"]       = request.report_period
        pdf_bytes = PDFReportGenerator().generate_pdf(result, perf)
        name      = perf.get("student_name","student").replace(" ","_")
        filename  = f"EduRAGX_Report_{name}_{datetime.now().strftime('%Y%m%d')}.pdf"
        return Response(content=pdf_bytes, media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'})
    except Exception as e:
        logger.error(f"PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/student/performance-analysis")
async def analyze_performance(request: CareerGuidanceRequest):
    try:
        analyzer = PerformanceAnalyzer()
        patterns = analyzer.identify_patterns(request.performance_data)
        plan     = analyzer.generate_credit_improvement_plan(request.performance_data)
        return {"student_id":request.student_id,"patterns":patterns,"credit_improvement_plan":plan,"analyzed_at":datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/knowledge-base/add")
async def add_document(request: DocumentUploadRequest):
    try:
        vs  = get_vector_store()
        ids = vs.add_text(request.content, {"title":request.title,"category":request.category,**(request.metadata or {})})
        return {"status":"success","document_ids":ids,"message":f"Document '{request.title}' added"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/knowledge-base/stats")
async def knowledge_base_stats():
    return {"total_documents":get_vector_store().get_document_count(),"status":"active"}
