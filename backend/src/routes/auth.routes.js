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

// Rota para obter perfil completo
router.get('/profile', authMiddleware, authController.getProfile);

// Rota para atualizar perfil
router.put(
  '/profile',
  authMiddleware,
  [
    body('nome').optional({ checkFalsy: true }).isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido'),
    body('titulo_profissional').optional({ checkFalsy: true }).isLength({ max: 100 }).withMessage('Título profissional muito longo'),
    body('biografia').optional({ checkFalsy: true }).isLength({ max: 1000 }).withMessage('Biografia muito longa'),
    body('specialty').optional({ checkFalsy: true }).isString().withMessage('Especialidade inválida'),
    body('avatar_url')
      .optional({ checkFalsy: true })
      .isURL({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
      .withMessage('URL do avatar inválida'),
    body('curriculo_url')
      .optional({ checkFalsy: true })
      .isURL({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
      .withMessage('URL do currículo inválida')
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