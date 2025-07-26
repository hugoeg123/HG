/**
 * Middleware de autenticação
 * 
 * Verifica se o usuário está autenticado através do token JWT
 * e adiciona o usuário à requisição
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

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

    // Verificar se o usuário existe
    const user = await User.findByPk(decoded.sub || decoded.id, { 
      attributes: ['id', 'email', 'name'] 
    });
    console.log('User found:', user);
    
    if (!user) {
      console.log('User not found for ID:', decoded.sub || decoded.id);
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Adicionar usuário à requisição
    req.user = {
      id: user.id,
      sub: user.id,
      name: user.name,
      email: user.email
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
    // Verificar se o usuário é admin
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(403).json({ message: 'Acesso negado: usuário não encontrado' });
    }

    // Verificar se o usuário tem permissões de admin
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Acesso negado: permissões insuficientes' });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    res.status(500).json({ message: 'Erro ao verificar permissões' });
  }
};