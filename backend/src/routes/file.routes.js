/**
 * Rotas de upload de arquivos
 * 
 * Define endpoints para upload de avatares e currículos
 * 
 * Conector: Integra com controllers/file.controller.js e middleware de autenticação
 */

const express = require('express');
const router = express.Router();

// Importar controladores e middleware
const fileController = require('../controllers/file.controller');
const { authMiddleware } = require('../middleware/auth');

/**
 * POST /api/files/upload
 * Upload de arquivos (avatar e/ou currículo)
 * 
 * Hook: Usado pelo frontend Profile.jsx para enviar arquivos
 * Conector: Processa via file.controller.js e salva em /uploads
 */
router.post(
  '/upload',
  authMiddleware,
  fileController.uploadMiddleware,
  fileController.uploadFiles,
  fileController.handleMulterError
);

module.exports = router;