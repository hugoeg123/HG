/**
 * Rotas: Tag History
 * 
 * Exponha histórico por tag agregando múltiplas fontes.
 * 
 * Connector:
 * - Controller: controllers/tagHistory.controller.js
 * - Middleware: auth (protege endpoints)
 */

const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/authorize');
const { authMiddleware } = require('../middleware/auth');
const tagHistoryController = require('../controllers/tagHistory.controller');

// GET /api/tag-history/:tagKey?patientId=...&start=...&end=...&limit=...
router.get('/:tagKey', authMiddleware, authorize(['medico', 'patient', 'admin', 'enfermeira']), tagHistoryController.getHistory);

module.exports = router;