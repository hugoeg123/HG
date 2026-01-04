const express = require('express');
const router = express.Router();
const anonymizationController = require('../controllers/AnonymizationController');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(authMiddleware);
router.use(authorize(['medico', 'admin']));

// Rota para obter dados anonimizados de um paciente
// GET /api/anonymization/patient/:id
router.get('/patient/:id', anonymizationController.getAnonymizedPatient);

module.exports = router;
