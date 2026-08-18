from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from io import BytesIO
from typing import Dict, Any
from datetime import datetime
import json, logging

logger = logging.getLogger(__name__)
PRIMARY=HexColor("#1a365d"); SECONDARY=HexColor("#2b6cb0"); ACCENT=HexColor("#3182ce")
LIGHT_BG=HexColor("#f7fafc"); BORDER=HexColor("#e2e8f0"); WHITE=HexColor("#ffffff"); GRAY=HexColor("#718096")

class PDFReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.styles.add(ParagraphStyle(name="RTitle",fontSize=22,textColor=PRIMARY,alignment=TA_CENTER,spaceAfter=8,fontName="Helvetica-Bold"))
        self.styles.add(ParagraphStyle(name="RSub",fontSize=13,textColor=SECONDARY,alignment=TA_CENTER,spaceAfter=4))
        self.styles.add(ParagraphStyle(name="RSection",fontSize=14,textColor=PRIMARY,fontName="Helvetica-Bold",spaceBefore=16,spaceAfter=8))
        self.styles.add(ParagraphStyle(name="RBody",fontSize=10,leading=15,alignment=TA_JUSTIFY,spaceAfter=6))
        self.styles.add(ParagraphStyle(name="RNote",fontSize=8,textColor=GRAY,alignment=TA_CENTER))

    def generate_pdf(self, report_data: Dict[str,Any], performance_data: Dict[str,Any]) -> bytes:
        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
        el  = []

        el += [Spacer(1,40), Paragraph("EduRAGX", self.styles["RTitle"]), Paragraph("Student Performance Report", self.styles["RSub"]), Spacer(1,24)]

        info = [["Student Name", performance_data.get("student_name","")],
                ["Overall Score", f"{performance_data.get('overall_percentage',0)}%"],
                ["Credits Earned", f"{performance_data.get('overall_credits_earned',0)} / {performance_data.get('overall_total_credits',0)}"],
                ["Report Date", datetime.now().strftime("%B %d, %Y")]]
        if report_data.get("report_period"): info.insert(1,["Report Period", report_data["report_period"]])
        t = Table(info, colWidths=[120,320])
        t.setStyle(TableStyle([("BACKGROUND",(0,0),(0,-1),LIGHT_BG),("TEXTCOLOR",(0,0),(0,-1),PRIMARY),("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),10),("PADDING",(0,0),(-1,-1),8),("GRID",(0,0),(-1,-1),0.5,BORDER),("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
        el += [t, PageBreak()]

        mods = performance_data.get("modules",[])
        if mods:
            el.append(Paragraph("Module Performance Summary", self.styles["RSection"]))
            rows = [["Module","Credits Earned","Total Credits","Score %","Grade"]]
            for mod in mods:
                m = mod if isinstance(mod,dict) else mod.dict()
                pct = m.get("percentage",0)
                from app.services.performance_analyzer import PerformanceAnalyzer
                rows.append([m.get("module_name",""), f"{m.get('credits_earned',0):.1f}", f"{m.get('total_credits',0):.1f}", f"{pct:.1f}%", PerformanceAnalyzer.get_grade_letter(pct)])
            mt = Table(rows, colWidths=[180,90,90,65,50])
            mt.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),PRIMARY),("TEXTCOLOR",(0,0),(-1,0),WHITE),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),9),("PADDING",(0,0),(-1,-1),6),("GRID",(0,0),(-1,-1),0.5,BORDER),("ALIGN",(1,0),(-1,-1),"CENTER"),("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,LIGHT_BG])]))
            el += [mt, Spacer(1,16)]

        analysis = report_data.get("ai_analysis","")
        if analysis:
            el.append(Paragraph("AI Performance Analysis", self.styles["RSection"]))
            for para in analysis.split("\n\n"):
                if para.strip(): el.append(Paragraph(para.strip(), self.styles["RBody"]))

        try: ai_sugg = json.loads(report_data.get("ai_suggestions","{}"))
        except: ai_sugg = {}
        sugg = ai_sugg.get("suggestions","")
        if sugg:
            el.append(Paragraph("AI Recommendations", self.styles["RSection"]))
            for para in sugg.split("\n\n"):
                if para.strip(): el.append(Paragraph(para.strip(), self.styles["RBody"]))

        actions = ai_sugg.get("recommended_actions",[])
        if actions:
            el.append(Paragraph("Recommended Actions", self.styles["RSection"]))
            act_rows = [["Action","Priority","Timeline","Expected Impact"]]
            for act in actions: act_rows.append([act.get("action",""),act.get("priority",""),act.get("timeline",""),act.get("expected_impact","")])
            at = Table(act_rows, colWidths=[165,60,80,150])
            at.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),SECONDARY),("TEXTCOLOR",(0,0),(-1,0),WHITE),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),8),("PADDING",(0,0),(-1,-1),5),("GRID",(0,0),(-1,-1),0.5,BORDER),("VALIGN",(0,0),(-1,-1),"TOP"),("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,LIGHT_BG])]))
            el.append(at)

        tc = report_data.get("teacher_comments"); ts = report_data.get("teacher_suggestions")
        if tc or ts: el.append(PageBreak())
        if tc:
            el.append(Paragraph("Teacher's Comments", self.styles["RSection"]))
            for p in tc.split("\n\n"):
                if p.strip(): el.append(Paragraph(p.strip(), self.styles["RBody"]))
        if ts:
            el.append(Paragraph("Teacher's Suggestions", self.styles["RSection"]))
            for p in ts.split("\n\n"):
                if p.strip(): el.append(Paragraph(p.strip(), self.styles["RBody"]))

        career_raw = report_data.get("ai_career_guidance")
        if career_raw:
            try: career = json.loads(career_raw)
            except: career = None
            if career:
                el.append(PageBreak())
                el.append(Paragraph("Career Guidance", self.styles["RSection"]))
                recs = career.get("recommendations","")
                if recs:
                    for p in recs.split("\n\n"):
                        if p.strip(): el.append(Paragraph(p.strip(), self.styles["RBody"]))
                paths = career.get("career_paths",[])
                if paths:
                    el.append(Paragraph("Suggested Career Paths", self.styles["RSection"]))
                    cp_rows = [["Career","Suitability %","Reasoning"]]
                    for p in paths[:5]: cp_rows.append([p.get("career",""),f"{p.get('suitability_score','')}%",p.get("reasoning","")])
                    ct = Table(cp_rows, colWidths=[120,80,255])
                    ct.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),ACCENT),("TEXTCOLOR",(0,0),(-1,0),WHITE),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),9),("PADDING",(0,0),(-1,-1),5),("GRID",(0,0),(-1,-1),0.5,BORDER),("VALIGN",(0,0),(-1,-1),"TOP"),("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,LIGHT_BG])]))
                    el.append(ct)

        el += [Spacer(1,24),
               Paragraph(f"Generated by EduRAGX AI System on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", self.styles["RNote"]),
               Paragraph("This report combines AI-powered analysis with teacher input.", self.styles["RNote"])]

        doc.build(el)
        pdf_bytes = buf.getvalue(); buf.close()
        return pdf_bytes
