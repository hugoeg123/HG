/**
 * Controlador de tags
 * 
 * Gerencia operações CRUD para tags
 * 
 * Conector: Integra com models/Tag.js para operações de banco de dados
 */

const { validationResult } = require('express-validator');
const { Tag } = require('../models');

// Obter todas as tags
exports.getAllTags = async (req, res) => {
  try {
    // Opções de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // Opções de ordenação
    let sortField = req.query.sortField || 'name';
    if (sortField === 'name') sortField = 'nome'; // Map virtual field to DB column
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    // Opções de filtro
    const where = {};
    if (req.query.search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${req.query.search}%` } },
        { codigo: { [Op.iLike]: `%${req.query.search}%` } }
      ];
    }
    
    // Executar consulta
    const { count, rows: tags } = await Tag.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      limit,
      offset
    });
    
    // Garantir que sempre retornamos um array
    const safeTags = Array.isArray(tags) ? tags : [];
    
    res.json({
      data: safeTags, // Mudança para compatibilidade com frontend
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar tags:', error);
    // Sempre retornar um array vazio em caso de erro
    res.status(200).json({ 
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      },
      message: 'Nenhuma tag encontrada'
    });
  }
};

// Obter tag por ID
exports.getTagById = async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag não encontrada' });
    }
    
    res.json(tag);
  } catch (error) {
    console.error('Erro ao buscar tag:', error);
    res.status(500).json({ message: 'Erro ao buscar tag' });
  }
};

// Criar nova tag
exports.createTag = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Verificar se já existe uma tag com o mesmo nome
    const existingTag = await Tag.findOne({ where: { name: req.body.name } });
    if (existingTag) {
      return res.status(400).json({ message: 'Já existe uma tag com este nome' });
    }
    
    // Criar tag
    const tag = await Tag.create({
      ...req.body,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      message: 'Tag criada com sucesso',
      tag
    });
  } catch (error) {
    console.error('Erro ao criar tag:', error);
    res.status(500).json({ message: 'Erro ao criar tag' });
  }
};

// Atualizar tag
exports.updateTag = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Verificar se já existe outra tag com o mesmo nome
    if (req.body.name) {
      const { Op } = require('sequelize');
      const existingTag = await Tag.findOne({ 
        where: {
          name: req.body.name,
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existingTag) {
        return res.status(400).json({ message: 'Já existe outra tag com este nome' });
      }
    }
    
    // Buscar tag
    const tag = await Tag.findByPk(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag não encontrada' });
    }
    
    // Atualizar tag
    await tag.update(req.body);
    
    res.json({
      message: 'Tag atualizada com sucesso',
      tag
    });
  } catch (error) {
    console.error('Erro ao atualizar tag:', error);
    res.status(500).json({ message: 'Erro ao atualizar tag' });
  }
};

// Obter tags raiz
exports.getRootTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      where: { parentId: null },
      order: [['name', 'ASC']]
    });
    
    res.json(tags);
  } catch (error) {
    console.error('Erro ao buscar tags raiz:', error);
    res.status(500).json({ message: 'Erro ao buscar tags raiz' });
  }
};

// Obter tags filhas
exports.getChildTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      where: { parentId: req.params.id },
      order: [['name', 'ASC']]
    });
    
    res.json(tags);
  } catch (error) {
    console.error('Erro ao buscar tags filhas:', error);
    res.status(500).json({ message: 'Erro ao buscar tags filhas' });
  }
};

// Excluir tag
exports.deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag não encontrada' });
    }
    
    await tag.destroy();
    
    res.json({
      message: 'Tag excluída com sucesso',
      tag
    });
  } catch (error) {
    console.error('Erro ao excluir tag:', error);
    res.status(500).json({ message: 'Erro ao excluir tag' });
  }
};