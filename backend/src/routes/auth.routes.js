/**
 * Rotas de autenticação
 * 
 * Define as rotas para registro, login e gerenciamento de usuários
 * 
 * Conector: Integra com controllers/auth.controller.js para processamento das requisições
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Importar controladores
const authController = require('../controllers/auth.controller');

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Rota de registro de médico
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('professionalType').optional().isString().withMessage('Tipo profissional inválido'),
    body('professionalId').optional().isString().withMessage('ID profissional inválido'),
    body('specialty').optional().isString().withMessage('Especialidade inválida')
  ],
  authController.register
);

// Rota de login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
  ],
  authController.login
);

// Rota para obter médico atual
router.get('/me', authMiddleware, authController.getCurrentUser);

// Rota para atualizar perfil
router.put(
  '/profile',
  authMiddleware,
  [
    body('nome').optional().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
    body('email').optional().isEmail().withMessage('Email inválido'),
  ],
  authController.updateProfile
);

// Rota para alterar senha
router.put(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
    body('newPassword').isLength({ min: 6 }).withMessage('Nova senha deve ter pelo menos 6 caracteres')
  ],
  authController.changePassword
);

module.exports = router;