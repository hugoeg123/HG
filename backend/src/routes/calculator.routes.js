/**
 * Rotas de calculadoras médicas
 * 
 * Define as rotas para calculadoras médicas
 */

const express = require('express');
const router = express.Router();

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Controlador de calculadoras (será implementado posteriormente)
const calculatorController = {};

// Rota temporária para evitar erros
router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Rota de calculadoras médicas funcionando' });
});

module.exports = router;