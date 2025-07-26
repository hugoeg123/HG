/**
 * Controlador de templates
 * 
 * Gerencia operações CRUD para templates de registros médicos
 * 
 * Conector: Integra com models/Template.js para operações de banco de dados
 */

const { validationResult } = require('express-validator');
const { Template } = require('../models');

// Obter todos os templates
exports.getAllTemplates = async (req, res) => {
  try {
    // Opções de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Opções de ordenação
    const sortField = req.query.sortField || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    // Opções de filtro
    const { Op } = require('sequelize');
    const where = { isActive: true };
    
    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${req.query.search}%` } },
        { description: { [Op.iLike]: `%${req.query.search}%` } }
      ];
    }
    
    if (req.query.type) {
      where.recordType = req.query.type;
    }
    
    // Incluir templates inativos se solicitado
    if (req.query.includeInactive === 'true') {
      delete where.isActive;
    }
    
    // Executar consulta
    const { count, rows: templates } = await Template.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      offset,
      limit
    });
    
    // Garantir que sempre retornamos um array
    const safeTemplates = Array.isArray(templates) ? templates : [];
    
    res.json({
      data: safeTemplates, // Mudança para compatibilidade com frontend
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    // Sempre retornar um array vazio em caso de erro
    res.status(200).json({ 
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      },
      message: 'Nenhum template encontrado'
    });
  }
};

// Obter template por ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template não encontrado' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    res.status(500).json({ message: 'Erro ao buscar template' });
  }
};

// Criar novo template
exports.createTemplate = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Verificar se já existe um template com o mesmo nome
    const existingTemplate = await Template.findOne({ where: { name: req.body.name } });
    if (existingTemplate) {
      return res.status(400).json({ message: 'Já existe um template com este nome' });
    }
    
    // Criar template
    const template = await Template.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      message: 'Template criado com sucesso',
      template
    });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    res.status(500).json({ message: 'Erro ao criar template' });
  }
};

// Atualizar template
exports.updateTemplate = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Verificar se já existe outro template com o mesmo nome
    if (req.body.name) {
      const { Op } = require('sequelize');
      const existingTemplate = await Template.findOne({ 
        where: {
          name: req.body.name,
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existingTemplate) {
        return res.status(400).json({ message: 'Já existe outro template com este nome' });
      }
    }
    
    // Buscar template
    const template = await Template.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template não encontrado' });
    }
    
    // Atualizar template
    await template.update(req.body);
    
    res.json({
      message: 'Template atualizado com sucesso',
      template
    });
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    res.status(500).json({ message: 'Erro ao atualizar template' });
  }
};

// Excluir template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template não encontrado' });
    }
    
    await template.destroy();
    
    res.json({
      message: 'Template excluído com sucesso',
      template
    });
  } catch (error) {
    console.error('Erro ao excluir template:', error);
    res.status(500).json({ message: 'Erro ao excluir template' });
  }
};

// Desativar template
exports.deactivateTemplate = async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template não encontrado' });
    }
    
    await template.update({ isActive: false });
    
    res.json({
      message: 'Template desativado com sucesso',
      template
    });
  } catch (error) {
    console.error('Erro ao desativar template:', error);
    res.status(500).json({ message: 'Erro ao desativar template' });
  }
};

// Ativar template
exports.activateTemplate = async (req, res) => {
  try {
    const template = await Template.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template não encontrado' });
    }
    
    await template.update({ isActive: true });
    
    res.json({
      message: 'Template ativado com sucesso',
      template
    });
  } catch (error) {
    console.error('Erro ao ativar template:', error);
    res.status(500).json({ message: 'Erro ao ativar template' });
  }
};

// Obter templates por tipo
exports.getTemplatesByType = async (req, res) => {
  try {
    const type = req.params.type;
    
    const templates = await Template.findAll({ 
      where: {
        recordType: type,
        isActive: true
      },
      order: [['name', 'ASC']]
    });
    
    // Garantir que sempre retornamos um array
    const safeTemplates = Array.isArray(templates) ? templates : [];
    
    res.json({
      data: safeTemplates,
      total: safeTemplates.length
    });
  } catch (error) {
    console.error('Erro ao buscar templates por tipo:', error);
    // Sempre retornar um array vazio em caso de erro
    res.status(200).json({ 
      data: [],
      total: 0,
      message: 'Nenhum template encontrado para este tipo'
    });
  }
};