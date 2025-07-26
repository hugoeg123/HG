/**
 * Rotas de tags
 * 
 * Define as rotas para gerenciamento de tags
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Controlador de tags
const tagController = require('../controllers/tag.controller');

// Obter todas as tags
router.get('/', authMiddleware, tagController.getAllTags);

// Obter tags raiz
router.get('/root', authMiddleware, tagController.getRootTags);

// Obter tag por ID
router.get('/:id', authMiddleware, tagController.getTagById);

// Obter tags filhas de uma tag
router.get('/:id/children', authMiddleware, tagController.getChildTags);

// Criar nova tag
router.post('/', 
  authMiddleware, 
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('displayName').notEmpty().withMessage('Nome de exibição é obrigatório'),
    body('valueType').isIn(['text', 'number', 'boolean', 'date', 'select', 'multiselect']).withMessage('Tipo de valor inválido'),
    body('category').optional().notEmpty().withMessage('Categoria não pode ser vazia')
  ],
  tagController.createTag
);

// Atualizar tag
router.put('/:id', 
  authMiddleware, 
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('displayName').optional().notEmpty().withMessage('Nome de exibição não pode ser vazio'),
    body('valueType').optional().isIn(['text', 'number', 'boolean', 'date', 'select', 'multiselect']).withMessage('Tipo de valor inválido')
  ],
  tagController.updateTag
);

// Excluir tag
router.delete('/:id', authMiddleware, tagController.deleteTag);

module.exports = router;