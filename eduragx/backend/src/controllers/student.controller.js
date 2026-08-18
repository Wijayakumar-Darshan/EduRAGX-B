const prisma = require('../prisma');

const getGrade = p => p>=90?'A+':p>=85?'A':p>=80?'A-':p>=75?'B+':p>=70?'B':p>=65?'B-':p>=60?'C+':p>=55?'C':p>=50?'C-':p>=40?'D':'F';

const getRoadmap = async (req, res) => {
  try {
    const studentId = req.user.id;
    const modules = await prisma.module.findMany({
      where: { studentModules: { some: { studentId } } },
      include: {
        topics: {
          include: { assessments: { include: { performances: { where: { studentId } } } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    const roadmap = modules.map(module => {
      const topics = module.topics.map(topic => {
        const assessments = topic.assessments.map(a => {
          const perf = a.performances[0] || null;
          return { ...a, completed: !!perf, score: perf?.score ?? null, feedback: perf?.feedback ?? null };
        });
        const done = assessments.filter(a => a.completed).length;
        const avg  = done ? assessments.filter(a => a.completed).reduce((s,a) => s+a.score, 0)/done : 0;
        return { ...topic, assessments, progress: assessments.length ? (done/assessments.length)*100 : 0, avgScore: Math.round(avg*10)/10 };
      });
      const all  = topics.flatMap(t => t.assessments);
      const done = all.filter(a => a.completed).length;
      return { ...module, topics, progress: all.length ? (done/all.length)*100 : 0, completed: done, total: all.length };
    });
    res.json(roadmap);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getMyPerformance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const performances = await prisma.performance.findMany({
      where: { studentId },
      include: { assessment: { include: { topic: { include: { module: true } } } } },
      orderBy: { submittedAt: 'desc' },
    });
    const moduleMap = {};
    performances.forEach(p => {
      const mid = p.assessment.topic.module.id;
      if (!moduleMap[mid]) moduleMap[mid] = { id:mid, title:p.assessment.topic.module.title, scores:[] };
      moduleMap[mid].scores.push(p.score);
    });
    const moduleAverages = Object.values(moduleMap).map(m => ({
      ...m, avg: Math.round(m.scores.reduce((a,b)=>a+b,0)/m.scores.length*10)/10,
    }));
    res.json({ performances, moduleAverages });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id:true,name:true,email:true,role:true,profilePicture:true,createdAt:true },
    });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const uploadProfilePicture = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });
    if (!imageBase64.startsWith('data:image/')) return res.status(400).json({ error: 'Must be a valid image data URL' });
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data:  { profilePicture: imageBase64 },
      select:{ id:true,name:true,email:true,role:true,profilePicture:true },
    });
    res.json({ success:true, profilePicture:user.profilePicture, user });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getCVData = async (req, res) => {
  try {
    const studentId = req.user.id;
    const [student, performances, blockchainRecords] = await Promise.all([
      prisma.user.findUnique({ where:{ id:studentId }, select:{ id:true,name:true,email:true,profilePicture:true,createdAt:true } }),
      prisma.performance.findMany({ where:{ studentId }, include:{ assessment:{ include:{ topic:{ include:{ module:true } } } } }, orderBy:{ submittedAt:'desc' } }),
      prisma.blockchainRecord.findMany({ where:{ studentId }, orderBy:{ createdAt:'desc' } }).catch(() => []),
    ]);

    const moduleMap = {};
    performances.forEach(p => {
      const mid = p.assessment.topic.module.id;
      if (!moduleMap[mid]) moduleMap[mid] = { title:p.assessment.topic.module.title, scores:[], assessments:[] };
      moduleMap[mid].scores.push(p.score);
      moduleMap[mid].assessments.push({ title:p.assessment.title, score:p.score, maxScore:p.assessment.maxScore, creditValue:p.assessment.creditValue });
    });

    const modules = Object.values(moduleMap).map(m => ({
      title: m.title,
      avgScore: m.scores.length ? Math.round(m.scores.reduce((a,b)=>a+b,0)/m.scores.length*10)/10 : 0,
      assessmentsDone: m.assessments.length,
      grade: getGrade(m.scores.length ? m.scores.reduce((a,b)=>a+b,0)/m.scores.length : 0),
      assessments: m.assessments,
    }));

    const overallAvg = performances.length ? Math.round(performances.reduce((s,p)=>s+p.score,0)/performances.length*10)/10 : 0;
    res.json({ student, overallAvg, overallGrade:getGrade(overallAvg), totalAssessments:performances.length, modules, blockchainVerified:blockchainRecords.length>0, blockchainRecords });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getRoadmap, getMyPerformance, getProfile, uploadProfilePicture, getCVData };
