/**
 * Dynamic Calculator Routes
 * 
 * Handles API routes for dynamic calculator operations
 * 
 * Connectors:
 * - controllers/DynamicCalculatorController.js for business logic
 * - controllers/ConversionController.js for unit/analyte conversions
 * - middleware/auth.middleware.js for authentication
 * - Used by routes/index.js as /dynamic-calculators endpoint
 * 
 * @module DynamicCalculatorRoutes
 */

const express = require('express');
const router = express.Router();
const { getDynamicCalculatorController } = require('../controllers/DynamicCalculatorController.js');
const { getConversionController } = require('../controllers/ConversionController.js');
const authMiddleware = require('../middleware/auth.middleware');

// Get controller instances
const dynamicCalculatorController = getDynamicCalculatorController();
const conversionController = getConversionController();

// Initialize dynamic calculator controller
dynamicCalculatorController.initialize();

/**
 * @route GET /dynamic-calculators
 * @desc List all available dynamic calculators
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const calculators = await dynamicCalculatorController.getCalculators(req, res);
    return calculators;
  } catch (error) {
    console.error('Error listing dynamic calculators:', error);
    res.status(500).json({
      error: 'Erro ao listar calculadoras dinâmicas',
      details: error.message
    });
  }
});

// Conversion endpoints (must come before /:calculatorId to avoid conflicts)

/**
 * @route POST /dynamic-calculators/convert/units
 * @desc Convert between units
 * @access Public
 */
router.post('/convert/units', async (req, res) => {
  try {
    const result = await conversionController.convertUnits(req, res);
    return result;
  } catch (error) {
    console.error('Error converting units:', error);
    res.status(500).json({
      error: 'Erro ao converter unidades',
      details: error.message
    });
  }
});

/**
 * @route GET /dynamic-calculators/units
 * @desc Get available units by dimension
 * @access Public
 */
router.get('/units/:dimension?', async (req, res) => {
  try {
    const units = await conversionController.getUnits(req, res);
    return units;
  } catch (error) {
    console.error('Error getting units:', error);
    res.status(500).json({
      error: 'Erro ao obter unidades',
      details: error.message
    });
  }
});

/**
 * @route GET /dynamic-calculators/analytes
 * @desc Get available analytes
 * @access Public
 */
router.get('/analytes/:analyte?', async (req, res) => {
  try {
    const analytes = await conversionController.getAnalytes(req, res);
    return analytes;
  } catch (error) {
    console.error('Error getting analytes:', error);
    res.status(500).json({
      error: 'Erro ao obter analitos',
      details: error.message
    });
  }
});

/**
 * @route GET /dynamic-calculators/analytes/:analyte/details
 * @desc Get analyte details including reference ranges
 * @access Public
 */
router.get('/analytes/:analyte/details', async (req, res) => {
  try {
    const details = await conversionController.getAnalyteDetails(req, res);
    return details;
  } catch (error) {
    console.error('Error getting analyte details:', error);
    res.status(500).json({
      error: 'Erro ao obter detalhes do analito',
      details: error.message
    });
  }
});

/**
 * @route POST /dynamic-calculators/validate
 * @desc Validate conversion parameters
 * @access Public
 */
router.post('/validate', async (req, res) => {
  try {
    const validation = await conversionController.validateConversion(req, res);
    return validation;
  } catch (error) {
    console.error('Error validating conversion:', error);
    res.status(500).json({
      error: 'Erro ao validar conversão',
      details: error.message
    });
  }
});

/**
 * @route GET /dynamic-calculators/:id
 * @desc Get calculator schema by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const schema = await dynamicCalculatorController.getCalculatorSchema(req, res);
    return schema;
  } catch (error) {
    console.error('Error getting calculator schema:', error);
    res.status(500).json({
      error: 'Erro ao obter esquema da calculadora',
      details: error.message
    });
  }
});

/**
 * @route POST /dynamic-calculators/:id/calculate
 * @desc Perform calculation using dynamic calculator
 * @access Public
 */
router.post('/:id/calculate', async (req, res) => {
  try {
    const result = await dynamicCalculatorController.computeCalculation(req, res);
    return result;
  } catch (error) {
    console.error('Error performing calculation:', error);
    res.status(500).json({
      error: 'Erro ao realizar cálculo',
      details: error.message
    });
  }
});

/**
 * @route POST /dynamic-calculators/reload
 * @desc Reload calculator schemas (development only)
 * @access Private (development)
 */
router.post('/reload', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      error: 'Endpoint disponível apenas em desenvolvimento'
    });
  }
  
  try {
    const result = await dynamicCalculatorController.reloadSchemas(req, res);
    return result;
  } catch (error) {
    console.error('Error reloading schemas:', error);
    res.status(500).json({
      error: 'Erro ao recarregar esquemas',
      details: error.message
    });
  }
});



module.exports = router;

// Hook: Integrates with routes/index.js as /dynamic-calculators endpoint
// Connector: Uses DynamicCalculatorController and ConversionController for business logic