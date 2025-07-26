/**
 * Rotas de pacientes
 * 
 * Define as rotas para gerenciamento de pacientes
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Middleware de autenticação
const { authMiddleware } = require('../middleware/auth');

// Controlador de pacientes
const patientController = require('../controllers/patient.controller');

// Obter todos os pacientes
router.get('/', authMiddleware, patientController.getAllPatients);

// Obter paciente por ID
router.get('/:id', authMiddleware, patientController.getPatientById);

// Criar novo paciente
router.post('/', 
  authMiddleware, 
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('dateOfBirth').notEmpty().withMessage('Data de nascimento é obrigatória'),
    body('gender').isIn(['masculino', 'feminino', 'outro', 'não informado']).withMessage('Gênero inválido')
  ],
  patientController.createPatient
);

// Atualizar paciente
router.put('/:id', 
  authMiddleware, 
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('dateOfBirth').optional().isISO8601().withMessage('Data de nascimento inválida'),
    body('gender').optional().isIn(['masculino', 'feminino', 'outro', 'não informado']).withMessage('Gênero inválido')
  ],
  patientController.updatePatient
);

// Excluir paciente
router.delete('/:id', authMiddleware, patientController.deletePatient);

module.exports = router;