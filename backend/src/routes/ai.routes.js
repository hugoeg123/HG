/**
 * Rotas de IA
 * 
 * Define as rotas para funcionalidades de inteligência artificial
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

router.get('/models', aiController.getModels);
router.get('/health', aiController.health);

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Rotas de Contexto
router.get('/context', aiController.getContext);
router.post('/context', aiController.addContext);
router.delete('/context/:id', aiController.removeContext);
router.delete('/context', aiController.clearContext);

// Rota de Chat
router.post('/chat', aiController.chat);

module.exports = router;
