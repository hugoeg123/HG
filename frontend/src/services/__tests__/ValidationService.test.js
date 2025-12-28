/**
 * ValidationService Tests - Testes unitários para sistema de validação médica
 * 
 * Hook de Teste: Cobrindo integração com PhysiologicalRanges.js e CalculatorLayout.jsx
 * IA prompt: Adicionar testes de performance e validações específicas por especialidade
 */

import { describe, test, expect } from 'vitest';
import { ValidationService, ALERT_LEVELS } from '../ValidationService';
import { PHYSIOLOGICAL_RANGES } from '../PhysiologicalRanges';

describe('ValidationService', () => {
  describe('validateInput', () => {
    test('should validate required fields correctly', () => {
      const rules = [{ type: 'required', message: 'Campo obrigatório' }];
      
      // Test empty values
      expect(ValidationService.validateInput('', rules).isValid).toBe(false);
      expect(ValidationService.validateInput(null, rules).isValid).toBe(false);
      expect(ValidationService.validateInput(undefined, rules).isValid).toBe(false);
      
      // Test valid values
      expect(ValidationService.validateInput('test', rules).isValid).toBe(true);
      expect(ValidationService.validateInput(0, rules).isValid).toBe(true);
      expect(ValidationService.validateInput(false, rules).isValid).toBe(true);
    });

    test('should validate range fields correctly', () => {
      const rules = [{
        type: 'range',
        min: 10,
        max: 100,
        message: 'Valor deve estar entre 10 e 100'
      }];
      
      // Test values within range
      expect(ValidationService.validateInput('50', rules).isValid).toBe(true);
      expect(ValidationService.validateInput('10', rules).isValid).toBe(true);
      expect(ValidationService.validateInput('100', rules).isValid).toBe(true);
      
      // Test values outside range
      expect(ValidationService.validateInput('5', rules).isValid).toBe(false);
      expect(ValidationService.validateInput('150', rules).isValid).toBe(false);
      
      // Test invalid numbers
      expect(ValidationService.validateInput('abc', rules).isValid).toBe(false);
    });

    test('should validate clinical context correctly', () => {
      const rules = [{
        type: 'clinical',
        clinicalContext: 'elderly',
        criticalValues: [{
          min: 65,
          max: 120,
          message: 'Atenção para pacientes idosos',
          action: 'Considerar limitações'
        }]
      }];
      
      const context = { age: 70 };
      const result = ValidationService.validateInput('70', rules, context);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.clinicalAlerts.length).toBeGreaterThan(0);
    });

    test('should handle custom validation functions', () => {
      const customValidator = (value, context) => {
        const num = parseFloat(value);
        return {
          isValid: num > 0 && num % 2 === 0,
          message: 'Valor deve ser um número par positivo'
        };
      };
      
      const rules = [{
        type: 'custom',
        customValidator,
        message: 'Validação customizada falhou'
      }];
      
      expect(ValidationService.validateInput('4', rules).isValid).toBe(true);
      expect(ValidationService.validateInput('3', rules).isValid).toBe(false);
      expect(ValidationService.validateInput('-2', rules).isValid).toBe(false);
    });
  });

  describe('validateCalculatorInputs', () => {
    const mockSchema = {
      inputs: [
        {
          key: 'age',
          validations: [
            { type: 'required', message: 'Idade é obrigatória' },
            { type: 'range', min: 0, max: 120, message: 'Idade inválida' }
          ]
        },
        {
          key: 'weight',
          validations: [
            { type: 'required', message: 'Peso é obrigatório' },
            { type: 'range', min: 0.5, max: 500, message: 'Peso inválido' }
          ]
        }
      ],
      crossValidations: [
        {
          fields: ['age', 'weight'],
          validator: (inputs) => parseFloat(inputs.age) > 0 && parseFloat(inputs.weight) > 0,
          message: 'Idade e peso devem ser positivos'
        }
      ]
    };

    test('should validate all inputs correctly', () => {
      const validInputs = { age: '25', weight: '70' };
      const result = ValidationService.validateCalculatorInputs(validInputs, mockSchema);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.fieldErrors)).toHaveLength(0);
    });

    test('should detect field validation errors', () => {
      const invalidInputs = { age: '', weight: '1000' };
      const result = ValidationService.validateCalculatorInputs(invalidInputs, mockSchema);
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.age).toBeDefined();
      expect(result.fieldErrors.weight).toBeDefined();
    });

    test('should apply cross-field validations', () => {
      const inputs = { age: '-5', weight: '70' };
      const result = ValidationService.validateCalculatorInputs(inputs, mockSchema);
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.age).toBeDefined();
    });
  });

  describe('createPhysiologicalValidation', () => {
    test('should create validation rules from physiological ranges', () => {
      const rules = ValidationService.createPhysiologicalValidation('age');
      
      expect(rules).toHaveLength(1);
      expect(rules[0].type).toBe('range');
      expect(rules[0].min).toBe(PHYSIOLOGICAL_RANGES.age.min);
      expect(rules[0].max).toBe(PHYSIOLOGICAL_RANGES.age.max);
    });

    test('should include clinical context when specified', () => {
      const rules = ValidationService.createPhysiologicalValidation('age', {
        clinicalContext: 'elderly'
      });
      
      expect(rules).toHaveLength(2);
      expect(rules[1].type).toBe('clinical');
      expect(rules[1].clinicalContext).toBe('elderly');
    });

    test('should handle unknown parameters gracefully', () => {
      const rules = ValidationService.createPhysiologicalValidation('unknown_param');
      
      expect(rules).toHaveLength(0);
    });
  });

  describe('FIB-4 specific validations', () => {
    const fib4Schema = {
      inputs: [
        {
          key: 'age',
          validations: [
            { type: 'required', message: 'Idade é obrigatória' },
            { type: 'range', min: 18, max: 120, message: 'Idade deve estar entre 18 e 120 anos' },
            {
              type: 'clinical',
              clinicalContext: 'elderly',
              criticalValues: [{
                min: 65,
                max: 120,
                message: 'FIB-4 tem especificidade reduzida em pacientes > 65 anos',
                action: 'Considerar elastografia hepática'
              }]
            }
          ]
        },
        {
          key: 'ast',
          validations: [
            { type: 'required', message: 'AST é obrigatório' },
            { type: 'range', min: 1, max: 5000, message: 'AST deve estar entre 1 e 5000 U/L' }
          ]
        },
        {
          key: 'alt',
          validations: [
            { type: 'required', message: 'ALT é obrigatório' },
            { type: 'range', min: 1, max: 5000, message: 'ALT deve estar entre 1 e 5000 U/L' }
          ]
        },
        {
          key: 'platelets',
          validations: [
            { type: 'required', message: 'Plaquetas são obrigatórias' },
            { type: 'range', min: 1, max: 2000, message: 'Plaquetas devem estar entre 1 e 2000 ×10³/μL' }
          ]
        }
      ]
    };

    test('should validate FIB-4 inputs correctly', () => {
      const validInputs = {
        age: '45',
        ast: '80',
        alt: '60',
        platelets: '200'
      };
      
      const result = ValidationService.validateCalculatorInputs(validInputs, fib4Schema);
      expect(result.isValid).toBe(true);
    });

    test('should detect elderly patient warnings', () => {
      const elderlyInputs = {
        age: '70',
        ast: '80',
        alt: '60',
        platelets: '200'
      };
      
      const context = { age: 70 };
      const result = ValidationService.validateCalculatorInputs(elderlyInputs, fib4Schema, context);
      
      expect(result.isValid).toBe(true);
      expect(result.globalWarnings.length).toBeGreaterThan(0);
      expect(result.clinicalAlerts.length).toBeGreaterThan(0);
    });

    test('should reject invalid lab values', () => {
      const invalidInputs = {
        age: '45',
        ast: '0',  // Invalid - must be > 0
        alt: '6000',  // Invalid - too high
        platelets: '200'
      };
      
      const result = ValidationService.validateCalculatorInputs(invalidInputs, fib4Schema);
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.ast).toBeDefined();
      expect(result.fieldErrors.alt).toBeDefined();
    });
  });

  describe('Clinical alert levels', () => {
    test('should generate appropriate alert levels', () => {
      const criticalRule = {
        type: 'clinical',
        criticalValues: [{
          min: 1,
          max: 20,
          message: 'Valor crítico',
          action: 'Ação urgente'
        }]
      };
      
      const result = ValidationService.validateInput('10', [criticalRule]);
      
      expect(result.clinicalAlerts.length).toBeGreaterThan(0);
      expect(result.clinicalAlerts[0].level).toBe(ALERT_LEVELS.CRITICAL);
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle empty schema gracefully', () => {
      const result = ValidationService.validateCalculatorInputs({}, null);
      expect(result.isValid).toBe(true);
    });

    test('should handle missing validation rules', () => {
      const result = ValidationService.validateInput('test', []);
      expect(result.isValid).toBe(true);
    });

    test('should handle unknown validation types', () => {
      const rules = [{ type: 'unknown_type', message: 'Unknown' }];
      const result = ValidationService.validateInput('test', rules);
      
      // Should not crash and should be valid (unknown rules are ignored)
      expect(result.isValid).toBe(true);
    });

    test('should handle division by zero in calculations', () => {
      // This would be tested in the actual calculator, but we can test
      // that validation catches zero values where they shouldn't be
      const rules = [{
        type: 'custom',
        customValidator: (value) => {
          const num = parseFloat(value);
          return {
            isValid: num > 0,
            message: 'Valor deve ser maior que zero para evitar divisão por zero'
          };
        }
      }];
      
      expect(ValidationService.validateInput('0', rules).isValid).toBe(false);
      expect(ValidationService.validateInput('1', rules).isValid).toBe(true);
    });
  });

  describe('Performance tests', () => {
    test('should validate large number of inputs efficiently', () => {
      const largeSchema = {
        inputs: Array.from({ length: 100 }, (_, i) => ({
          key: `input_${i}`,
          validations: [
            { type: 'required', message: 'Required' },
            { type: 'range', min: 0, max: 1000, message: 'Range error' }
          ]
        }))
      };
      
      const largeInputs = {};
      for (let i = 0; i < 100; i++) {
        largeInputs[`input_${i}`] = String(Math.floor(Math.random() * 1000));
      }
      
      const startTime = performance.now();
      const result = ValidationService.validateCalculatorInputs(largeInputs, largeSchema);
      const endTime = performance.now();
      
      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });
  });
});
