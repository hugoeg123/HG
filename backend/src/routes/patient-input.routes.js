/**
 * Rotas de Entradas de Saúde do Paciente
 *
 * Define endpoints para criação e listagem de PatientTagEntry
 *
 * Connectors:
 * - controllers/patientTag.controller.js
 * - middleware/auth.js e middleware/authorize.js
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const patientTagController = require('../controllers/patientTag.controller');

// Aplicar autenticação em todas as rotas e restringir a pacientes
router.use(authMiddleware, authorize(['patient']));

// GET /api/patient-inputs - Listar entradas do paciente autenticado
router.get('/', patientTagController.listMyEntries);

// GET /api/patient-inputs/:id - Obter entrada específica do paciente
router.get('/:id', patientTagController.getEntryById);

// POST /api/patient-inputs - Criar nova entrada de saúde
router.post(
  '/',
  [
    body('weight').optional({ checkFalsy: true }).isFloat({ min: 0, max: 500 }).withMessage('Peso inválido'),
    body('height').optional({ checkFalsy: true }).isFloat({ min: 0, max: 300 }).withMessage('Altura inválida'),
    body('notes').optional({ checkFalsy: true }).isString().withMessage('Notas inválidas')
  ],
  patientTagController.createEntry
);

module.exports = router;