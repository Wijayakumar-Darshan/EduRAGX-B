const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getMyChildren, getChildPerformance, getChildRoadmap, getChildTeachers, sendFeedback, getMyFeedbacks } = require('../controllers/parent.controller');

router.use(authenticate, authorize('PARENT'));
router.get('/children',                        getMyChildren);
router.get('/children/:studentId/performance', getChildPerformance);
router.get('/children/:studentId/roadmap',     getChildRoadmap);
router.get('/children/:studentId/teachers',    getChildTeachers);
router.post('/feedback',                       sendFeedback);
router.get('/feedback',                        getMyFeedbacks);

module.exports = router;
