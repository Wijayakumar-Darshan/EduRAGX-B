const prisma = require('../prisma');

const getTeacherModules = async (req, res) => {
  try {
    const modules = await prisma.module.findMany({
      where: { teacherModules: { some: { teacherId: req.user.id } } },
      include: {
        topics: {
          include: {
            assessments: {
              include: { performances: { include: { student: { select: { id:true,name:true,email:true } } } } },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    res.json(modules);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const createAssessment = async (req, res) => {
  try {
    const { topicId, title, description, creditValue=10, maxScore=100 } = req.body;
    if (!topicId || !title) return res.status(400).json({ error: 'topicId and title required' });
    const assessment = await prisma.assessment.create({
      data: { topicId:Number(topicId), title, description, creditValue:Number(creditValue), maxScore:Number(maxScore) },
    });
    res.status(201).json(assessment);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateAssessment = async (req, res) => {
  try {
    const { title, description, maxScore } = req.body;
    const assessment = await prisma.assessment.update({
      where: { id: Number(req.params.id) },
      data: { ...(title&&{title}), ...(description!==undefined&&{description}), ...(maxScore!==undefined&&{maxScore:Number(maxScore)}) },
    });
    res.json(assessment);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteAssessment = async (req, res) => {
  try {
    await prisma.assessment.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Assessment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateCredit = async (req, res) => {
  try {
    const { newValue, reason } = req.body;
    if (!reason || reason.trim().length < 10) return res.status(400).json({ error: 'Reason must be at least 10 characters' });
    if (newValue === undefined || isNaN(newValue)) return res.status(400).json({ error: 'newValue must be a number' });
    const assessment = await prisma.assessment.findUnique({ where: { id: Number(req.params.id) } });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    const [updated, log] = await prisma.$transaction([
      prisma.assessment.update({ where: { id: Number(req.params.id) }, data: { creditValue: Number(newValue) } }),
      prisma.creditChangeLog.create({ data: { assessmentId:Number(req.params.id), oldValue:assessment.creditValue, newValue:Number(newValue), reason:reason.trim(), changedById:req.user.id } }),
    ]);

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    await prisma.notification.createMany({ data: admins.map(a => ({ userId:a.id, title:'Credit Value Updated', type:'CREDIT_CHANGE', message:`Assessment "${assessment.title}" credit changed from ${assessment.creditValue} to ${newValue}. Reason: ${reason}` })) });
    const io = req.app.get('io');
    if (io) admins.forEach(a => io.to(`user_${a.id}`).emit('notification', { title:'Credit Value Updated', type:'CREDIT_CHANGE' }));
    res.json({ assessment: updated, log });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getCreditChangeLogs = async (req, res) => {
  try {
    const logs = await prisma.creditChangeLog.findMany({
      include: { assessment:{ include:{ topic:{ include:{ module:true } } } }, changedBy:{ select:{ name:true,email:true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const submitPerformance = async (req, res) => {
  try {
    const { studentId, assessmentId, score, feedback } = req.body;
    if (!studentId || !assessmentId || score===undefined) return res.status(400).json({ error: 'studentId, assessmentId, score required' });
    const performance = await prisma.performance.upsert({
      where: { studentId_assessmentId: { studentId:Number(studentId), assessmentId:Number(assessmentId) } },
      create: { studentId:Number(studentId), assessmentId:Number(assessmentId), score:Number(score), feedback },
      update: { score:Number(score), feedback },
      include: { assessment:{ include:{ topic:{ include:{ module:true } } } }, student:{ select:{ id:true,name:true } } },
    });
    const io = req.app.get('io');
    if (io) io.to(`user_${studentId}`).emit('feedbackReceived', { assessment:performance.assessment.title, score, feedback });
    await prisma.notification.create({ data: { userId:Number(studentId), title:'Assessment Feedback Received', type:'FEEDBACK', message:`You received ${score} on "${performance.assessment.title}".${feedback?` Feedback: ${feedback}`:''}` } });
    res.json(performance);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getStudentPerformances = async (req, res) => {
  try {
    const performances = await prisma.performance.findMany({
      where: { studentId: Number(req.params.studentId) },
      include: { assessment:{ include:{ topic:{ include:{ module:true } } } } },
      orderBy: { submittedAt: 'desc' },
    });
    const grouped = {};
    performances.forEach(p => {
      const mod = p.assessment.topic.module.title;
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(p);
    });
    res.json({ performances, grouped });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getTeacherStudents = async (req, res) => {
  try {
    const teacherModules = await prisma.teacherModule.findMany({ where:{ teacherId:req.user.id }, select:{ moduleId:true } });
    const moduleIds = teacherModules.map(tm => tm.moduleId);
    const students  = await prisma.user.findMany({
      where: { role:'STUDENT', studentModules:{ some:{ moduleId:{ in:moduleIds } } } },
      include: {
        studentModules: { include:{ module:true } },
        performances:   { include:{ assessment:{ include:{ topic:{ include:{ module:true } } } } } },
      },
    });
    res.json(students);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const replyParentFeedback = async (req, res) => {
  try {
    const { reply } = req.body;
    const feedback  = await prisma.parentFeedback.update({
      where: { id: Number(req.params.id) },
      data:  { reply },
      include: { parent:{ select:{ id:true,name:true } } },
    });
    const io = req.app.get('io');
    if (io) io.to(`user_${feedback.parent.id}`).emit('feedbackReply', { message:`Teacher replied: ${reply}` });
    res.json(feedback);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getParentFeedbacksForTeacher = async (req, res) => {
  try {
    const feedbacks = await prisma.parentFeedback.findMany({
      where: { teacherId: req.user.id },
      include: { parent:{ select:{ id:true,name:true,email:true } } },
      orderBy: { createdAt: 'desc' },
    });
    const enriched = await Promise.all(feedbacks.map(async fb => {
      const student = fb.studentId
        ? await prisma.user.findUnique({ where:{ id:fb.studentId }, select:{ name:true,email:true } })
        : null;
      return { ...fb, studentName: student?.name ?? null, studentEmail: student?.email ?? null };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const generateYearEndReport = async (req, res) => {
  try {
    const { studentId, teacherComments, year } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });

    const student = await prisma.user.findUnique({ where:{ id:Number(studentId) }, select:{ id:true,name:true,email:true } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const performances = await prisma.performance.findMany({
      where: { studentId: Number(studentId) },
      include: { assessment:{ include:{ topic:{ include:{ module:true } } } } },
      orderBy: { submittedAt: 'asc' },
    });

    const moduleMap = {};
    performances.forEach(p => {
      const mod = p.assessment.topic.module;
      if (!moduleMap[mod.id]) moduleMap[mod.id] = { moduleName:mod.title, scores:[], assessments:[] };
      moduleMap[mod.id].scores.push(p.score);
      moduleMap[mod.id].assessments.push({ title:p.assessment.title, score:p.score, maxScore:p.assessment.maxScore, feedback:p.feedback });
    });

    const modules    = Object.values(moduleMap).map(m => ({ ...m, avgScore: m.scores.length ? Math.round(m.scores.reduce((a,b)=>a+b,0)/m.scores.length*10)/10 : 0 }));
    const overallAvg = performances.length ? Math.round(performances.reduce((s,p)=>s+p.score,0)/performances.length*10)/10 : 0;

    let aiNarrative = '';
    try {
      const axios  = require('axios');
      const RAG_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';
      const perfPayload = {
        student_id: String(studentId), student_name: student.name,
        overall_percentage: overallAvg, overall_credits_earned: 0, overall_total_credits: 0,
        modules: modules.map(m => ({ module_name:m.moduleName, percentage:m.avgScore, credits_earned:0, total_credits:0,
          assessments: m.assessments.map(a => ({ title:a.title, marks_obtained:a.score, max_marks:a.maxScore })) })),
      };
      const ragRes = await axios.post(`${RAG_URL}/api/rag/teacher/suggestions`,
        { student_id:String(studentId), teacher_id:String(req.user.id), performance_data:perfPayload,
          specific_concerns: teacherComments || '', focus_areas:['year-end summary','class contribution'] },
        { timeout: 120000 });
      aiNarrative = ragRes.data?.ai_analysis || '';
    } catch { /* RAG offline — skip */ }

    res.json({ student, modules, overallAvg, performances:performances.length, aiNarrative, year:year||new Date().getFullYear(), teacherComments:teacherComments||'' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ALL functions defined above — exports at the bottom
module.exports = {
  getTeacherModules,
  createAssessment, updateAssessment, deleteAssessment,
  updateCredit, getCreditChangeLogs,
  submitPerformance, getStudentPerformances, getTeacherStudents,
  replyParentFeedback, getParentFeedbacksForTeacher,
  generateYearEndReport,
};
