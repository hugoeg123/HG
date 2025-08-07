/**
 * Rotas de registros médicos
 * 
 * Define as rotas para gerenciamento de registros médicos
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Controlador de registros
const recordController = require('../controllers/record.controller');

// Obter registros por paciente
router.get('/patient/:patientId', authMiddleware, recordController.getPatientRecords);

// Obter registros por tag
router.get('/tag/:tagId', authMiddleware, recordController.getRecordsByTag);

// Obter registros por tipo
router.get('/type/:type', authMiddleware, recordController.getRecordsByType);

// Obter registro por ID
router.get('/:id', authMiddleware, recordController.getRecordById);

// Criar novo registro
router.post('/', 
  authMiddleware, 
  [
    body('patientId')
      .notEmpty().withMessage('ID do paciente é obrigatório')
      .isUUID().withMessage('ID do paciente deve ser um UUID válido'),
    body('title')
      .notEmpty().withMessage('Título é obrigatório')
      .isLength({ min: 1, max: 255 }).withMessage('Título deve ter entre 1 e 255 caracteres'),
    body('type')
      .notEmpty().withMessage('Tipo de registro é obrigatório')
      .isIn(['consulta', 'exame', 'procedimento', 'medicacao', 'observacao', 'outro', 'anamnese', 'evolucao'])
      .withMessage('Tipo de registro deve ser válido'),
    body('content')
      .notEmpty().withMessage('Conteúdo é obrigatório')
      .isLength({ min: 1 }).withMessage('Conteúdo não pode estar vazio'),
    body('date')
      .optional()
      .isISO8601().withMessage('Data deve estar no formato ISO 8601'),
    body('tags')
      .optional()
      .isArray().withMessage('Tags devem ser um array')
  ],
  recordController.createRecord
);

// Atualizar registro
router.put('/:id', 
  authMiddleware, 
  [
    body('title')
      .optional()
      .notEmpty().withMessage('Título não pode ser vazio')
      .isLength({ min: 1, max: 255 }).withMessage('Título deve ter entre 1 e 255 caracteres'),
    body('type')
      .optional()
      .notEmpty().withMessage('Tipo de registro não pode ser vazio')
      .isIn(['consulta', 'exame', 'procedimento', 'medicacao', 'observacao', 'outro'])
      .withMessage('Tipo de registro deve ser válido'),
    body('content')
      .optional()
      .notEmpty().withMessage('Conteúdo não pode ser vazio')
      .isLength({ min: 1 }).withMessage('Conteúdo não pode estar vazio'),
    body('date')
      .optional()
      .isISO8601().withMessage('Data deve estar no formato ISO 8601'),
    body('tags')
      .optional()
      .isArray().withMessage('Tags devem ser um array')
  ],
  recordController.updateRecord
);

// Excluir registro
router.delete('/:id', authMiddleware, recordController.deleteRecord);

module.exports = router;