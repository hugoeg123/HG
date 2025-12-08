/**
 * Rotas de Agenda
 *
 * Define endpoints para gerenciamento de disponibilidades (slots) e agendamentos (appointments)
 * com validações via express-validator e proteção por autenticação JWT
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Controlador de agenda
const agendaController = require('../controllers/agenda.controller');

// Todas as rotas abaixo requerem autenticação
router.use(authMiddleware);

/**
 * Slots (disponibilidades)
 */

// GET /api/agenda/slots - Listar slots do médico logado com filtros
router.get(
  '/slots',
  [
    query('start').optional().isISO8601().withMessage('Parâmetro start deve ser uma data ISO válida'),
    query('end').optional().isISO8601().withMessage('Parâmetro end deve ser uma data ISO válida'),
    query('status').optional().isIn(['available', 'booked', 'blocked']).withMessage('Status inválido'),
    query('modality').optional().isIn(['presencial', 'telemedicina', 'domiciliar']).withMessage('Modalidade inválida')
  ],
  agendaController.getSlots
);

// POST /api/agenda/slots - Criar novo slot
router.post(
  '/slots',
  [
    body('start_time').notEmpty().isISO8601().withMessage('start_time é obrigatório e deve ser ISO8601'),
    body('end_time').notEmpty().isISO8601().withMessage('end_time é obrigatório e deve ser ISO8601'),
    body('modality').optional().isIn(['presencial', 'telemedicina', 'domiciliar']).withMessage('Modalidade inválida'),
    body('location').optional().isString().withMessage('location deve ser string'),
    body('notes').optional().isString().withMessage('notes deve ser string')
  ],
  agendaController.createSlot
);

// PUT /api/agenda/slots/:id - Atualizar slot
router.put(
  '/slots/:id',
  [
    param('id').isUUID().withMessage('ID do slot deve ser UUID válido'),
    body('start_time').optional().isISO8601().withMessage('start_time deve ser ISO8601'),
    body('end_time').optional().isISO8601().withMessage('end_time deve ser ISO8601'),
    body('status').optional().isIn(['available', 'booked', 'blocked']).withMessage('Status inválido'),
    body('modality').optional().isIn(['presencial', 'telemedicina', 'domiciliar']).withMessage('Modalidade inválida'),
    body('location').optional().isString().withMessage('location deve ser string'),
    body('notes').optional().isString().withMessage('notes deve ser string')
  ],
  agendaController.updateSlot
);

// DELETE /api/agenda/slots/:id - Remover slot
router.delete(
  '/slots/:id',
  [param('id').isUUID().withMessage('ID do slot deve ser UUID válido')],
  agendaController.deleteSlot
);

/**
 * Appointments (agendamentos)
 */

// GET /api/agenda/appointments - Listar agendamentos do médico logado
router.get(
  '/appointments',
  [
    query('status').optional().isIn(['booked', 'cancelled', 'completed', 'no_show']).withMessage('Status inválido'),
    query('patientId').optional().isUUID().withMessage('patientId deve ser UUID válido'),
    query('start').optional().isISO8601().withMessage('start deve ser ISO8601'),
    query('end').optional().isISO8601().withMessage('end deve ser ISO8601')
  ],
  agendaController.getAppointments
);

// GET /api/agenda/my-appointments - Listar agendamentos do paciente autenticado
router.get(
  '/my-appointments',
  [
    query('status').optional().isIn(['booked', 'cancelled', 'completed', 'no_show']).withMessage('Status inválido'),
    query('start').optional().isISO8601().withMessage('start deve ser ISO8601'),
    query('end').optional().isISO8601().withMessage('end deve ser ISO8601')
  ],
  agendaController.getMyAppointments
);

// POST /api/agenda/appointments - Criar agendamento
router.post(
  '/appointments',
  [
    body('slot_id').notEmpty().isUUID().withMessage('slot_id é obrigatório e deve ser UUID válido'),
    body('patient_id').notEmpty().isUUID().withMessage('patient_id é obrigatório e deve ser UUID válido'),
    body('notes').optional().isString().withMessage('notes deve ser string')
  ],
  agendaController.createAppointment
);

// PUT /api/agenda/appointments/:id - Atualizar agendamento
router.put(
  '/appointments/:id',
  [
    param('id').isUUID().withMessage('ID do agendamento deve ser UUID válido'),
    body('status').optional().isIn(['booked', 'cancelled', 'completed', 'no_show']).withMessage('Status inválido'),
    body('notes').optional().isString().withMessage('notes deve ser string')
  ],
  agendaController.updateAppointment
);

// DELETE /api/agenda/appointments/:id - Remover agendamento
router.delete(
  '/appointments/:id',
  [param('id').isUUID().withMessage('ID do agendamento deve ser UUID válido')],
  agendaController.deleteAppointment
);

module.exports = router;