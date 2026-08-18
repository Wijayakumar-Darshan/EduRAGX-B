const prisma = require('../prisma');

const assertLink = async (parentId, studentId) => {
  const link = await prisma.parentStudent.findUnique({
    where: { parentId_studentId: { parentId, studentId:Number(studentId) } },
  });
  if (!link) throw Object.assign(new Error('You are not linked to this student.'), { status:403 });
};

const getMyChildren = async (req, res) => {
  try {
    const links = await prisma.parentStudent.findMany({
      where: { parentId: req.user.id },
      include: { student: { select:{ id:true,name:true,email:true,profilePicture:true } } },
    });
    res.json(links.map(l => l.student));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getChildPerformance = async (req, res) => {
  try {
    await assertLink(req.user.id, req.params.studentId);
    const studentId = Number(req.params.studentId);
    const performances = await prisma.performance.findMany({
      where: { studentId },
      include: { assessment: { include: { topic: { include: { module: true } } } } },
      orderBy: { submittedAt: 'desc' },
    });
    const modMap = {};
    performances.forEach(p => {
      const mod = p.assessment.topic.module;
      if (!modMap[mod.id]) modMap[mod.id] = { moduleId:mod.id, moduleName:mod.title, scores:[], assessments:[] };
      modMap[mod.id].scores.push(p.score);
      modMap[mod.id].assessments.push({ id:p.id, title:p.assessment.title, topic:p.assessment.topic.title, score:p.score, maxScore:p.assessment.maxScore, creditValue:p.assessment.creditValue, creditEarned:p.assessment.maxScore>0?Math.round((p.score/p.assessment.maxScore)*p.assessment.creditValue*100)/100:0, feedback:p.feedback, submittedAt:p.submittedAt });
    });
    const modules    = Object.values(modMap).map(m => ({ ...m, avgScore: m.scores.length ? Math.round(m.scores.reduce((a,b)=>a+b,0)/m.scores.length*10)/10 : 0 }));
    const overallAvg = performances.length ? Math.round(performances.reduce((s,p)=>s+p.score,0)/performances.length*10)/10 : 0;
    res.json({ performances, modules, overallAvg });
  } catch (err) { res.status(err.status||500).json({ error: err.message }); }
};

const getChildRoadmap = async (req, res) => {
  try {
    await assertLink(req.user.id, req.params.studentId);
    const studentId = Number(req.params.studentId);
    const modules = await prisma.module.findMany({
      where: { studentModules: { some: { studentId } } },
      include: { topics: { include: { assessments: { include: { performances: { where: { studentId } } } } }, orderBy: { order:'asc' } } },
    });
    const roadmap = modules.map(mod => {
      const topics = mod.topics.map(t => {
        const assessments = t.assessments.map(a => { const perf=a.performances[0]||null; return { id:a.id,title:a.title,creditValue:a.creditValue,maxScore:a.maxScore,completed:!!perf,score:perf?.score??null,feedback:perf?.feedback??null }; });
        const done=assessments.filter(a=>a.completed).length; const avg=done?assessments.filter(a=>a.completed).reduce((s,a)=>s+a.score,0)/done:0;
        return { ...t, assessments, progress:assessments.length?(done/assessments.length)*100:0, avgScore:Math.round(avg*10)/10 };
      });
      const all=topics.flatMap(t=>t.assessments); const done=all.filter(a=>a.completed).length;
      return { ...mod, topics, progress:all.length?(done/all.length)*100:0, completed:done, total:all.length };
    });
    res.json(roadmap);
  } catch (err) { res.status(err.status||500).json({ error: err.message }); }
};

const getChildTeachers = async (req, res) => {
  try {
    await assertLink(req.user.id, req.params.studentId);
    const studentId = Number(req.params.studentId);
    const sm  = await prisma.studentModule.findMany({ where: { studentId }, select: { moduleId:true } });
    const mids = sm.map(m => m.moduleId);
    const tm   = await prisma.teacherModule.findMany({ where: { moduleId:{ in:mids } }, include: { teacher:{ select:{ id:true,name:true,email:true } }, module:{ select:{ id:true,title:true } } } });
    const map  = {};
    tm.forEach(t => { if (!map[t.teacherId]) map[t.teacherId]={ ...t.teacher,modules:[] }; map[t.teacherId].modules.push(t.module.title); });
    res.json(Object.values(map));
  } catch (err) { res.status(err.status||500).json({ error: err.message }); }
};

const sendFeedback = async (req, res) => {
  try {
    const { teacherId, studentId, message } = req.body;
    if (!teacherId || !studentId || !message?.trim()) return res.status(400).json({ error: 'teacherId, studentId and message required' });
    await assertLink(req.user.id, studentId);
    const student  = await prisma.user.findUnique({ where:{ id:Number(studentId) }, select:{ name:true } });
    const feedback = await prisma.parentFeedback.create({ data: { parentId:req.user.id, teacherId:Number(teacherId), studentId:Number(studentId), message:message.trim() } });
    const io = req.app.get('io');
    if (io) io.to(`user_${teacherId}`).emit('parentFeedback', { from:req.user.name, studentName:student?.name, message });
    await prisma.notification.create({ data: { userId:Number(teacherId), title:'New Parent Message', type:'PARENT_FEEDBACK', message:`${req.user.name} (parent of ${student?.name}) sent: "${message.substring(0,80)}${message.length>80?'…':''}"` } });
    res.status(201).json(feedback);
  } catch (err) { res.status(err.status||500).json({ error: err.message }); }
};

const getMyFeedbacks = async (req, res) => {
  try {
    const feedbacks = await prisma.parentFeedback.findMany({
      where: { parentId: req.user.id },
      include: { teacher: { select: { id:true,name:true,email:true } } },
      orderBy: { createdAt: 'desc' },
    });
    const enriched = await Promise.all(feedbacks.map(async fb => {
      const student = fb.studentId ? await prisma.user.findUnique({ where:{ id:fb.studentId }, select:{ name:true } }) : null;
      return { ...fb, studentName: student?.name ?? null };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getMyChildren, getChildPerformance, getChildRoadmap, getChildTeachers, sendFeedback, getMyFeedbacks };
