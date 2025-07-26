/**
 * Rotas de IA
 * 
 * Define as rotas para funcionalidades de inteligência artificial
 */

const express = require('express');
const router = express.Router();

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Controlador de IA (será implementado posteriormente)
const aiController = {};

// Rota temporária para evitar erros
router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Rota de IA funcionando' });
});

module.exports = router;