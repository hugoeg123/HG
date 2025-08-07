/**
 * Controlador de registros médicos
 * 
 * Gerencia operações CRUD para registros médicos
 * 
 * Conector: Integra com models/Record.js para operações de banco de dados
 */

const { validationResult } = require('express-validator');
const { Record, Patient, Tag } = require('../models');
const { Op } = require('sequelize');

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
    console.log('🔍 Debug - createRecord iniciado');
    console.log('📦 req.body completo:', JSON.stringify(req.body, null, 2));
    console.log('👤 req.user:', req.user);
    
    // Verificar erros de validação do express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      });
    }
    
    const { patientId, title, type, date, content, tags, attachments, metadata } = req.body;
    
    // Debug detalhado dos campos
    console.log('🔍 Campos extraídos:');
    console.log('  - patientId:', patientId, typeof patientId);
    console.log('  - title:', title, typeof title);
    console.log('  - type:', type, typeof type);
    console.log('  - content:', content, typeof content, 'length:', content?.length);
    console.log('  - date:', date);
    console.log('  - tags:', tags);
    console.log('  - attachments:', attachments);
    console.log('  - metadata:', metadata);
    
    // Verificar se req.user está definido
    if (!req.user || !req.user.id) {
      console.error('req.user não está definido ou não possui ID');
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }
    
    // Verificar se o paciente existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }
    
    // Verificar se as tags existem
    if (tags && tags.length > 0) {
      const tagIds = tags.map(tag => tag.tagId || tag.id);
      const existingTags = await Tag.findAll({ where: { id: { [Op.in]: tagIds } } });
      
      if (existingTags.length !== tagIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Uma ou mais tags não existem'
        });
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
      attachments: attachments || [],
      metadata: metadata || {},
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
    
    console.log('Registro criado com sucesso:', record.id);
    
    res.status(201).json({
      success: true,
      message: 'Registro criado com sucesso',
      data: record
    });
  } catch (error) {
    console.error('Erro ao criar registro:', error);
    
    // Verificar se é erro de validação do Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }))
      });
    }
    
    // Verificar se é erro de chave estrangeira
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Referência inválida - verifique se o paciente existe'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao criar registro'
    });
  }
};

// Atualizar registro
exports.updateRecord = async (req, res) => {
  try {
    console.log('Debug - updateRecord req.user:', req.user);
    
    // Verificar erros de validação do express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      });
    }
    
    // Verificar se req.user está definido
    if (!req.user || !req.user.id) {
      console.error('req.user não está definido ou não possui ID');
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }
    
    const { title, type, date, content, tags, attachments, metadata } = req.body;
    
    // Verificar se as tags existem
    if (tags && tags.length > 0) {
      const tagIds = tags.map(tag => tag.tagId || tag.id);
      const existingTags = await Tag.findAll({ where: { id: { [Op.in]: tagIds } } });
      
      if (existingTags.length !== tagIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Uma ou mais tags não existem'
        });
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
      return res.status(404).json({
        success: false,
        message: 'Registro não encontrado'
      });
    }
    
    // Preparar dados para atualização (apenas campos fornecidos)
    const updateData = {
      updatedBy: req.user.id
    };
    
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = date;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (metadata !== undefined) updateData.metadata = metadata;
    
    // Atualizar registro
    await record.update(updateData);
    
    console.log('Registro atualizado com sucesso:', record.id);
    
    res.json({
      success: true,
      message: 'Registro atualizado com sucesso',
      data: record
    });
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    
    // Verificar se é erro de validação do Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }))
      });
    }
    
    // Verificar se é erro de chave estrangeira
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Referência inválida'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao atualizar registro'
    });
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