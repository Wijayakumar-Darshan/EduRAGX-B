const bcrypt = require('bcryptjs');
const prisma = require('../prisma');

// ── USERS ─────────────────────────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const users = await prisma.user.findMany({
      where: role ? { role } : {},
      select: {
        id:true, name:true, email:true, role:true, createdAt:true,
        studentModules: { include:{ module:true } },
        teacherModules: { include:{ module:true } },
        myChildren:     { include:{ student:{ select:{ id:true,name:true,email:true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, moduleIds=[], studentId } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'name, email, password, role required' });
    const existing = await prisma.user.findUnique({ where:{ email } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name, email, password:hashed, role,
        ...(role==='STUDENT' && moduleIds.length>0 && { studentModules:{ create: moduleIds.map(id=>({moduleId:Number(id)})) } }),
        ...(role==='TEACHER' && moduleIds.length>0 && { teacherModules:{ create: moduleIds.map(id=>({moduleId:Number(id)})) } }),
        ...(role==='PARENT'  && studentId && { myChildren:{ create:[{ studentId:Number(studentId) }] } }),
      },
      include: { studentModules:{ include:{ module:true } }, teacherModules:{ include:{ module:true } }, myChildren:{ include:{ student:{ select:{ id:true,name:true,email:true } } } } },
    });
    const { password:_, ...safe } = user;
    res.status(201).json(safe);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, moduleIds, studentId } = req.body;
    const updateData = {};
    if (name)     updateData.name = name;
    if (email)    updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({ where:{ id:Number(id) }, data:updateData, select:{ id:true,name:true,email:true,role:true } });

    if (moduleIds !== undefined) {
      if (user.role === 'STUDENT') {
        await prisma.studentModule.deleteMany({ where:{ studentId:user.id } });
        if (moduleIds.length>0) await prisma.studentModule.createMany({ data: moduleIds.map(mid=>({studentId:user.id,moduleId:Number(mid)})) });
      } else if (user.role === 'TEACHER') {
        await prisma.teacherModule.deleteMany({ where:{ teacherId:user.id } });
        if (moduleIds.length>0) await prisma.teacherModule.createMany({ data: moduleIds.map(mid=>({teacherId:user.id,moduleId:Number(mid)})) });
      }
    }

    if (user.role === 'PARENT' && studentId !== undefined) {
      await prisma.parentStudent.deleteMany({ where:{ parentId:user.id } });
      if (studentId) await prisma.parentStudent.create({ data:{ parentId:user.id, studentId:Number(studentId) } });
    }

    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteUser = async (req, res) => {
  try { await prisma.user.delete({ where:{ id:Number(req.params.id) } }); res.json({ message:'User deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

const getStudents = async (req, res) => {
  try {
    const students = await prisma.user.findMany({ where:{ role:'STUDENT' }, select:{ id:true,name:true,email:true }, orderBy:{ name:'asc' } });
    res.json(students);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── MODULES ───────────────────────────────────────────────────────────────────

const getAllModules = async (req, res) => {
  try {
    const modules = await prisma.module.findMany({
      include: {
        topics:{ include:{ assessments:true }, orderBy:{ order:'asc' } },
        studentModules:{ include:{ student:{ select:{ id:true,name:true,email:true } } } },
        teacherModules:{ include:{ teacher:{ select:{ id:true,name:true,email:true } } } },
      },
      orderBy: { createdAt:'desc' },
    });
    res.json(modules);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const createModule = async (req, res) => {
  try {
    const { title, description, studentIds=[], teacherIds=[] } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const module = await prisma.module.create({
      data: { title, description, studentModules:{ create:studentIds.map(id=>({studentId:Number(id)})) }, teacherModules:{ create:teacherIds.map(id=>({teacherId:Number(id)})) } },
      include: { topics:true, studentModules:true, teacherModules:true },
    });
    res.status(201).json(module);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateModule = async (req, res) => {
  try { const module = await prisma.module.update({ where:{ id:Number(req.params.id) }, data:{ title:req.body.title, description:req.body.description } }); res.json(module); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteModule = async (req, res) => {
  try { await prisma.module.delete({ where:{ id:Number(req.params.id) } }); res.json({ message:'Module deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

// ── TOPICS ────────────────────────────────────────────────────────────────────

const createTopic = async (req, res) => {
  try {
    const { moduleId, title, order=0 } = req.body;
    if (!moduleId || !title) return res.status(400).json({ error: 'moduleId and title required' });
    const topic = await prisma.topic.create({ data:{ moduleId:Number(moduleId), title, order:Number(order) } });
    res.status(201).json(topic);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateTopic = async (req, res) => {
  try {
    const { title, order } = req.body;
    const topic = await prisma.topic.update({ where:{ id:Number(req.params.id) }, data:{ title, ...(order!==undefined&&{order:Number(order)}) } });
    res.json(topic);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteTopic = async (req, res) => {
  try { await prisma.topic.delete({ where:{ id:Number(req.params.id) } }); res.json({ message:'Topic deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

// ── ANALYTICS ─────────────────────────────────────────────────────────────────

const getAdminAnalytics = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalParents, totalModules, totalAssessments] = await Promise.all([
      prisma.user.count({ where:{ role:'STUDENT' } }),
      prisma.user.count({ where:{ role:'TEACHER' } }),
      prisma.user.count({ where:{ role:'PARENT' } }),
      prisma.module.count(),
      prisma.assessment.count(),
    ]);
    const modules = await prisma.module.findMany({ include:{ topics:{ include:{ assessments:{ include:{ performances:true } } } } } });
    const moduleStats = modules.map(m => {
      const allScores = m.topics.flatMap(t => t.assessments.flatMap(a => a.performances.map(p=>p.score)));
      const avg = allScores.length ? allScores.reduce((a,b)=>a+b,0)/allScores.length : 0;
      return { id:m.id, title:m.title, avgScore:Math.round(avg*10)/10, totalScores:allScores.length };
    });
    res.json({ totals:{ students:totalStudents, teachers:totalTeachers, parents:totalParents, modules:totalModules, assessments:totalAssessments }, moduleStats });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = {
  getAllUsers, createUser, updateUser, deleteUser, getStudents,
  getAllModules, createModule, updateModule, deleteModule,
  createTopic, updateTopic, deleteTopic,
  getAdminAnalytics,
};
