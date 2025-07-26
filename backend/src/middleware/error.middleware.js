/**
 * Middleware de tratamento de erros
 * 
 * Captura e formata erros para respostas consistentes da API
 */

// Middleware para tratamento de erros
exports.errorHandler = (err, req, res, next) => {
  console.error('Erro capturado pelo middleware:', err);

  // Determinar o código de status
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Formatar resposta de erro
  res.status(statusCode).json({
    message: err.message || 'Erro interno do servidor',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    error: true
  });
};

// Middleware para capturar rotas não encontradas
exports.notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};