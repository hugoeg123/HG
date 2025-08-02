/**
 * Controlador de registros médicos
 * 
 * Gerencia operações CRUD para registros médicos
 * 
 * Conector: Integra com models/Record.js para operações de banco de dados
 */

const { validationResult } = require('express-validator');
const { Record, Patient, Tag } = require('../models');

// Obter todos os registros de um paciente
exports.getPatientRecords = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Verificar se o paciente existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }
    
    // Opções de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Opções de ordenação
    const sortField = req.query.sortField || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // Opções de filtro
    const where = { patientId, isDeleted: false };
    
    if (req.query.type) {
      where.type = req.query.type;
    }
    
    if (req.query.startDate && req.query.endDate) {
      const { Op } = require('sequelize');
      where.date = {
        [Op.gte]: new Date(req.query.startDate),
        [Op.lte]: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      const { Op } = require('sequelize');
      where.date = { [Op.gte]: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      const { Op } = require('sequelize');
      where.date = { [Op.lte]: new Date(req.query.endDate) };
    }
    
    if (req.query.search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { content: { [Op.iLike]: `%${req.query.search}%` } },
        { type: { [Op.iLike]: `%${req.query.search}%` } }
      ];
    }
    
    // Executar consulta
    const { count, rows: records } = await Record.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      limit,
      offset
    });
    
    res.json({
      records,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    res.status(500).json({ message: 'Erro ao buscar registros' });
  }
};

// Obter registro por ID
exports.getRecordById = async (req, res) => {
  try {
    const record = await Record.findOne({
      where: {
        id: req.params.id,
        isDeleted: false
      }
    });
    
    if (!record) {
      return res.status(404).json({ message: 'Registro não encontrado' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Erro ao buscar registro:', error);
    res.status(500).json({ message: 'Erro ao buscar registro' });
  }
};

// Criar novo registro
exports.createRecord = async (req, res) => {
  try {
    console.log('CreateRecord: req.user =', req.user); // Debug log
    
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { patientId, title, type, date, content, tags } = req.body;
    
    // Verificar se o paciente existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }
    
    // Verificar se as tags existem
    if (tags && tags.length > 0) {
      const tagIds = tags.map(tag => tag.tagId || tag.id);
      const { Op } = require('sequelize');
      const existingTags = await Tag.findAll({ where: { id: { [Op.in]: tagIds } } });
      
      if (existingTags.length !== tagIds.length) {
        return res.status(400).json({ message: 'Uma ou mais tags não existem' });
      }
    }
    
    // Criar registro
    const record = await Record.create({
      patientId,
      title,
      type,
      date: date || new Date(),
      content,
      tags: tags || [],
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    
    res.status(201).json({
      message: 'Registro criado com sucesso',
      record
    });
  } catch (error) {
    console.error('Erro ao criar registro:', error);
    res.status(500).json({ message: 'Erro ao criar registro' });
  }
};

// Atualizar registro
exports.updateRecord = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, type, date, content, tags } = req.body;
    
    // Verificar se as tags existem
    if (tags && tags.length > 0) {
      const tagIds = tags.map(tag => tag.tagId || tag.id);
      const { Op } = require('sequelize');
      const existingTags = await Tag.findAll({ where: { id: { [Op.in]: tagIds } } });
      
      if (existingTags.length !== tagIds.length) {
        return res.status(400).json({ message: 'Uma ou mais tags não existem' });
      }
    }
    
    // Buscar registro
    const record = await Record.findOne({
      where: {
        id: req.params.id,
        isDeleted: false
      }
    });
    
    if (!record) {
      return res.status(404).json({ message: 'Registro não encontrado' });
    }
    
    // Atualizar registro
    await record.update({
      title,
      type,
      date,
      content,
      tags,
      updatedBy: req.user.id
    });
    
    res.json({
      message: 'Registro atualizado com sucesso',
      record
    });
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    res.status(500).json({ message: 'Erro ao atualizar registro' });
  }
};

// Excluir registro (exclusão lógica)
exports.deleteRecord = async (req, res) => {
  try {
    const record = await Record.findOne({
      where: {
        id: req.params.id,
        isDeleted: false
      }
    });
    
    if (!record) {
      return res.status(404).json({ message: 'Registro não encontrado' });
    }
    
    await record.update({
      isDeleted: true,
      updatedBy: req.user.id
    });
    
    res.json({
      message: 'Registro excluído com sucesso',
      record
    });
  } catch (error) {
    console.error('Erro ao excluir registro:', error);
    res.status(500).json({ message: 'Erro ao excluir registro' });
  }
};

// Buscar registros por tag
exports.getRecordsByTag = async (req, res) => {
  try {
    const tagId = req.params.tagId;
    
    // Verificar se a tag existe
    const tag = await Tag.findByPk(tagId);
    if (!tag) {
      return res.status(404).json({ message: 'Tag não encontrada' });
    }
    
    // Opções de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Opções de ordenação
    const sortField = req.query.sortField || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // Filtro por tag
    const { Op } = require('sequelize');
    const where = {
      tags: {
        [Op.contains]: [{ tagId }]
      },
      isDeleted: false
    };
    
    // Adicionar filtro por paciente se fornecido
    if (req.query.patientId) {
      where.patientId = req.query.patientId;
    }
    
    // Executar consulta
    const { count, rows: records } = await Record.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      offset,
      limit
    });
    
    res.json({
      records,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar registros por tag:', error);
    res.status(500).json({ message: 'Erro ao buscar registros por tag' });
  }
};

// Buscar registros por tipo
exports.getRecordsByType = async (req, res) => {
  try {
    const type = req.params.type;
    
    // Opções de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Opções de ordenação
    const sortField = req.query.sortField || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // Filtro por tipo
    const where = { 
      type,
      isDeleted: false
    };
    
    // Adicionar filtro por paciente se fornecido
    if (req.query.patientId) {
      where.patientId = req.query.patientId;
    }
    
    // Executar consulta
    const { count, rows: records } = await Record.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      offset,
      limit
    });
    
    res.json({
      records,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar registros por tipo:', error);
    res.status(500).json({ message: 'Erro ao buscar registros por tipo' });
  }
};