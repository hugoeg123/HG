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
    body('patientId').notEmpty().withMessage('ID do paciente é obrigatório'),
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('type').notEmpty().withMessage('Tipo de registro é obrigatório'),
    body('content').notEmpty().withMessage('Conteúdo é obrigatório')
  ],
  recordController.createRecord
);

// Atualizar registro
router.put('/:id', 
  authMiddleware, 
  [
    body('title').optional().notEmpty().withMessage('Título não pode ser vazio'),
    body('type').optional().notEmpty().withMessage('Tipo de registro não pode ser vazio'),
    body('content').optional().notEmpty().withMessage('Conteúdo não pode ser vazio')
  ],
  recordController.updateRecord
);

// Excluir registro
router.delete('/:id', authMiddleware, recordController.deleteRecord);

module.exports = router;