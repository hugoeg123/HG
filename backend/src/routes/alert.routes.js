/**
 * Rotas de alertas
 * 
 * Define as rotas para gerenciamento de alertas
 */

const express = require('express');
const router = express.Router();

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Controlador de alertas (será implementado posteriormente)
const alertController = {};

// Rota temporária para evitar erros
router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Rota de alertas funcionando' });
});

module.exports = router;