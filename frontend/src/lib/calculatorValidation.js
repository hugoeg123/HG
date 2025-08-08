/**
 * Calculator Validation Utilities
 * 
 * Provides validation functions for calculator expressions and configurations.
 * Integrates with mathjs for expression parsing and validation.
 * 
 * Connectors:
 * - Used in CalculatorModal.jsx for real-time validation
 * - Integrates with calculatorStore.js for expression evaluation
 * - References tagCatalogStore.js for tag validation
 */

import { create, all } from 'mathjs';

// Create a safe math instance with limited functions
const math = create(all, {
  // Disable dangerous functions
  'import': false,
  'createUnit': false,
  'evaluate': false,
  'parse': false
});

// Safe function whitelist for calculator expressions
const ALLOWED_FUNCTIONS = [
  // Basic arithmetic
  'add', 'subtract', 'multiply', 'divide', 'mod', 'pow',
  // Math functions
  'abs', 'ceil', 'floor', 'round', 'sqrt', 'cbrt',
  'exp', 'log', 'log10', 'log2',
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'min', 'max', 'mean', 'median', 'std',
  // Conditional
  'if', 'and', 'or', 'not',
  // Constants
  'pi', 'e'
];

/**
 * Validates a calculator configuration
 * 
 * @param {Object} calculator - Calculator configuration
 * @param {string} calculator.expression - Mathematical expression
 * @param {Array} calculator.inputs - Input tag definitions
 * @param {Array} calculator.outputs - Output definitions
 * @returns {Array} Array of validation error messages
 * 
 * Integration: Called from CalculatorModal.jsx during form validation
 */
export function validateCalculator(calculator) {
  const errors = [];
  
  if (!calculator) {
    errors.push('Configuração da calculadora é obrigatória');
    return errors;
  }
  
  // Validate basic fields
  if (!calculator.name?.trim()) {
    errors.push('Nome da calculadora é obrigatório');
  }
  
  if (!calculator.expression?.trim()) {
    errors.push('Expressão matemática é obrigatória');
  }
  
  if (!calculator.inputs || calculator.inputs.length === 0) {
    errors.push('Pelo menos uma tag de entrada é obrigatória');
  }
  
  if (!calculator.outputs || calculator.outputs.length === 0) {
    errors.push('Pelo menos uma saída é obrigatória');
  }
  
  // Validate expression syntax and variables
  if (calculator.expression && calculator.inputs) {
    const expressionErrors = validateExpression(calculator.expression, calculator.inputs);
    errors.push(...expressionErrors);
  }
  
  // Validate inputs
  if (calculator.inputs) {
    calculator.inputs.forEach((input, index) => {
      if (!input.tag?.trim()) {
        errors.push(`Entrada ${index + 1}: Tag é obrigatória`);
      }
      if (!input.label?.trim()) {
        errors.push(`Entrada ${index + 1}: Rótulo é obrigatório`);
      }
    });
  }
  
  // Validate outputs
  if (calculator.outputs) {
    calculator.outputs.forEach((output, index) => {
      if (!output.key?.trim()) {
        errors.push(`Saída ${index + 1}: Chave é obrigatória`);
      }
      if (!output.label?.trim()) {
        errors.push(`Saída ${index + 1}: Rótulo é obrigatório`);
      }
    });
  }
  
  return errors;
}

/**
 * Validates a mathematical expression
 * 
 * @param {string} expression - Mathematical expression to validate
 * @param {Array} inputs - Available input variables
 * @returns {Array} Array of validation error messages
 * 
 * Integration: Used by validateCalculator and CalculatorModal for real-time validation
 */
export function validateExpression(expression, inputs = []) {
  const errors = [];
  
  if (!expression?.trim()) {
    return ['Expressão não pode estar vazia'];
  }
  
  try {
    // Parse the expression to check syntax
    const node = math.parse(expression);
    
    // Extract variables from the expression
    const variables = extractVariables(node);
    
    // Check if all variables are defined in inputs
    const inputTags = inputs.map(input => input.tag);
    const undefinedVars = variables.filter(variable => 
      !inputTags.includes(variable) && 
      !ALLOWED_FUNCTIONS.includes(variable) &&
      !['pi', 'e'].includes(variable)
    );
    
    if (undefinedVars.length > 0) {
      errors.push(`Variáveis não definidas: ${undefinedVars.join(', ')}`);
    }
    
    // Check for dangerous functions
    const dangerousFunctions = findDangerousFunctions(node);
    if (dangerousFunctions.length > 0) {
      errors.push(`Funções não permitidas: ${dangerousFunctions.join(', ')}`);
    }
    
  } catch (error) {
    errors.push(`Erro de sintaxe: ${error.message}`);
  }
  
  return errors;
}

/**
 * Extracts variable names from a parsed math expression
 * 
 * @param {Object} node - Parsed math expression node
 * @returns {Array} Array of variable names
 */
function extractVariables(node) {
  const variables = new Set();
  
  function traverse(n) {
    if (!n) return;
    
    if (n.type === 'SymbolNode') {
      variables.add(n.name);
    } else if (n.type === 'FunctionNode') {
      variables.add(n.fn.name || n.fn);
      if (n.args) {
        n.args.forEach(traverse);
      }
    } else if (n.type === 'OperatorNode') {
      if (n.args) {
        n.args.forEach(traverse);
      }
    } else if (n.type === 'ParenthesesNode') {
      traverse(n.content);
    } else if (n.type === 'ConditionalNode') {
      traverse(n.condition);
      traverse(n.trueExpr);
      traverse(n.falseExpr);
    } else if (n.args) {
      n.args.forEach(traverse);
    } else if (n.content) {
      traverse(n.content);
    }
  }
  
  traverse(node);
  return Array.from(variables);
}

/**
 * Finds dangerous or disallowed functions in an expression
 * 
 * @param {Object} node - Parsed math expression node
 * @returns {Array} Array of dangerous function names
 */
function findDangerousFunctions(node) {
  const dangerous = [];
  
  function traverse(n) {
    if (!n) return;
    
    if (n.type === 'FunctionNode') {
      const funcName = n.fn.name || n.fn;
      if (!ALLOWED_FUNCTIONS.includes(funcName)) {
        dangerous.push(funcName);
      }
      if (n.args) {
        n.args.forEach(traverse);
      }
    } else if (n.args) {
      n.args.forEach(traverse);
    } else if (n.content) {
      traverse(n.content);
    }
  }
  
  traverse(node);
  return dangerous;
}

/**
 * Generates a preview of calculation steps with example values
 * 
 * @param {string} expression - Mathematical expression
 * @param {Array} inputs - Input definitions with example values
 * @returns {string} Preview text showing calculation steps
 * 
 * Integration: Used in CalculatorModal for expression preview
 */
export function generateCalculationPreview(expression, inputs) {
  if (!expression || !inputs || inputs.length === 0) {
    return '';
  }
  
  try {
    let preview = `Fórmula: ${expression}\n\n`;
    preview += 'Exemplo com valores:\n';
    
    // Create example values
    const exampleValues = {};
    inputs.forEach(input => {
      // Use first example value or default
      const exampleValue = getExampleValue(input);
      exampleValues[input.tag] = exampleValue;
      preview += `${input.label} (${input.tag}): ${exampleValue} ${input.unit || ''}\n`;
    });
    
    // Try to evaluate with example values
    try {
      const result = math.evaluate(expression, exampleValues);
      preview += `\nResultado exemplo: ${typeof result === 'number' ? result.toFixed(2) : result}`;
    } catch (evalError) {
      preview += `\nNão foi possível calcular exemplo: ${evalError.message}`;
    }
    
    return preview;
  } catch (error) {
    return `Erro ao gerar preview: ${error.message}`;
  }
}

/**
 * Gets an example value for an input based on its tag type
 * 
 * @param {Object} input - Input definition
 * @returns {number} Example value
 */
function getExampleValue(input) {
  // Common medical values for different tag types
  const examples = {
    'altura': 1.75,
    'peso': 70,
    'idade': 30,
    'fc': 72,
    'pas': 120,
    'pad': 80,
    'temp': 36.5,
    'glicemia': 90,
    'hb': 14,
    'ht': 42
  };
  
  // Try to match by tag key
  const tagKey = input.tag.toLowerCase();
  for (const [key, value] of Object.entries(examples)) {
    if (tagKey.includes(key)) {
      return value;
    }
  }
  
  // Default based on unit
  if (input.unit) {
    const unit = input.unit.toLowerCase();
    if (unit.includes('kg')) return 70;
    if (unit.includes('cm') || unit.includes('m')) return 170;
    if (unit.includes('bpm')) return 72;
    if (unit.includes('mmhg')) return 120;
    if (unit.includes('°c') || unit.includes('celsius')) return 36.5;
    if (unit.includes('%')) return 50;
  }
  
  return 1; // Default fallback
}

/**
 * Validates tag compatibility for calculator inputs
 * 
 * @param {Array} selectedTags - Selected tag keys
 * @param {Array} availableTags - Available tag definitions
 * @returns {Array} Array of compatibility warnings
 * 
 * Integration: Used in CalculatorModal for tag selection validation
 */
export function validateTagCompatibility(selectedTags, availableTags) {
  const warnings = [];
  
  if (!selectedTags || !availableTags) {
    return warnings;
  }
  
  selectedTags.forEach(tagKey => {
    const tagDef = availableTags.find(tag => tag.key === tagKey);
    if (!tagDef) {
      warnings.push(`Tag '${tagKey}' não encontrada no catálogo`);
      return;
    }
    
    // Check if tag type is suitable for calculations
    if (tagDef.type === 'text' || tagDef.type === 'boolean') {
      warnings.push(`Tag '${tagKey}' (${tagDef.type}) pode não ser adequada para cálculos`);
    }
    
    // Check for missing units on numeric tags
    if (tagDef.type === 'number' && !tagDef.unit) {
      warnings.push(`Tag '${tagKey}' não possui unidade definida`);
    }
  });
  
  return warnings;
}

export default {
  validateCalculator,
  validateExpression,
  generateCalculationPreview,
  validateTagCompatibility
};