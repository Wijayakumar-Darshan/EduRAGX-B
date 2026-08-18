const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  getAllUsers, createUser, updateUser, deleteUser, getStudents,
  getAllModules, createModule, updateModule, deleteModule,
  createTopic, updateTopic, deleteTopic,
  getAdminAnalytics,
} = require('../controllers/admin.controller');

router.use(authenticate, authorize('ADMIN'));

router.get('/users',        getAllUsers);
router.post('/users',       createUser);
router.put('/users/:id',    updateUser);
router.delete('/users/:id', deleteUser);
router.get('/students',     getStudents);

router.get('/modules',        getAllModules);
router.post('/modules',       createModule);
router.put('/modules/:id',    updateModule);
router.delete('/modules/:id', deleteModule);

router.post('/topics',       createTopic);
router.put('/topics/:id',    updateTopic);
router.delete('/topics/:id', deleteTopic);

router.get('/analytics', getAdminAnalytics);

module.exports = router;
