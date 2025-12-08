/**
 * Rotas de IA
 * 
 * Define as rotas para funcionalidades de inteligência artificial
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas de Contexto
router.get('/context', aiController.getContext);
router.post('/context', aiController.addContext);
router.delete('/context/:id', aiController.removeContext);
router.delete('/context', aiController.clearContext);

// Rota de Chat
router.post('/chat', aiController.chat);

module.exports = router;