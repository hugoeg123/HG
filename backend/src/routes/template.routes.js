/**
 * Rotas de templates
 * 
 * Define as rotas para gerenciamento de templates de registros médicos
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Controlador de templates
const templateController = require('../controllers/template.controller');

// Obter todos os templates
router.get('/', authMiddleware, templateController.getAllTemplates);

// Obter templates por tipo
router.get('/type/:type', authMiddleware, templateController.getTemplatesByType);

// Obter template por ID
router.get('/:id', authMiddleware, templateController.getTemplateById);

// Criar novo template
router.post('/', 
  authMiddleware, 
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('type').notEmpty().withMessage('Tipo é obrigatório'),
    body('sections').isArray().withMessage('Seções devem ser um array')
  ],
  templateController.createTemplate
);

// Atualizar template
router.put('/:id', 
  authMiddleware, 
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('type').optional().notEmpty().withMessage('Tipo não pode ser vazio'),
    body('sections').optional().isArray().withMessage('Seções devem ser um array')
  ],
  templateController.updateTemplate
);

// Excluir template
router.delete('/:id', authMiddleware, templateController.deleteTemplate);

// Desativar template
router.put('/:id/deactivate', authMiddleware, templateController.deactivateTemplate);

// Ativar template
router.put('/:id/activate', authMiddleware, templateController.activateTemplate);

module.exports = router;