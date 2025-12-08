const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

router.get('/patients/:patientId/profile', ProfileController.getProfile);
router.post('/patients/:patientId/anthropometrics', ProfileController.addAnthropometrics);
router.post('/patients/:patientId/lifestyle', ProfileController.addLifestyle);
router.post('/patients/:patientId/conditions', ProfileController.addCondition);
router.put('/patients/:patientId/conditions/:conditionId', ProfileController.updateCondition);

module.exports = router;
