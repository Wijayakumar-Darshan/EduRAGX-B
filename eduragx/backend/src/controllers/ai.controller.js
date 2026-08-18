const prisma = require('../prisma');
const axios  = require('axios');

const RAG_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

// ── Build performance payload for RAG service ─────────────────────────────────
const buildPerformancePayload = async (studentId) => {
  const student = await prisma.user.findUnique({
    where:  { id: Number(studentId) },
    select: { id: true, name: true },
  });
  if (!student) return null;

  const modules = await prisma.module.findMany({
    where: { studentModules: { some: { studentId: Number(studentId) } } },
    include: {
      topics: {
        include: {
          assessments: {
            include: { performances: { where: { studentId: Number(studentId) } } },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  let totalMarks = 0, totalMax = 0, totalCreditsEarned = 0, totalCredits = 0;

  const moduleList = modules.map(m => {
    let modMarks = 0, modMax = 0, modCreditsEarned = 0, modTotalCredits = 0;

    const assessments = m.topics.flatMap(t =>
      t.assessments.map(a => {
        const perf        = a.performances[0] || null;
        const score       = perf ? perf.score : null;
        const creditValue = a.creditValue;
        const maxScore    = a.maxScore;
        const creditEarned = (score !== null && maxScore > 0)
          ? Math.round((score / maxScore) * creditValue * 100) / 100 : null;

        modTotalCredits += creditValue;
        if (score !== null) { modMarks += score; modMax += maxScore; }
        if (creditEarned !== null) modCreditsEarned += creditEarned;

        return { title: a.title, max_marks: maxScore, credit_value: creditValue, marks_obtained: score, credit_earned: creditEarned };
      })
    );

    const percentage = modMax > 0 ? Math.round((modMarks / modMax) * 10000) / 100 : 0;
    totalMarks += modMarks; totalMax += modMax;
    totalCreditsEarned += modCreditsEarned; totalCredits += modTotalCredits;

    return {
      module_name: m.title, percentage,
      credits_earned: Math.round(modCreditsEarned * 100) / 100,
      total_credits: modTotalCredits, assessments,
    };
  });

  return {
    student_id: String(student.id), student_name: student.name,
    overall_percentage:     totalMax > 0 ? Math.round((totalMarks / totalMax) * 10000) / 100 : 0,
    overall_credits_earned: Math.round(totalCreditsEarned * 100) / 100,
    overall_total_credits:  totalCredits,
    modules: moduleList,
  };
};

// ── Sanitize AI result: convert to human-readable strings ─────────────────────
const sanitizeResult = (data) => {
  const ps = data.performance_summary || {};

  // Fix priority values like "HIGH|MEDIUM|LOW" → first value
  const actions = (data.recommended_actions || []).map(act => {
    let p = String(act.priority || 'MEDIUM');
    if (p.includes('|')) p = p.split('|')[0].trim();
    if (!['HIGH','MEDIUM','LOW'].includes(p)) p = 'MEDIUM';
    return { ...act, priority: p };
  });

  // Fix overall_status
  let status = String(ps.overall_status || 'AVERAGE');
  const validStatuses = ['EXCELLENT','GOOD','AVERAGE','NEEDS_IMPROVEMENT','AT_RISK'];
  if (!validStatuses.includes(status)) {
    for (const s of status.split('|')) { if (validStatuses.includes(s.trim())) { status = s.trim(); break; } }
    if (!validStatuses.includes(status)) status = 'AVERAGE';
  }

  // Fix credit_utilization — must be a plain string
  let cu = ps.credit_utilization || '';
  if (typeof cu !== 'string') cu = String(cu);

  // Fix trend
  let trend = String(ps.trend || 'STABLE');
  if (!['IMPROVING','STABLE','DECLINING'].includes(trend)) trend = 'STABLE';

  // Fix strength_areas / improvement_areas
  let sa = data.strength_areas || [];
  if (typeof sa === 'string') sa = sa.toLowerCase() === 'none' ? [] : [sa];
  let ia = data.improvement_areas || [];
  if (typeof ia === 'string') ia = ia ? [ia] : [];

  return {
    ...data,
    strength_areas:    sa,
    improvement_areas: ia,
    recommended_actions: actions,
    performance_summary: { ...ps, overall_status: status, credit_utilization: cu, trend },
  };
};

// ── Student AI chat ───────────────────────────────────────────────────────────
const studentAssistant = async (req, res) => {
  try {
    const { question, interests } = req.body;
    const perfData = await buildPerformancePayload(req.user.id);
    if (!perfData) return res.status(404).json({ error: 'Student not found' });

    const ragRes = await axios.post(
      `${RAG_URL}/api/rag/student/career-guidance`,
      {
        student_id: String(req.user.id), performance_data: perfData,
        interests: interests ? [interests] : [],
        preferred_fields: question ? [question] : [],
      },
      { timeout: 600000 }
    );

    const data = ragRes.data;
    // Return plain English — not raw JSON
    const answer = data.recommendations ||
      'Review your lowest-scoring modules first and focus on practising assessment topics where you scored below 60%.';

    res.json({ answer, career_paths: data.career_paths || [], action_plan: data.action_plan || '' });
  } catch (err) {
    console.error('AI assistant error:', err.message);
    res.json({ answer: 'The AI assistant is temporarily unavailable. Please make sure the RAG service is running on port 8000 and Ollama is running with the llama3.2:1b model.' });
  }
};

// ── Teacher AI recommendations ────────────────────────────────────────────────
const teacherRecommendations = async (req, res) => {
  try {
    const { studentId } = req.params;
    const perfData = await buildPerformancePayload(studentId);
    if (!perfData) return res.status(404).json({ error: 'Student not found' });

    if (perfData.modules.length === 0) {
      return res.json({
        studentName: perfData.student_name,
        insights: {
          overall:       `No performance data available yet for ${perfData.student_name}. Grade some assessments to see AI analysis.`,
          suggestions:   '',
          weakAreas:     [],
          strengths:     [],
          interventions: [],
          riskLevel:     'UNKNOWN',
        },
        performanceSummary:  {},
        recommendedActions:  [],
      });
    }

    const ragRes = await axios.post(
      `${RAG_URL}/api/rag/teacher/suggestions`,
      { student_id: String(studentId), teacher_id: String(req.user.id), performance_data: perfData },
      { timeout: 600000 }
    );

    const raw     = ragRes.data;
    const cleaned = sanitizeResult(raw);

    res.json({
      studentName: perfData.student_name,
      insights: {
        overall:       cleaned.ai_analysis  || '',
        suggestions:   cleaned.ai_suggestions || '',
        weakAreas:     (cleaned.improvement_areas || []).map(a => ({ area: a, suggestion: 'Schedule focused review sessions for this module' })),
        strengths:     cleaned.strength_areas   || [],
        interventions: (cleaned.recommended_actions || []).map(a => a.action || ''),
        riskLevel:     cleaned.performance_summary?.overall_status || 'UNKNOWN',
      },
      performanceSummary:  cleaned.performance_summary  || {},
      recommendedActions:  cleaned.recommended_actions  || [],
      performanceData:     perfData,
    });
  } catch (err) {
    console.error('Teacher AI error:', err.message);
    res.json({
      studentName: '',
      insights: {
        overall:       'AI analysis is temporarily unavailable. Make sure the RAG service is running on port 8000 and Ollama is running.',
        suggestions:   '',
        weakAreas: [], strengths: [], interventions: [], riskLevel: 'UNKNOWN',
      },
      performanceSummary: {}, recommendedActions: [],
    });
  }
};

// ── Career guidance ───────────────────────────────────────────────────────────
const careerGuidance = async (req, res) => {
  try {
    const { interests, preferred_fields } = req.body;
    const perfData = await buildPerformancePayload(req.user.id);
    if (!perfData) return res.status(404).json({ error: 'Student not found' });

    const ragRes = await axios.post(
      `${RAG_URL}/api/rag/student/career-guidance`,
      { student_id: String(req.user.id), performance_data: perfData, interests: interests || [], preferred_fields: preferred_fields || [] },
      { timeout: 600000 }
    );

    const data = ragRes.data;
    res.json({
      careers: (data.career_paths || []).map(p => ({
        title: p.career, match: typeof p.suitability_score === 'number' ? p.suitability_score : 70,
        why: p.reasoning || '', nextSteps: p.required_improvements || [], requiredSkills: p.relevant_modules || [],
      })),
      summary:      data.recommendations || '',
      action_plan:  data.action_plan     || '',
      module_advice:data.module_specific_advice || [],
    });
  } catch (err) {
    console.error('Career AI error:', err.message);
    res.json({ careers: [], summary: 'Career guidance is temporarily unavailable. Make sure the RAG service is running.' });
  }
};

// ── PDF report ────────────────────────────────────────────────────────────────
const generateReport = async (req, res) => {
  try {
    const { studentId, teacherComments, teacherSuggestions, includeCareer, reportPeriod } = req.body;
    const perfData = await buildPerformancePayload(studentId);
    if (!perfData) return res.status(404).json({ error: 'Student not found' });

    const ragRes = await axios.post(
      `${RAG_URL}/api/rag/report/pdf`,
      {
        student_id: String(studentId), teacher_id: String(req.user.id),
        performance_data: perfData, teacher_comments: teacherComments || '',
        teacher_suggestions: teacherSuggestions || '',
        include_career_guidance: includeCareer !== false,
        report_period: reportPeriod || '',
      },
      { timeout: 600000, responseType: 'arraybuffer' }
    );

    const name     = perfData.student_name.replace(/\s+/g, '_');
    const date     = new Date().toISOString().slice(0,10).replace(/-/g,'');
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="EduRAGX_Report_${name}_${date}.pdf"` });
    res.send(Buffer.from(ragRes.data));
  } catch (err) {
    console.error('Report error:', err.message);
    res.status(500).json({ error: 'Report generation failed. Make sure the RAG service is running.' });
  }
};

// ── XAI explainability (local — no AI needed) ────────────────────────────────
const explainPerformance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const perfData = await buildPerformancePayload(studentId);
    if (!perfData) return res.json({ explanation: 'No data to explain yet.', featureImportance: [] });

    const features = perfData.modules.map(m => ({
      feature:     m.module_name,
      score:       m.percentage,
      creditRatio: m.total_credits > 0 ? Math.round((m.credits_earned / m.total_credits) * 100) : 0,
      impact:      m.percentage < 60 ? 'HIGH' : m.percentage < 80 ? 'MEDIUM' : 'LOW',
    })).sort((a, b) => a.score - b.score);

    const lowest = features[0];
    const explanation = lowest
      ? `This student's biggest challenge is ${lowest.feature} at ${lowest.score}%. This module has the highest impact on overall performance and requires immediate attention.`
      : 'Insufficient data to generate an explanation.';

    res.json({ explanation, featureImportance: features });
  } catch (err) {
    res.json({ explanation: 'XAI analysis unavailable.', featureImportance: [] });
  }
};

module.exports = { studentAssistant, teacherRecommendations, careerGuidance, explainPerformance, generateReport };
