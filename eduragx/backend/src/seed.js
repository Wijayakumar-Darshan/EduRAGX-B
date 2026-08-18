const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EduRAGX database...');
  const pass = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({ where:{email:'admin@eduragx.com'},    update:{}, create:{name:'Admin User',       email:'admin@eduragx.com',    password:pass,role:'ADMIN'} });
  const t1=await prisma.user.upsert({ where:{email:'teacher1@eduragx.com'},update:{}, create:{name:'Dr. Sarah Johnson', email:'teacher1@eduragx.com',password:pass,role:'TEACHER'} });
  const t2=await prisma.user.upsert({ where:{email:'teacher2@eduragx.com'},update:{}, create:{name:'Prof. Michael Chen',email:'teacher2@eduragx.com',password:pass,role:'TEACHER'} });
  const s1=await prisma.user.upsert({ where:{email:'student1@eduragx.com'},update:{}, create:{name:'Alex Rivera',      email:'student1@eduragx.com',password:pass,role:'STUDENT'} });
  const s2=await prisma.user.upsert({ where:{email:'student2@eduragx.com'},update:{}, create:{name:'Emma Wilson',      email:'student2@eduragx.com',password:pass,role:'STUDENT'} });
  const p1=await prisma.user.upsert({ where:{email:'parent1@eduragx.com'}, update:{}, create:{name:'James Rivera',     email:'parent1@eduragx.com', password:pass,role:'PARENT'} });
  const p2=await prisma.user.upsert({ where:{email:'parent2@eduragx.com'}, update:{}, create:{name:'Linda Wilson',     email:'parent2@eduragx.com', password:pass,role:'PARENT'} });

  await prisma.parentStudent.createMany({ data:[{parentId:p1.id,studentId:s1.id},{parentId:p2.id,studentId:s2.id}], skipDuplicates:true });

  const m1=await prisma.module.upsert({where:{id:1},update:{},create:{id:1,title:'Mathematics Fundamentals',   description:'Core mathematical concepts'}});
  const m2=await prisma.module.upsert({where:{id:2},update:{},create:{id:2,title:'Introduction to Computer Science',description:'Programming basics'}});
  const m3=await prisma.module.upsert({where:{id:3},update:{},create:{id:3,title:'English Literature',          description:'Reading comprehension and literary analysis'}});

  await Promise.all([
    prisma.topic.upsert({where:{id:1},update:{},create:{id:1,moduleId:1,title:'Algebra Basics',        order:1}}),
    prisma.topic.upsert({where:{id:2},update:{},create:{id:2,moduleId:1,title:'Geometry',              order:2}}),
    prisma.topic.upsert({where:{id:3},update:{},create:{id:3,moduleId:1,title:'Calculus Introduction', order:3}}),
    prisma.topic.upsert({where:{id:4},update:{},create:{id:4,moduleId:2,title:'Variables & Data Types',order:1}}),
    prisma.topic.upsert({where:{id:5},update:{},create:{id:5,moduleId:2,title:'Control Flow',          order:2}}),
    prisma.topic.upsert({where:{id:6},update:{},create:{id:6,moduleId:2,title:'Functions & Recursion', order:3}}),
    prisma.topic.upsert({where:{id:7},update:{},create:{id:7,moduleId:3,title:'Poetry Analysis',       order:1}}),
    prisma.topic.upsert({where:{id:8},update:{},create:{id:8,moduleId:3,title:'Prose & Narrative',     order:2}}),
  ]);

  await Promise.all([
    prisma.assessment.upsert({where:{id:1},update:{},create:{id:1,topicId:1,title:'Algebra Quiz 1',    creditValue:10,maxScore:100}}),
    prisma.assessment.upsert({where:{id:2},update:{},create:{id:2,topicId:1,title:'Algebra Assignment', creditValue:15,maxScore:100}}),
    prisma.assessment.upsert({where:{id:3},update:{},create:{id:3,topicId:2,title:'Geometry Test',      creditValue:20,maxScore:100}}),
    prisma.assessment.upsert({where:{id:4},update:{},create:{id:4,topicId:4,title:'Coding Exercise 1',  creditValue:10,maxScore:100}}),
    prisma.assessment.upsert({where:{id:5},update:{},create:{id:5,topicId:5,title:'If/Else Problems',   creditValue:15,maxScore:100}}),
    prisma.assessment.upsert({where:{id:6},update:{},create:{id:6,topicId:7,title:'Poem Essay',         creditValue:25,maxScore:100}}),
  ]);

  await prisma.studentModule.createMany({data:[{studentId:s1.id,moduleId:m1.id},{studentId:s1.id,moduleId:m2.id},{studentId:s2.id,moduleId:m2.id},{studentId:s2.id,moduleId:m3.id}],skipDuplicates:true});
  await prisma.teacherModule.createMany({data:[{teacherId:t1.id,moduleId:m1.id},{teacherId:t1.id,moduleId:m2.id},{teacherId:t2.id,moduleId:m3.id}],skipDuplicates:true});

  await prisma.performance.createMany({data:[
    {studentId:s1.id,assessmentId:1,score:85,feedback:'Great work on linear equations!'},
    {studentId:s1.id,assessmentId:2,score:72,feedback:'Review factoring methods.'},
    {studentId:s1.id,assessmentId:3,score:91,feedback:'Excellent geometry skills!'},
    {studentId:s1.id,assessmentId:4,score:60,feedback:'Practice variable scoping.'},
    {studentId:s2.id,assessmentId:4,score:95,feedback:'Outstanding!'},
    {studentId:s2.id,assessmentId:5,score:88,feedback:'Good understanding of loops.'},
    {studentId:s2.id,assessmentId:6,score:78,feedback:'Improve your thesis statements.'},
  ],skipDuplicates:true});

  console.log('\n✅ Seed complete! All password: password123');
  console.log('  Admin:   admin@eduragx.com');
  console.log('  Teacher: teacher1@eduragx.com → teaches Alex (Math+CS)');
  console.log('  Teacher: teacher2@eduragx.com → teaches Emma (English)');
  console.log('  Student: student1@eduragx.com → Alex Rivera');
  console.log('  Student: student2@eduragx.com → Emma Wilson');
  console.log('  Parent:  parent1@eduragx.com  → James Rivera (Alex\'s parent)');
  console.log('  Parent:  parent2@eduragx.com  → Linda Wilson (Emma\'s parent)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
