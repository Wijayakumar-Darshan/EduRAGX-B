const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { anchorReport, verifyReport, getStudentBlockchainRecords, getBlockchainStatus, getAllBlockchainRecords } = require('../controllers/blockchain.controller');

router.use(authenticate);
router.get('/status',                            getBlockchainStatus);
router.post('/anchor',     authorize('TEACHER','ADMIN'), anchorReport);
router.post('/verify',                           verifyReport);
router.get('/student/:studentId/records',        getStudentBlockchainRecords);
router.get('/records',     authorize('ADMIN'),   getAllBlockchainRecords);

module.exports = router;
