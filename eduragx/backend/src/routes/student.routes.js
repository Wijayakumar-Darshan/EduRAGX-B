const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getRoadmap, getMyPerformance, getProfile, uploadProfilePicture, getCVData } = require('../controllers/student.controller');

router.use(authenticate);
router.get('/roadmap',          authorize('STUDENT'), getRoadmap);
router.get('/performance',      authorize('STUDENT'), getMyPerformance);
router.get('/profile',          getProfile);
router.put('/profile/picture',  authorize('STUDENT'), uploadProfilePicture);
router.get('/cv',               authorize('STUDENT'), getCVData);

module.exports = router;
