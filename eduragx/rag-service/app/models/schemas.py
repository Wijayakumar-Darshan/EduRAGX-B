from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AssessmentData(BaseModel):
    title: str
    marks_obtained: Optional[float] = None
    max_marks: float
    credit_earned: Optional[float] = None
    credit_value: Optional[float] = 0.0
    class Config: extra = "allow"

class ModulePerformance(BaseModel):
    module_name: str
    percentage: float
    credits_earned: float
    total_credits: float
    assessments: List[Dict[str, Any]]
    module_id: Optional[str] = ""
    module_code: Optional[str] = ""
    topic_name: Optional[str] = ""
    credits: Optional[int] = 0
    class Config: extra = "allow"

class StudentPerformanceData(BaseModel):
    student_id: str
    student_name: str
    overall_percentage: float
    overall_credits_earned: float
    overall_total_credits: float
    modules: List[ModulePerformance]
    grade_level: Optional[str] = ""
    section: Optional[str] = ""
    class Config: extra = "allow"

class TeacherSuggestionRequest(BaseModel):
    student_id: str
    teacher_id: str
    performance_data: StudentPerformanceData
    specific_concerns: Optional[str] = None
    focus_areas: Optional[List[str]] = None

class TeacherSuggestionResponse(BaseModel):
    student_id: str
    ai_analysis: str
    ai_suggestions: str
    performance_summary: Dict[str, Any]
    strength_areas: List[str]
    improvement_areas: List[str]
    recommended_actions: List[Dict[str, Any]]
    generated_at: datetime

class CareerGuidanceRequest(BaseModel):
    student_id: str
    performance_data: StudentPerformanceData
    interests: Optional[List[str]] = None
    preferred_fields: Optional[List[str]] = None

class CareerGuidanceResponse(BaseModel):
    student_id: str
    career_paths: List[Dict[str, Any]]
    strength_areas: List[str]
    improvement_areas: List[str]
    recommendations: str
    action_plan: str
    module_specific_advice: List[Dict[str, Any]]
    generated_at: datetime

class ReportGenerationRequest(BaseModel):
    student_id: str
    teacher_id: str
    performance_data: StudentPerformanceData
    teacher_comments: Optional[str] = None
    teacher_suggestions: Optional[str] = None
    include_career_guidance: bool = True
    report_period: Optional[str] = None

class ReportGenerationResponse(BaseModel):
    report_id: str
    student_id: str
    teacher_id: str
    ai_analysis: str
    ai_suggestions: str
    ai_career_guidance: Optional[str] = None
    teacher_comments: Optional[str] = None
    teacher_suggestions: Optional[str] = None
    final_report: str
    status: str
    generated_at: datetime

class DocumentUploadRequest(BaseModel):
    title: str
    content: str
    category: str
    metadata: Optional[Dict[str, Any]] = None

class HealthCheckResponse(BaseModel):
    status: str
    vector_store_status: str
    document_count: int
    timestamp: datetime
