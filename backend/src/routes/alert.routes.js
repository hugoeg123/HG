/**
 * Rotas para gerenciamento de alertas
 * 
 * Endpoints para operações CRUD de alertas do sistema
 * 
 * Conector: Integra com controllers/alert.controller.js
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const alertController = require('../controllers/alert.controller');

// Validações para criação de alertas
const createAlertValidation = [
  body('message')
    .notEmpty()
    .withMessage('Mensagem é obrigatória')
    .isLength({ min: 1, max: 500 })
    .withMessage('Mensagem deve ter entre 1 e 500 caracteres'),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severidade deve ser: low, medium, high ou critical'),
  body('record_id')
    .optional()
    .isUUID()
    .withMessage('ID do registro deve ser um UUID válido')
];

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// GET /api/alerts - Listar alertas do usuário (requer role medico ou admin)
router.get('/', authorize(['medico', 'admin']), alertController.list);

// GET /api/alerts/unread-count - Contar alertas não lidos
router.get('/unread-count', alertController.getUnreadCount);

// GET /api/alerts/:id - Obter alerta específico
router.get('/:id', alertController.getById);

// POST /api/alerts - Criar novo alerta
router.post('/', createAlertValidation, alertController.create);

// PUT /api/alerts/:id/read - Marcar alerta como lido
router.put('/:id/read', alertController.markAsRead);

// PUT /api/alerts/mark-all-read - Marcar todos os alertas como lidos
router.put('/mark-all-read', alertController.markAllAsRead);

// DELETE /api/alerts/:id - Deletar alerta
router.delete('/:id', alertController.delete);

module.exports = router;