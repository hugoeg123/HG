/**
 * Rotas de exportação
 * 
 * Define as rotas para exportação de dados
 */

const express = require('express');
const router = express.Router();

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Controlador de exportação (será implementado posteriormente)
const exportController = {};

// Rota temporária para evitar erros
router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Rota de exportação funcionando' });
});

module.exports = router;