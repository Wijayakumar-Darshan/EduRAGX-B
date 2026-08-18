const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getTeacherModules,
  createAssessment, updateAssessment, deleteAssessment,
  updateCredit, getCreditChangeLogs,
  submitPerformance, getStudentPerformances, getTeacherStudents,
  replyParentFeedback, getParentFeedbacksForTeacher,
  generateYearEndReport,
} = require('../controllers/teacher.controller');

router.use(authenticate, authorize('TEACHER'));

router.get('/modules',                getTeacherModules);
router.post('/assessments',           createAssessment);
router.put('/assessments/:id',        updateAssessment);
router.delete('/assessments/:id',     deleteAssessment);
router.put('/assessments/:id/credit', updateCredit);
router.get('/credit-logs',            getCreditChangeLogs);
router.post('/performance',           submitPerformance);
router.get('/performance/:studentId', getStudentPerformances);
router.get('/students',               getTeacherStudents);
router.get('/parent-feedbacks',       getParentFeedbacksForTeacher);
router.put('/feedback/:id/reply',     replyParentFeedback);
router.post('/year-end-report',       generateYearEndReport);

module.exports = router;
