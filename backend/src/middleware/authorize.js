/**
 * Middleware de Autorização por Roles
 * 
 * Verifica se o usuário tem as permissões necessárias para acessar recursos
 */

/**
 * Middleware para verificar roles específicas
 * @param {Array} roles - Array de roles permitidas (ex: ['medico', 'admin'])
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    // Se não há roles especificadas, permitir acesso
    if (!roles || roles.length === 0) {
      return next();
    }

    // Verificar se o usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticação requerida',
        code: 'NO_AUTH'
      });
    }

    // Verificar se o usuário tem role definida
    const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);
    
    if (!userRoles.length) {
      return res.status(403).json({
        error: 'Acesso negado: role não definida',
        code: 'NO_ROLE'
      });
    }

    // Verificar se alguma role do usuário está nas roles permitidas
    const hasPermission = userRoles.some(userRole => roles.includes(userRole));
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Acesso negado: permissões insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: userRoles
      });
    }

    next();
  };
};

module.exports = {
  authorize
};