/**
 * Controlador de pacientes
 * 
 * Gerencia operações CRUD para pacientes
 * 
 * Conector: Integra com models/Patient.js para operações de banco de dados
 */

const { validationResult } = require('express-validator');
const { Patient } = require('../models');

// Obter todos os pacientes
exports.getAllPatients = async (req, res) => {
  try {
    console.log('getAllPatients - User from request:', req.user);
    
    // Opções de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Opções de ordenação
    const sortField = req.query.sortField || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    // Opções de filtro - incluir filtro por usuário
    const where = {};
    
    // Filtrar pacientes por usuário (se o campo createdBy existir)
    // Comentado temporariamente até que a relação seja estabelecida
    // if (req.user && req.user.id) {
    //   where.createdBy = req.user.id;
    // }
    
    if (req.query.search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.iLike]: `%${req.query.search}%` } },
        { email: { [Op.iLike]: `%${req.query.search}%` } },
        { phone: { [Op.iLike]: `%${req.query.search}%` } }
      ];
    }
    
    console.log('getAllPatients - Query where conditions:', where);
    
    // Executar consulta
    const { count, rows: patients } = await Patient.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      limit,
      offset
    });
    
    console.log('getAllPatients - Found patients count:', count);
    
    res.json({
      patients,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    res.status(500).json({ message: 'Erro ao buscar pacientes' });
  }
};

// Obter paciente por ID
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }
    
    res.json(patient);
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    res.status(500).json({ message: 'Erro ao buscar paciente' });
  }
};

// Criar novo paciente
exports.createPatient = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Verificar se o usuário está autenticado e tem um ID
    if (!req.user || !req.user.sub) {
      console.error('Erro ao criar paciente: Usuário não autenticado ou ID ausente.');
      return res.status(401).json({ message: 'Autenticação necessária para criar paciente.' });
    }

    // Criar paciente (removendo createdBy temporariamente para evitar erro de foreign key)
    const patient = await Patient.create({
      ...req.body
      // createdBy: req.user.sub // Comentado temporariamente
    });
    console.log(`Paciente criado por: ${req.user.sub}`);
    
    res.status(201).json(patient);
  } catch (error) {
    console.error('Erro ao criar paciente:', error.message, error.stack);
    res.status(500).json({ message: 'Erro ao criar paciente' });
  }
};

// Atualizar paciente
exports.updatePatient = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Buscar paciente
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }
    
    // Atualizar paciente
    await patient.update(req.body);
    
    res.json(patient);
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    res.status(500).json({ message: 'Erro ao atualizar paciente' });
  }
};

// Excluir paciente
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }
    
    await patient.destroy();
    
    res.json({
      message: 'Paciente excluído com sucesso',
      patient
    });
  } catch (error) {
    console.error('Erro ao excluir paciente:', error);
    res.status(500).json({ message: 'Erro ao excluir paciente' });
  }
};