const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { studentAssistant, teacherRecommendations, careerGuidance, explainPerformance, generateReport } = require('../controllers/ai.controller');

router.use(authenticate);
router.post('/assistant',               authorize('STUDENT','PARENT'), studentAssistant);
router.get('/recommendations/:studentId', authorize('TEACHER'),        teacherRecommendations);
router.post('/career',                  authorize('STUDENT'),          careerGuidance);
router.get('/explain/:studentId',       authorize('TEACHER','ADMIN'),  explainPerformance);
router.post('/report/generate',         authorize('TEACHER'),          generateReport);

module.exports = router;
