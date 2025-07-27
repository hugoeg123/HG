/**
 * Middleware de autenticação
 * 
 * Verifica se o usuário está autenticado através do token JWT
 * e adiciona o usuário à requisição
 */

const jwt = require('jsonwebtoken');
const { Medico } = require('../models/sequelize');

// Middleware para verificar autenticação
exports.authenticate = async (req, res, next) => {
  try {
    // Verificar se o token está presente no header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }

    // Extrair o token
    const token = authHeader.split(' ')[1];

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Verificar se o médico existe
    const medico = await Medico.findByPk(decoded.sub || decoded.id, { 
      attributes: ['id', 'email', 'nome'] 
    });
    console.log('Medico found:', medico);
    
    if (!medico) {
      console.log('Medico not found for ID:', decoded.sub || decoded.id);
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Adicionar usuário à requisição
    req.user = {
      id: medico.id,
      sub: medico.id,
      name: medico.nome,
      email: medico.email,
      role: decoded.role || 'medico',
      roles: decoded.roles || [decoded.role || 'medico']
    };

    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    res.status(500).json({ message: 'Erro de autenticação' });
  }
};

// Middleware para verificar permissões de admin (opcional)
exports.isAdmin = async (req, res, next) => {
  try {
    // Verificar se o médico é admin
    const medico = await Medico.findByPk(req.user.id);
    if (!medico) {
      return res.status(403).json({ message: 'Acesso negado: usuário não encontrado' });
    }

    // Verificar se o médico tem permissões de admin (assumindo que existe um campo isAdmin)
    if (!medico.isAdmin) {
      return res.status(403).json({ message: 'Acesso negado: permissões insuficientes' });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    res.status(500).json({ message: 'Erro ao verificar permissões' });
  }
};