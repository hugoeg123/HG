/**
 * Roteador Principal da API
 * 
 * MISSÃO ZERO-DÉBITO: Centralização e organização de todas as rotas
 */

const express = require('express');
const router = express.Router();

// Importar rotas específicas
const authRoutes = require('./auth.routes');
const tagsRoutes = require('./tag.routes');
const patientRoutes = require('./patient.routes');
const recordRoutes = require('./record.routes');
const templateRoutes = require('./template.routes');
const calculatorRoutes = require('./calculator.routes');
const dynamicCalculatorRoutes = require('./dynamic-calculator.routes.js');
const alertRoutes = require('./alert.routes');
const fileRoutes = require('./file.routes');
const agendaRoutes = require('./agenda.routes');
const marketplaceRoutes = require('./marketplace.routes');
const patientInputRoutes = require('./patient-input.routes');
const tagHistoryRoutes = require('./tag-history.routes');
const aiRoutes = require('./ai.routes');
const knowledgeRoutes = require('./knowledge.routes');
const profileRoutes = require('./profile.routes');

// Logging centralizado via morgan em src/index.js; removido logger duplicado nas rotas.

// Middleware para headers de resposta padrão
router.use((req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Rota de health check
const { sequelize } = require('../models/sequelize');
router.get('/health', async (req, res) => {
  let db = 'unknown';
  try {
    if (global.isDbOffline) {
      db = 'disconnected (offline mode)';
    } else {
      // Timeout curto para health check
      const authPromise = sequelize.authenticate();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1000)
      );
      await Promise.race([authPromise, timeoutPromise]);
      db = 'connected';
    }
  } catch (e) {
    db = 'disconnected';
  }
  res.json({
    status: 'ok',
    db,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Registrar rotas específicas
router.use('/auth', authRoutes);
router.use('/tags', tagsRoutes);
router.use('/patients', patientRoutes);
router.use('/records', recordRoutes);
router.use('/templates', templateRoutes);
router.use('/calculators', calculatorRoutes);
router.use('/dynamic-calculators', dynamicCalculatorRoutes);
router.use('/alerts', alertRoutes);
router.use('/files', fileRoutes);
router.use('/agenda', agendaRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/patient-inputs', patientInputRoutes);
router.use('/tag-history', tagHistoryRoutes);
router.use('/tag-history', tagHistoryRoutes);
router.use('/ai', aiRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/', profileRoutes); // Profile routes are mounted at root level (e.g. /patients/:id/profile)

// Rota 404 para endpoints não encontrados
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros
router.use((error, req, res, next) => {
  console.error('Erro na API:', error);

  // Erro de validação do Sequelize
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: error.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }

  // Erro de constraint do Sequelize
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Violação de restrição única',
      details: error.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Erro de foreign key
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Referência inválida',
      details: 'O registro referenciado não existe'
    });
  }

  // Erro de sintaxe JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'JSON inválido',
      details: 'Verifique a sintaxe do JSON enviado'
    });
  }

  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack
    })
  });
});

module.exports = router;