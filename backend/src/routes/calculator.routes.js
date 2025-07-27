/**
 * Rotas de Calculadora
 * 
 * Define endpoints RESTful para operações CRUD de calculadoras
 * e avaliação segura de fórmulas
 * 
 * Conectores:
 * - controllers/calculator.controller.js para processamento
 * - middleware/auth.middleware.js para autenticação
 * - middleware/calculator.middleware.js para validações
 */

const express = require('express');
const router = express.Router();

const calculatorController = require('../controllers/calculator.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  validateCreateCalculator,
  validateUpdateCalculator,
  validateGetCalculatorById,
  validateDeleteCalculator,
  validateEvaluateFormula,
  validateFormulaValidation,
  validateGetCalculators
} = require('../middleware/calculator.middleware');





/**
 * @route   GET /api/calculators
 * @desc    Lista todas as calculadoras públicas e pessoais do usuário
 * @access  Private (JWT required)
 * @query   category - Filtrar por categoria
 * @query   search - Buscar por nome ou descrição
 * @query   limit - Limite de resultados (padrão: 50)
 * @query   offset - Offset para paginação (padrão: 0)
 */
router.get('/', 
  authenticate,
  validateGetCalculators,
  calculatorController.getCalculators
);

/**
 * @route   POST /api/calculators
 * @desc    Cria uma nova calculadora
 * @access  Private (JWT required)
 * @body    { name, description?, category?, formula, fields, is_public? }
 */
router.post('/',
  authenticate,
  validateCreateCalculator,
  calculatorController.createCalculator
);

/**
 * @route   GET /api/calculators/categories
 * @desc    Obtém lista de categorias disponíveis
 * @access  Private (JWT required)
 */
router.get('/categories',
  authenticate,
  calculatorController.getCategories
);

/**
 * @route   POST /api/calculators/evaluate
 * @desc    Avalia uma fórmula de forma segura
 * @access  Private (JWT required)
 * @body    { formula, variables }
 * @example { "formula": "peso / (altura ^ 2)", "variables": { "peso": 70, "altura": 1.75 } }
 */
router.post('/evaluate',
  authenticate,
  validateEvaluateFormula,
  calculatorController.evaluateFormula
);

/**
 * @route   POST /api/calculators/validate
 * @desc    Valida uma fórmula sem executá-la
 * @access  Private (JWT required)
 * @body    { formula, fields? }
 */
router.post('/validate',
  authenticate,
  validateFormulaValidation,
  calculatorController.validateFormula
);

/**
 * @route   GET /api/calculators/:id
 * @desc    Obtém detalhes de uma calculadora específica
 * @access  Private (JWT required)
 * @param   id - UUID da calculadora
 */
router.get('/:id',
  authenticate,
  validateGetCalculatorById,
  calculatorController.getCalculatorById
);

/**
 * @route   PUT /api/calculators/:id
 * @desc    Atualiza uma calculadora (apenas proprietário)
 * @access  Private (JWT required + ownership)
 * @param   id - UUID da calculadora
 * @body    { name?, description?, category?, formula?, fields?, is_public? }
 */
router.put('/:id',
  authenticate,
  validateUpdateCalculator,
  calculatorController.updateCalculator
);

/**
 * @route   DELETE /api/calculators/:id
 * @desc    Deleta uma calculadora (apenas proprietário)
 * @access  Private (JWT required + ownership)
 * @param   id - UUID da calculadora
 */
router.delete('/:id',
  authenticate,
  validateDeleteCalculator,
  calculatorController.deleteCalculator
);

// Middleware de tratamento de erros específico para calculadoras
router.use((error, req, res, next) => {
  console.error('Erro nas rotas de calculadora:', error);
  
  // Erros de validação do mathjs
  if (error.message && error.message.includes('mathjs')) {
    return res.status(400).json({
      success: false,
      message: 'Erro na fórmula matemática',
      details: error.message
    });
  }
  
  // Erros de timeout
  if (error.message && error.message.includes('Timeout')) {
    return res.status(408).json({
      success: false,
      message: 'Timeout na avaliação da fórmula'
    });
  }
  
  // Erro genérico
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

module.exports = router;