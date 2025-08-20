const fs = require('fs');
const path = require('path');
const { create, all } = require('mathjs');

// Create a secure mathjs instance
const math = create(all, {
  // Disable function creation and assignment for security
  'createFunction': false,
  'createOperator': false,
  'createUnit': false
});

// Remove potentially dangerous functions (keep evaluate and parse for calculations)
math.import({
  'import': function () { throw new Error('Function import is disabled') },
  'createUnit': function () { throw new Error('Function createUnit is disabled') }
}, { override: true });

/**
 * DynamicCalculatorController - Handles dynamic calculator operations
 * 
 * Integrates with:
 * - core/calculators/ JSON schemas for calculator definitions
 * - mathjs for secure expression evaluation
 * - Used by API routes in routes/calculators.js
 * - Frontend DynamicCalculator component calls these endpoints
 * 
 * @class DynamicCalculatorController
 */
class DynamicCalculatorController {
  constructor() {
    this.calculatorSchemas = new Map();
    this.calculatorsPath = path.join(__dirname, '..', 'core', 'calculators');
    this.initialized = false;
  }

  /**
   * Initialize the controller by loading all calculator schemas
   * 
   * Hook: Called during server startup
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Ensure calculators directory exists
      if (!fs.existsSync(this.calculatorsPath)) {
        fs.mkdirSync(this.calculatorsPath, { recursive: true });
        console.log('Created calculators directory');
      }

      await this.loadCalculatorSchemas();
      this.initialized = true;
      console.log(`DynamicCalculatorController initialized with ${this.calculatorSchemas.size} calculators`);
    } catch (error) {
      console.error('Failed to initialize DynamicCalculatorController:', error);
      throw new Error(`DynamicCalculatorController initialization failed: ${error.message}`);
    }
  }

  /**
   * Load all calculator schemas from JSON files
   * 
   * @private
   * @returns {Promise<void>}
   */
  async loadCalculatorSchemas() {
    try {
      const files = fs.readdirSync(this.calculatorsPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(this.calculatorsPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const schema = JSON.parse(content);
        
        // Validate schema structure
        this.validateCalculatorSchema(schema);
        
        const calculatorId = path.basename(file, '.json');
        this.calculatorSchemas.set(calculatorId, {
          ...schema,
          id: calculatorId,
          filePath
        });
      }
    } catch (error) {
      throw new Error(`Failed to load calculator schemas: ${error.message}`);
    }
  }

  /**
   * Validate calculator schema structure
   * 
   * @private
   * @param {Object} schema - Calculator schema to validate
   */
  validateCalculatorSchema(schema) {
    const requiredFields = ['name', 'inputs', 'expressions', 'outputs'];
    
    for (const field of requiredFields) {
      if (!schema[field]) {
        throw new Error(`Calculator schema missing required field: ${field}`);
      }
    }

    // Validate inputs structure
    if (!Array.isArray(schema.inputs)) {
      throw new Error('Calculator schema inputs must be an array');
    }

    // Validate expressions structure
    if (typeof schema.expressions !== 'object') {
      throw new Error('Calculator schema expressions must be an object');
    }

    // Validate outputs structure
    if (!Array.isArray(schema.outputs)) {
      throw new Error('Calculator schema outputs must be an array');
    }
  }

  /**
   * Ensure the controller is initialized
   * 
   * @private
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('DynamicCalculatorController not initialized. Call initialize() first.');
    }
  }

  /**
   * Get list of available calculators
   * GET /api/calculators/dynamic
   * 
   * Hook: Called from frontend to populate calculator selection
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCalculators(req, res) {
    try {
      this._ensureInitialized();
      
      const { category, search } = req.query;
      let calculators = Array.from(this.calculatorSchemas.values());

      // Filter by category if specified
      if (category) {
        calculators = calculators.filter(calc => 
          calc.category && calc.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Filter by search term if specified
      if (search) {
        const searchLower = search.toLowerCase();
        calculators = calculators.filter(calc => 
          calc.name.toLowerCase().includes(searchLower) ||
          (calc.description && calc.description.toLowerCase().includes(searchLower))
        );
      }

      // Return simplified list
      const calculatorList = calculators.map(calc => ({
        id: calc.id,
        name: calc.name,
        description: calc.description,
        category: calc.category,
        modes: calc.modes || null
      }));

      res.json({
        success: true,
        calculators: calculatorList,
        total: calculatorList.length
      });
    } catch (error) {
      console.error('Get calculators error:', error);
      res.status(500).json({
        error: error.message,
        code: 'GET_CALCULATORS_ERROR'
      });
    }
  }

  /**
   * Get calculator schema by ID
   * GET /api/calculators/dynamic/:id
   * 
   * Hook: Called from frontend DynamicCalculator component
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCalculatorSchema(req, res) {
    try {
      this._ensureInitialized();
      
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          error: 'Calculator ID is required',
          code: 'MISSING_CALCULATOR_ID'
        });
      }

      const schema = this.calculatorSchemas.get(id);
      
      if (!schema) {
        return res.status(404).json({
          error: `Calculator not found: ${id}`,
          code: 'CALCULATOR_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        calculator: schema
      });
    } catch (error) {
      console.error('Get calculator schema error:', error);
      res.status(500).json({
        error: error.message,
        code: 'GET_CALCULATOR_SCHEMA_ERROR'
      });
    }
  }

  /**
   * Compute calculation based on inputs and schema
   * POST /api/calculators/dynamic/:id/compute
   * 
   * Hook: Called from frontend when user submits calculation
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async computeCalculation(req, res) {
    try {
      this._ensureInitialized();
      
      const { id } = req.params;
      const { inputs, mode } = req.body;
      
      if (!id) {
        return res.status(400).json({
          error: 'Calculator ID is required',
          code: 'MISSING_CALCULATOR_ID'
        });
      }

      if (!inputs || typeof inputs !== 'object') {
        return res.status(400).json({
          error: 'Inputs object is required',
          code: 'MISSING_INPUTS'
        });
      }

      const schema = this.calculatorSchemas.get(id);
      
      if (!schema) {
        return res.status(404).json({
          error: `Calculator not found: ${id}`,
          code: 'CALCULATOR_NOT_FOUND'
        });
      }

      // Validate inputs against schema
      const validationResult = this.validateInputs(inputs, schema, mode);
      if (!validationResult.isValid) {
        return res.status(400).json({
          error: 'Input validation failed',
          code: 'INVALID_INPUTS',
          details: validationResult.errors
        });
      }

      // Perform calculation
      const results = await this.performCalculation(inputs, schema, mode);
      
      res.json({
        success: true,
        results,
        calculatorId: id,
        mode: mode || 'default',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Compute calculation error:', error);
      res.status(500).json({
        error: error.message,
        code: 'COMPUTE_CALCULATION_ERROR'
      });
    }
  }

  /**
   * Validate inputs against calculator schema
   * 
   * @private
   * @param {Object} inputs - User inputs
   * @param {Object} schema - Calculator schema
   * @param {string} mode - Calculation mode
   * @returns {Object} Validation result
   */
  validateInputs(inputs, schema, mode) {
    const errors = [];
    
    // Get required inputs for the mode
    let requiredInputs = schema.inputs;
    
    if (mode && schema.modes && schema.modes[mode]) {
      const modeConfig = schema.modes[mode];
      if (modeConfig.required_inputs) {
        requiredInputs = schema.inputs.filter(input => 
          modeConfig.required_inputs.includes(input.name)
        );
      }
    }

    // Check required inputs
    for (const inputDef of requiredInputs) {
      const value = inputs[inputDef.name];
      
      if (value === undefined || value === null || value === '') {
        errors.push(`Missing required input: ${inputDef.name}`);
        continue;
      }

      // Type validation
      if (inputDef.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(`Input ${inputDef.name} must be a valid number`);
          continue;
        }

        // Range validation
        if (inputDef.min !== undefined && numValue < inputDef.min) {
          errors.push(`Input ${inputDef.name} must be >= ${inputDef.min}`);
        }
        if (inputDef.max !== undefined && numValue > inputDef.max) {
          errors.push(`Input ${inputDef.name} must be <= ${inputDef.max}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Perform calculation using mathjs
   * 
   * @private
   * @param {Object} inputs - User inputs
   * @param {Object} schema - Calculator schema
   * @param {string} mode - Calculation mode
   * @returns {Promise<Object>} Calculation results
   */
  async performCalculation(inputs, schema, mode) {
    try {
      // Create scope with input values
      const scope = { ...inputs };
      
      // Convert string numbers to actual numbers
      for (const [key, value] of Object.entries(scope)) {
        if (typeof value === 'string' && !isNaN(parseFloat(value))) {
          scope[key] = parseFloat(value);
        }
      }

      // Get required outputs for the mode to determine which expressions to evaluate
      let requiredOutputs = schema.outputs.map(o => o.name);
      
      if (mode && schema.modes && schema.modes[mode]) {
        const modeConfig = schema.modes[mode];
        if (modeConfig.outputs) {
          requiredOutputs = modeConfig.outputs.map(o => o.name);
        }
      }

      // Get expressions to evaluate based on mode
      let expressions = schema.expressions;
      
      if (mode && schema.modes && schema.modes[mode]) {
        const modeConfig = schema.modes[mode];
        if (modeConfig.expressions) {
          expressions = { ...expressions, ...modeConfig.expressions };
        }
      }

      // Filter expressions to only those needed for required outputs
      const filteredExpressions = {};
      for (const outputName of requiredOutputs) {
        if (expressions[outputName]) {
          filteredExpressions[outputName] = expressions[outputName];
        }
      }

      // Evaluate expressions in order
      const results = {};
      
      for (const [key, expression] of Object.entries(filteredExpressions)) {
        try {
          // Sanitize expression (basic security check)
          if (this.containsUnsafeOperations(expression)) {
            throw new Error(`Unsafe operation detected in expression: ${key}`);
          }
          
          const result = math.evaluate(expression, scope);
          results[key] = result;
          
          // Add result to scope for subsequent calculations
          scope[key] = result;
        } catch (evalError) {
          throw new Error(`Error evaluating expression '${key}': ${evalError.message}`);
        }
      }

      // Format outputs according to schema
      const formattedResults = this.formatResults(results, schema, mode);
      
      return formattedResults;
    } catch (error) {
      throw new Error(`Calculation failed: ${error.message}`);
    }
  }

  /**
   * Check for unsafe operations in expressions
   * 
   * @private
   * @param {string} expression - Mathematical expression
   * @returns {boolean} True if unsafe operations detected
   */
  containsUnsafeOperations(expression) {
    const unsafePatterns = [
      /import\s*\(/,
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /require\s*\(/,
      /process\./,
      /global\./,
      /window\./,
      /document\./
    ];
    
    return unsafePatterns.some(pattern => pattern.test(expression));
  }

  /**
   * Format calculation results according to output schema
   * 
   * @private
   * @param {Object} results - Raw calculation results
   * @param {Object} schema - Calculator schema
   * @param {string} mode - Calculation mode
   * @returns {Object} Formatted results
   */
  formatResults(results, schema, mode) {
    const formatted = {};
    
    // Get outputs to format based on mode
    let outputs = schema.outputs;
    
    if (mode && schema.modes && schema.modes[mode]) {
      const modeConfig = schema.modes[mode];
      if (modeConfig.outputs) {
        outputs = modeConfig.outputs;
      }
    }

    for (const output of outputs) {
      const value = results[output.name];
      
      if (value !== undefined) {
        let formattedValue = value;
        
        // Apply formatting based on output type
        if (output.type === 'number' && typeof value === 'number') {
          if (output.decimals !== undefined) {
            formattedValue = parseFloat(value.toFixed(output.decimals));
          }
        }
        
        formatted[output.name] = {
          value: formattedValue,
          unit: output.unit || null,
          label: output.label || output.name,
          description: output.description || null
        };
      }
    }
    
    return formatted;
  }

  /**
   * Reload calculator schemas (for development)
   * POST /api/calculators/dynamic/reload
   * 
   * Hook: Development endpoint to reload schemas without restart
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async reloadSchemas(req, res) {
    try {
      this.calculatorSchemas.clear();
      await this.loadCalculatorSchemas();
      
      res.json({
        success: true,
        message: `Reloaded ${this.calculatorSchemas.size} calculator schemas`,
        count: this.calculatorSchemas.size
      });
    } catch (error) {
      console.error('Reload schemas error:', error);
      res.status(500).json({
        error: error.message,
        code: 'RELOAD_SCHEMAS_ERROR'
      });
    }
  }
}

// Create singleton instance
const dynamicCalculatorController = new DynamicCalculatorController();

/**
 * Get the singleton DynamicCalculatorController instance
 * 
 * Hook: Used by route handlers
 * 
 * @returns {DynamicCalculatorController} Singleton instance
 */
function getDynamicCalculatorController() {
  return dynamicCalculatorController;
}

/**
 * Initialize the dynamic calculator controller (convenience function)
 * 
 * @returns {Promise<void>}
 */
async function initializeDynamicCalculatorController() {
  await dynamicCalculatorController.initialize();
}

module.exports = {
  DynamicCalculatorController,
  getDynamicCalculatorController,
  initializeDynamicCalculatorController
};