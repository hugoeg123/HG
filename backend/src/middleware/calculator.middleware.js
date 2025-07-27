/**
 * Middleware de Validação para Calculadora
 * 
 * Define validações específicas para operações de calculadora
 * usando express-validator
 * 
 * Conectores:
 * - routes/calculator.routes.js como consumidor
 * - controllers/calculator.controller.js para processamento
 */

const { body, param, query } = require('express-validator');

/**
 * Validações para criação de calculadora
 */
const validateCreateCalculator = [
  body('name')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome deve ter entre 1 e 255 caracteres')
    .trim(),
    
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Descrição deve ter no máximo 5000 caracteres')
    .trim(),
    
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Categoria deve ter no máximo 100 caracteres')
    .trim(),
    
  body('formula')
    .notEmpty()
    .withMessage('Fórmula é obrigatória')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Fórmula deve ter entre 1 e 1000 caracteres')
    .matches(/^[a-zA-Z0-9+\-*/()\s._^sqrt()sin()cos()tan()log()abs()ceil()floor()round()max()min()]+$/)
    .withMessage('Fórmula contém caracteres inválidos')
    .trim(),
    
  body('fields')
    .isArray({ min: 1 })
    .withMessage('Campos devem ser um array com pelo menos 1 item'),
    
  body('fields.*.name')
    .notEmpty()
    .withMessage('Nome do campo é obrigatório')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage('Nome do campo deve ser um identificador válido')
    .isLength({ max: 50 })
    .withMessage('Nome do campo deve ter no máximo 50 caracteres'),
    
  body('fields.*.label')
    .notEmpty()
    .withMessage('Label do campo é obrigatório')
    .isLength({ min: 1, max: 100 })
    .withMessage('Label deve ter entre 1 e 100 caracteres'),
    
  body('fields.*.type')
    .isIn(['number', 'text', 'select', 'boolean'])
    .withMessage('Tipo de campo inválido'),
    
  body('fields.*.required')
    .optional()
    .isBoolean()
    .withMessage('Required deve ser um boolean'),
    
  body('fields.*.min')
    .optional()
    .isNumeric()
    .withMessage('Min deve ser um número'),
    
  body('fields.*.max')
    .optional()
    .isNumeric()
    .withMessage('Max deve ser um número'),
    
  body('fields.*.step')
    .optional()
    .isNumeric()
    .withMessage('Step deve ser um número'),
    
  body('fields.*.options')
    .optional()
    .isArray()
    .withMessage('Options deve ser um array'),
    
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public deve ser um boolean')
];

/**
 * Validações para atualização de calculadora
 */
const validateUpdateCalculator = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido'),
    
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Nome não pode estar vazio')
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome deve ter entre 1 e 255 caracteres')
    .trim(),
    
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Descrição deve ter no máximo 5000 caracteres')
    .trim(),
    
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Categoria deve ter no máximo 100 caracteres')
    .trim(),
    
  body('formula')
    .optional()
    .notEmpty()
    .withMessage('Fórmula não pode estar vazia')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Fórmula deve ter entre 1 e 1000 caracteres')
    .matches(/^[a-zA-Z0-9+\-*/()\s._^sqrt()sin()cos()tan()log()abs()ceil()floor()round()max()min()]+$/)
    .withMessage('Fórmula contém caracteres inválidos')
    .trim(),
    
  body('fields')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Campos devem ser um array com pelo menos 1 item'),
    
  body('fields.*.name')
    .optional()
    .notEmpty()
    .withMessage('Nome do campo é obrigatório')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage('Nome do campo deve ser um identificador válido')
    .isLength({ max: 50 })
    .withMessage('Nome do campo deve ter no máximo 50 caracteres'),
    
  body('fields.*.label')
    .optional()
    .notEmpty()
    .withMessage('Label do campo é obrigatório')
    .isLength({ min: 1, max: 100 })
    .withMessage('Label deve ter entre 1 e 100 caracteres'),
    
  body('fields.*.type')
    .optional()
    .isIn(['number', 'text', 'select', 'boolean'])
    .withMessage('Tipo de campo inválido'),
    
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public deve ser um boolean')
];

/**
 * Validações para buscar calculadora por ID
 */
const validateGetCalculatorById = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido')
];

/**
 * Validações para deletar calculadora
 */
const validateDeleteCalculator = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido')
];

/**
 * Validações para avaliação de fórmula
 */
const validateEvaluateFormula = [
  body('formula')
    .notEmpty()
    .withMessage('Fórmula é obrigatória')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Fórmula deve ter entre 1 e 1000 caracteres')
    .matches(/^[a-zA-Z0-9+\-*/()\s._^sqrt()sin()cos()tan()log()abs()ceil()floor()round()max()min()]+$/)
    .withMessage('Fórmula contém caracteres inválidos')
    .trim(),
    
  body('variables')
    .isObject()
    .withMessage('Variáveis devem ser um objeto')
    .custom((variables) => {
      // Validar que todas as chaves são identificadores válidos
      for (const key of Object.keys(variables)) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
          throw new Error(`Nome de variável inválido: ${key}`);
        }
      }
      
      // Validar que todos os valores são números
      for (const [key, value] of Object.entries(variables)) {
        if (typeof value !== 'number' || !isFinite(value)) {
          throw new Error(`Valor inválido para ${key}: deve ser um número finito`);
        }
      }
      
      return true;
    })
];

/**
 * Validações para validação de fórmula
 */
const validateFormulaValidation = [
  body('formula')
    .notEmpty()
    .withMessage('Fórmula é obrigatória')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Fórmula deve ter entre 1 e 1000 caracteres')
    .matches(/^[a-zA-Z0-9+\-*/()\s._^sqrt()sin()cos()tan()log()abs()ceil()floor()round()max()min()]+$/)
    .withMessage('Fórmula contém caracteres inválidos')
    .trim(),
    
  body('fields')
    .optional()
    .isArray()
    .withMessage('Campos devem ser um array'),
    
  body('fields.*.name')
    .optional()
    .notEmpty()
    .withMessage('Nome do campo é obrigatório')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage('Nome do campo deve ser um identificador válido')
];

/**
 * Validações para query parameters de listagem
 */
const validateGetCalculators = [
  query('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Categoria deve ter no máximo 100 caracteres')
    .trim(),
    
  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Busca deve ter no máximo 255 caracteres')
    .trim(),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit deve ser um número entre 1 e 100'),
    
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset deve ser um número maior ou igual a 0')
];

/**
 * Middleware personalizado para validar unicidade de nomes de campos
 */
const validateUniqueFieldNames = (req, res, next) => {
  const { fields } = req.body;
  
  if (!fields || !Array.isArray(fields)) {
    return next();
  }
  
  const fieldNames = fields.map(field => field.name);
  const uniqueNames = new Set(fieldNames);
  
  if (fieldNames.length !== uniqueNames.size) {
    return res.status(400).json({
      success: false,
      message: 'Nomes de campos devem ser únicos',
      errors: [{
        field: 'fields',
        message: 'Nomes de campos duplicados encontrados'
      }]
    });
  }
  
  next();
};

/**
 * Middleware para validar dependências entre campos
 */
const validateFieldDependencies = (req, res, next) => {
  const { fields } = req.body;
  
  if (!fields || !Array.isArray(fields)) {
    return next();
  }
  
  for (const field of fields) {
    // Validar campos do tipo select
    if (field.type === 'select' && (!field.options || !Array.isArray(field.options) || field.options.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Campos do tipo select devem ter opções',
        errors: [{
          field: `fields.${field.name}`,
          message: 'Options é obrigatório para campos do tipo select'
        }]
      });
    }
    
    // Validar min/max para campos numéricos
    if (field.type === 'number' && field.min !== undefined && field.max !== undefined) {
      if (field.min >= field.max) {
        return res.status(400).json({
          success: false,
          message: 'Valor mínimo deve ser menor que o máximo',
          errors: [{
            field: `fields.${field.name}`,
            message: 'Min deve ser menor que max'
          }]
        });
      }
    }
  }
  
  next();
};

module.exports = {
  validateCreateCalculator: [...validateCreateCalculator, validateUniqueFieldNames, validateFieldDependencies],
  validateUpdateCalculator: [...validateUpdateCalculator, validateUniqueFieldNames, validateFieldDependencies],
  validateGetCalculatorById,
  validateDeleteCalculator,
  validateEvaluateFormula,
  validateFormulaValidation,
  validateGetCalculators
};