/**
 * ValidationService - Sistema de validação centralizado para calculadoras médicas
 * 
 * Integrates with:
 * - components/Tools/CalculatorLayout.jsx para validação de inputs
 * - services/PhysiologicalRanges.js para ranges fisiológicos
 * - components/Tools/DynamicCalculator.jsx para validação dinâmica
 * 
 * Hook: Exportado em services/ValidationService.js e usado em calculadoras médicas
 * IA prompt: Adicionar validações específicas por especialidade médica e contexto clínico
 */

import { PHYSIOLOGICAL_RANGES } from './PhysiologicalRanges';
import { resolveCustomValidator } from './CustomValidators';

/**
 * Validation rule types for medical calculators
 * @typedef {Object} ValidationRule
 * @property {'range'|'required'|'format'|'clinical'} type - Type of validation
 * @property {number} [min] - Minimum value for range validation
 * @property {number} [max] - Maximum value for range validation
 * @property {string} message - Error message to display
 * @property {string} [clinicalContext] - Clinical context for the validation
 * @property {Function} [customValidator] - Custom validation function
 */

/**
 * Clinical alert levels for validation results
 */
export const ALERT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  ERROR: 'error'
};

/**
 * ValidationService class for medical calculator inputs
 * Connector: Integra com CalculatorLayout.jsx para validação universal
 */
export class ValidationService {
  /**
   * Validate a single input value against its rules
   * @param {*} value - Value to validate
   * @param {ValidationRule[]} rules - Array of validation rules
   * @param {Object} context - Additional context for validation
   * @param {Object} allInputs - All input values for cross-validation
   * @returns {Object} Validation result with errors and warnings
   */
  static validateInput(value, rules = [], context = {}, allInputs = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      clinicalAlerts: []
    };

    // Skip validation if no rules provided
    if (!rules || rules.length === 0) {
      return result;
    }

    for (const rule of rules) {
      const validationResult = this.applyRule(value, rule, context, allInputs);
      
      if (!validationResult.isValid) {
        result.isValid = false;
        result.errors.push(validationResult.message);
      }
      
      if (validationResult.warnings) {
        result.warnings.push(...validationResult.warnings);
      }
      
      if (validationResult.clinicalAlerts) {
        result.clinicalAlerts.push(...validationResult.clinicalAlerts);
      }
    }

    return result;
  }

  /**
   * Apply a single validation rule
   * @param {*} value - Value to validate
   * @param {ValidationRule} rule - Validation rule to apply
   * @param {Object} context - Additional context
   * @param {Object} allInputs - All input values for cross-validation
   * @returns {Object} Rule validation result
   */
  static applyRule(value, rule, context, allInputs = {}) {
    const result = {
      isValid: true,
      message: '',
      warnings: [],
      clinicalAlerts: []
    };

    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          result.isValid = false;
          result.message = rule.message || 'Este campo é obrigatório';
        }
        break;

      case 'range':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          result.isValid = false;
          result.message = 'Valor deve ser um número válido';
        } else {
          if (rule.min !== undefined && numValue < rule.min) {
            result.isValid = false;
            result.message = rule.message || `Valor deve ser maior ou igual a ${rule.min}`;
          }
          if (rule.max !== undefined && numValue > rule.max) {
            result.isValid = false;
            result.message = rule.message || `Valor deve ser menor ou igual a ${rule.max}`;
          }
        }
        break;

      case 'clinical':
        // Clinical validation with context-aware alerts
        const clinicalResult = this.validateClinicalContext(value, rule, context);
        result.warnings = clinicalResult.warnings;
        result.clinicalAlerts = clinicalResult.alerts;
        break;

      case 'format':
        if (rule.pattern && !rule.pattern.test(value)) {
          result.isValid = false;
          result.message = rule.message || 'Formato inválido';
        }
        break;

      case 'custom':
        if (rule.customValidator) {
          let validator = rule.customValidator;
          
          // Se customValidator é uma string, resolve para função
          if (typeof validator === 'string') {
            validator = resolveCustomValidator(validator);
            if (!validator) {
              console.warn(`Custom validator '${rule.customValidator}' not found`);
              break;
            }
          }
          
          // Verifica se é uma função válida
          if (typeof validator === 'function') {
            const customResult = validator(value, context, allInputs);
            if (!customResult.isValid) {
              result.isValid = false;
              result.message = customResult.message || rule.message;
            }
          } else {
            console.warn(`Custom validator is not a function: ${typeof validator}`);
          }
        }
        break;

      default:
        console.warn(`Unknown validation rule type: ${rule.type}`);
    }

    return result;
  }

  /**
   * Validate clinical context and generate appropriate alerts
   * @param {*} value - Value to validate
   * @param {ValidationRule} rule - Clinical validation rule
   * @param {Object} context - Clinical context
   * @returns {Object} Clinical validation result
   */
  static validateClinicalContext(value, rule, context) {
    const result = {
      warnings: [],
      alerts: []
    };

    // Age-specific validations
    if (context.age && rule.clinicalContext) {
      if (rule.clinicalContext.includes('elderly') && context.age > 65) {
        result.warnings.push('Atenção: Validação pode ter limitações em pacientes >65 anos');
      }
      if (rule.clinicalContext.includes('pediatric') && context.age < 18) {
        result.warnings.push('Atenção: Fórmula não validada para uso pediátrico');
      }
    }

    // Critical value alerts
    if (rule.criticalValues) {
      const numValue = parseFloat(value);
      for (const critical of rule.criticalValues) {
        if (numValue >= critical.min && numValue <= critical.max) {
          result.alerts.push({
            level: ALERT_LEVELS.CRITICAL,
            message: critical.message,
            action: critical.action
          });
        }
      }
    }

    return result;
  }

  /**
   * Validate all inputs for a calculator schema
   * @param {Object} inputs - Input values object
   * @param {Object} schema - Calculator schema with validation rules
   * @param {Object} context - Additional context
   * @returns {Object} Complete validation result
   */
  static validateCalculatorInputs(inputs, schema, context = {}) {
    const result = {
      isValid: true,
      fieldErrors: {},
      globalWarnings: [],
      clinicalAlerts: []
    };

    if (!schema || !schema.inputs) {
      return result;
    }

    // Validate each input field
    for (const inputDef of schema.inputs) {
      const value = inputs[inputDef.key];
      const fieldResult = this.validateInput(value, inputDef.validations, context, inputs);
      
      if (!fieldResult.isValid) {
        result.isValid = false;
        result.fieldErrors[inputDef.key] = fieldResult.errors;
      }
      
      if (fieldResult.warnings.length > 0) {
        result.globalWarnings.push(...fieldResult.warnings);
      }
      
      if (fieldResult.clinicalAlerts.length > 0) {
        result.clinicalAlerts.push(...fieldResult.clinicalAlerts);
      }
    }

    // Cross-field validations
    if (schema.crossValidations) {
      const crossResult = this.applyCrossValidations(inputs, schema.crossValidations, context);
      if (!crossResult.isValid) {
        result.isValid = false;
        Object.assign(result.fieldErrors, crossResult.fieldErrors);
      }
    }

    return result;
  }

  /**
   * Apply cross-field validations (e.g., systolic > diastolic BP)
   * @param {Object} inputs - All input values
   * @param {Array} crossValidations - Cross-validation rules
   * @param {Object} context - Additional context
   * @returns {Object} Cross-validation result
   */
  static applyCrossValidations(inputs, crossValidations, context) {
    const result = {
      isValid: true,
      fieldErrors: {}
    };

    for (const validation of crossValidations) {
      const isValid = validation.validator(inputs, context);
      if (!isValid) {
        result.isValid = false;
        for (const field of validation.fields) {
          if (!result.fieldErrors[field]) {
            result.fieldErrors[field] = [];
          }
          result.fieldErrors[field].push(validation.message);
        }
      }
    }

    return result;
  }

  /**
   * Get physiological range for a parameter
   * @param {string} parameter - Parameter name
   * @returns {Object|null} Range object or null if not found
   */
  static getPhysiologicalRange(parameter) {
    return PHYSIOLOGICAL_RANGES[parameter] || null;
  }

  /**
   * Create validation rules from physiological ranges
   * @param {string} parameter - Parameter name
   * @param {Object} options - Additional options
   * @returns {ValidationRule[]} Array of validation rules
   */
  static createPhysiologicalValidation(parameter, options = {}) {
    const range = this.getPhysiologicalRange(parameter);
    if (!range) {
      console.warn(`No physiological range found for parameter: ${parameter}`);
      return [];
    }

    const rules = [];

    // Range validation
    rules.push({
      type: 'range',
      min: range.min,
      max: range.max,
      message: `${parameter} deve estar entre ${range.min} e ${range.max} ${range.unit}`
    });

    // Clinical context validation if specified
    if (options.clinicalContext) {
      rules.push({
        type: 'clinical',
        clinicalContext: options.clinicalContext,
        criticalValues: range.criticalValues
      });
    }

    return rules;
  }
}

export default ValidationService;