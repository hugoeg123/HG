/**
 * Middleware de Autenticação JWT
 * 
 * MISSÃO ZERO-DÉBITO: Verificação segura de tokens JWT
 * e proteção de rotas sensíveis
 */

const jwt = require('jsonwebtoken');
const { Medico } = require('../models/sequelize');

/**
 * Middleware para verificar token JWT
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    console.log('Auth Middleware: Received Authorization header:', authHeader); // Log para depuração
    
    if (!authHeader) {
      console.log('Auth Middleware: No Authorization header found.'); // Log para depuração
      return res.status(401).json({
        error: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar formato do header (Bearer <token>)
    const parts = authHeader.split(' ');
    console.log('Auth Middleware: Header parts:', parts); // Log para depuração
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('Auth Middleware: Invalid token format.'); // Log para depuração
      return res.status(401).json({
        error: 'Formato de token inválido',
        code: 'INVALID_TOKEN_FORMAT',
        expected: 'Bearer <token>'
      });
    }

    const token = parts[1];

    // Verificar e decodificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Auth Middleware: Token decoded successfully:', decoded); // Log para depuração

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED',
          expiredAt: jwtError.expiredAt
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
      }
      
      throw jwtError;
    }

    // Verificar se o médico ainda existe
    const medico = await Medico.findByPk(decoded.sub, {
      attributes: ['id', 'email', 'nome']
    });

    if (!medico) {
      console.log('Auth Middleware: User not found for decoded ID:', decoded.sub); // Log para depuração
      return res.status(401).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Adicionar informações do usuário ao request
    req.user = {
      id: medico.id,  // Adicionado para compatibilidade com controllers
      sub: medico.id,
      email: medico.email,
      nome: medico.nome,
      iat: decoded.iat,
      exp: decoded.exp,
      role: decoded.role || 'medico',
      roles: decoded.roles || [decoded.role || 'medico']
    };
    
    console.log('Auth Middleware: req.user configurado com sucesso:', {
      id: req.user.id,
      email: req.user.email,
      nome: req.user.nome
    });
    
    console.log('Auth Middleware: User attached to request:', req.user); // Log para depuração

    next();

  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware opcional - não falha se não houver token
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    req.user = null;
    return next();
  }

  // Se há header, usar o middleware normal
  return authMiddleware(req, res, next);
};

/**
 * Middleware para verificar se o usuário é admin (futuro)
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Autenticação requerida',
      code: 'NO_AUTH'
    });
  }

  // Por enquanto, todos os médicos têm acesso admin
  // No futuro, adicionar campo 'role' na tabela medicos
  next();
};

/**
 * Utilitário para gerar token JWT
 */
const generateToken = (medico) => {
  const payload = {
    sub: medico.id,
    email: medico.email,
    nome: medico.nome,
    iat: Math.floor(Date.now() / 1000)
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'health-guardian-api',
    audience: 'health-guardian-app'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Utilitário para verificar token sem middleware
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Utilitário para extrair token do header
 */
const extractToken = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

module.exports = {
  authMiddleware,
  optionalAuth,
  adminMiddleware,
  generateToken,
  verifyToken,
  extractToken
};