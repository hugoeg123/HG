/**
 * Controller: Marketplace Público
 * 
 * Exponibiliza endpoints públicos para listagem de médicos e slots disponíveis.
 * 
 * Connectors:
 * - Usa modelos Sequelize: Medico, AvailabilitySlot
 * - Exposto por: routes/marketplace.routes.js sob prefixo /api/marketplace
 * - Consumido pelo frontend: services/marketplaceService.js e página Marketplace/DoctorsList.jsx
 * 
 * Hooks & Segurança:
 * - Filtra somente médicos com public_visibility=true
 * - Limita atributos retornados (não inclui senha_hash e dados sensíveis)
 * - Slots: somente status 'available' e por médico
 */

const { Op } = require('sequelize');
const { Medico, AvailabilitySlot } = require('../models/sequelize');

// Util: sanitizar paginação básica
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// GET /api/marketplace/medicos
async function listPublicMedicos(req, res) {
  try {
    const { q, specialty, professional_type } = req.query;
    const { limit, offset, page } = parsePagination(req.query);

    const where = { public_visibility: true };
    if (specialty) where.specialty = { [Op.iLike]: `%${specialty}%` };
    if (professional_type) where.professional_type = professional_type;
    if (q) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${q}%` } },
        { specialty: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { rows, count } = await Medico.findAndCountAll({
      where,
      attributes: [
        'id',
        'nome',
        'email', // usado apenas para contato; pode ser ocultado no futuro se necessário
        'professional_type',
        'specialty',
        'titulo_profissional',
        'biografia',
        'avatar_url',
        'curriculo_url',
        'formacao',
        'experiencias'
      ],
      order: [['nome', 'ASC']],
      limit,
      offset
    });

    return res.json({
      page,
      limit,
      total: count,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao listar médicos públicos:', error);
    return res.status(500).json({
      error: 'Erro interno ao listar médicos',
      code: 'MARKETPLACE_MEDICOS_ERROR'
    });
  }
}

// GET /api/marketplace/medicos/:id
async function getPublicMedicoById(req, res) {
  try {
    const { id } = req.params;
    const medico = await Medico.findOne({
      where: { id, public_visibility: true },
      attributes: [
        'id', 'nome', 'email', 'professional_type', 'specialty', 'titulo_profissional',
        'biografia', 'avatar_url', 'curriculo_url', 'formacao', 'experiencias'
      ]
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico não encontrado ou não público' });
    }

    return res.json(medico);
  } catch (error) {
    console.error('Erro ao obter médico público:', error);
    return res.status(500).json({
      error: 'Erro interno ao obter médico',
      code: 'MARKETPLACE_MEDICO_ERROR'
    });
  }
}

// GET /api/marketplace/slots?medico_id=...&start=...&end=...&modality=...
async function listAvailableSlots(req, res) {
  try {
    const { medico_id, start, end, modality } = req.query;
    if (!medico_id) {
      return res.status(400).json({ error: 'Parâmetro medico_id é obrigatório' });
    }

    const where = { medico_id, status: 'available' };
    if (start) where.start_time = { ...(where.start_time || {}), [Op.gte]: new Date(start) };
    if (end) where.end_time = { ...(where.end_time || {}), [Op.lte]: new Date(end) };
    if (modality) where.modality = modality;

    const slots = await AvailabilitySlot.findAll({
      where,
      attributes: ['id', 'medico_id', 'start_time', 'end_time', 'modality', 'location', 'notes'],
      order: [['start_time', 'ASC']]
    });

    return res.json(slots);
  } catch (error) {
    console.error('Erro ao listar slots disponíveis:', error);
    return res.status(500).json({
      error: 'Erro interno ao listar slots',
      code: 'MARKETPLACE_SLOTS_ERROR'
    });
  }
}

module.exports = {
  listPublicMedicos,
  getPublicMedicoById,
  listAvailableSlots
};