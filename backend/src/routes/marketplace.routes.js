/**
 * Rotas Públicas do Marketplace
 * 
 * Define endpoints públicos para:
 * - Listar médicos com visibilidade pública
 * - Obter médico público por ID
 * - Listar slots disponíveis por médico
 * 
 * Connector: Integrado em routes/index.js sob /api/marketplace
 * Security: Sem autenticação; somente dados públicos e slots 'available'
 */

const express = require('express');
const { query, param } = require('express-validator');
const router = express.Router();

const marketplaceController = require('../controllers/marketplace.controller');

// GET /api/marketplace/medicos - Listar médicos públicos com filtros
router.get(
  '/medicos',
  [
    query('q').optional().isString().trim(),
    query('specialty').optional().isString().trim(),
    query('professional_type').optional().isString().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  marketplaceController.listPublicMedicos
);

// GET /api/marketplace/medicos/:id - Detalhes públicos de um médico
router.get(
  '/medicos/:id',
  [param('id').isUUID().withMessage('ID deve ser UUID válido')],
  marketplaceController.getPublicMedicoById
);

// GET /api/marketplace/slots - Listar slots disponíveis de um médico
router.get(
  '/slots',
  [
    query('medico_id').notEmpty().isUUID().withMessage('medico_id é obrigatório e deve ser UUID'),
    query('start').optional().isISO8601().withMessage('start deve ser ISO8601'),
    query('end').optional().isISO8601().withMessage('end deve ser ISO8601'),
    query('modality').optional().isIn(['presencial', 'telemedicina', 'domiciliar']).withMessage('Modalidade inválida')
  ],
  marketplaceController.listAvailableSlots
);

module.exports = router;