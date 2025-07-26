/**
 * Controlador de autenticação
 * 
 * Gerencia operações de autenticação como registro, login e gerenciamento de perfil
 * 
 * Conector: Integra com models/sequelize/Medico.js para operações de banco de dados
 * e middleware/auth.js para verificação de tokens
 */

const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Medico } = require('../models/sequelize');

// Função auxiliar para gerar token JWT
const generateToken = (medicoId) => {
  return jwt.sign(
    { sub: medicoId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Registrar novo médico
exports.register = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, professionalType, professionalId, specialty } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
    }

    // Verificar se o médico já existe
    const existingMedico = await Medico.findOne({ where: { email } });
    if (existingMedico) {
      return res.status(409).json({ message: 'Médico já cadastrado' });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(password, salt);

    // Criar novo médico
    const medico = await Medico.create({
      nome: name,
      email,
      senha_hash,
      professional_type: professionalType || 'medico',
      professional_id: professionalId,
      specialty
    });

    // Gerar token
    const token = generateToken(medico.id);

    res.status(201).json({
      message: 'Médico registrado com sucesso',
      token,
      user: {
        id: medico.id,
        name: medico.nome,
        email: medico.email,
        professional_type: medico.professional_type,
        professional_id: medico.professional_id,
        specialty: medico.specialty
      }
    });
  } catch (error) {
    console.error('Erro ao registrar médico:', error);
    res.status(500).json({ message: 'Erro ao registrar médico', details: error.message });
  }
};

// Login de médico
exports.login = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
    }

    // Buscar médico
    const medico = await Medico.findOne({ where: { email } });
    if (!medico) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(password, medico.senha_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = generateToken(medico.id);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: medico.id,
        name: medico.nome,
        email: medico.email,
        professional_type: medico.professional_type,
        professional_id: medico.professional_id,
        specialty: medico.specialty
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login', details: error.message });
  }
};

// Obter médico atual
exports.getCurrentUser = async (req, res) => {
  try {
    const medico = await Medico.findByPk(req.user.sub, { 
      attributes: { exclude: ['senha_hash'] } 
    });
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    res.json({
      user: {
        id: medico.id,
        name: medico.nome,
        email: medico.email,
        createdAt: medico.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao obter médico atual:', error);
    res.status(500).json({ message: 'Erro ao obter médico atual' });
  }
};

// Atualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, email } = req.body;
    const updateData = {};

    if (nome) updateData.nome = nome;
    if (email) {
      // Verificar se o email já está em uso por outro médico
      const existingMedico = await Medico.findOne({
        where: {
          email,
          id: { [Op.ne]: req.user.sub }
        }
      });
      if (existingMedico) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
      updateData.email = email;
    }

    const [updatedRowsCount] = await Medico.update(updateData, {
      where: { id: req.user.sub }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    const medico = await Medico.findByPk(req.user.sub, { 
      attributes: { exclude: ['senha_hash'] } 
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      medico: {
        id: medico.id,
        nome: medico.nome,
        email: medico.email,
        createdAt: medico.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
};

// Alterar senha
exports.changePassword = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Buscar médico
    const medico = await Medico.findByPk(req.user.sub);
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    // Verificar senha atual
    const isMatch = await bcrypt.compare(currentPassword, medico.senha_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const nova_senha_hash = await bcrypt.hash(newPassword, salt);

    // Atualizar senha
    await Medico.update(
      { senha_hash: nova_senha_hash },
      { where: { id: req.user.sub } }
    );

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro ao alterar senha' });
  }
};