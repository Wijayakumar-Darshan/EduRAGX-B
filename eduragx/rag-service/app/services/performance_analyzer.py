from typing import Dict, List, Any
import numpy as np
from app.models.schemas import StudentPerformanceData

class PerformanceAnalyzer:
    @staticmethod
    def get_grade_letter(p: float) -> str:
        if p>=90: return "A+"
        elif p>=85: return "A"
        elif p>=80: return "A-"
        elif p>=75: return "B+"
        elif p>=70: return "B"
        elif p>=65: return "B-"
        elif p>=60: return "C+"
        elif p>=55: return "C"
        elif p>=50: return "C-"
        elif p>=40: return "D"
        else: return "F"

    @staticmethod
    def identify_patterns(performance_data: StudentPerformanceData) -> Dict[str, Any]:
        scores = [m.percentage for m in performance_data.modules]
        avg    = float(np.mean(scores)) if scores else 0.0
        std    = float(np.std(scores))  if len(scores)>1 else 0.0
        sorted_mods = sorted(performance_data.modules, key=lambda m: m.percentage, reverse=True)
        strengths   = [m.module_name for m in sorted_mods if m.percentage >= avg+5]
        weaknesses  = [m.module_name for m in sorted_mods if m.percentage <  avg-5]
        overall = performance_data.overall_percentage
        status  = ("EXCELLENT" if overall>=80 else "GOOD" if overall>=65 else "AVERAGE" if overall>=50 else "NEEDS_IMPROVEMENT" if overall>=35 else "AT_RISK")
        return {"overall_status":status,"average_performance":round(avg,2),"consistency_score":round(max(0.0,100-std),2),"strengths":strengths,"weaknesses":weaknesses,"grade":PerformanceAnalyzer.get_grade_letter(overall)}

    @staticmethod
    def generate_credit_improvement_plan(performance_data: StudentPerformanceData) -> List[Dict[str, Any]]:
        improvements = []
        for module in performance_data.modules:
            total = module.total_credits or 0
            if total == 0: continue
            earned = module.credits_earned or 0
            ratio  = earned/total
            if ratio < 0.7:
                weak = []
                for a in module.assessments:
                    if a.get("marks_obtained") is not None:
                        max_m = a.get("max_marks",0) or 0
                        pct   = (a["marks_obtained"]/max_m*100) if max_m>0 else 0
                        if pct < 60:
                            cv = a.get("credit_value") or a.get("credit_earned") or 0
                            weak.append({"title":a.get("title","Unknown"),"score_percentage":round(pct,1),"credit_value":cv,"potential_credit_gain":round(cv*max(0,0.8-pct/100),2)})
                weak.sort(key=lambda x: x["potential_credit_gain"], reverse=True)
                improvements.append({"module":module.module_name,"current_credit_percentage":round(ratio*100,1),"target_credit_percentage":80,"weak_assessments":weak[:3],"priority":"HIGH" if ratio<0.5 else "MEDIUM"})
        improvements.sort(key=lambda x: 0 if x["priority"]=="HIGH" else 1)
        return improvements
