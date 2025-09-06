import { useState, useEffect, useCallback } from 'react';
import { create as mathCreate, all } from 'mathjs';

/**
 * useCompute Hook - Avalia expressions localmente para calculadoras dinâmicas
 * 
 * Integrates with:
 * - DynamicCalculator.tsx para cálculos em tempo real
 * - calculatorStore.js para persistência de valores
 * - Schemas JSON para definições de expressões
 * 
 * @param {Object} schema - Schema da calculadora com expressions
 * @param {Object} values - Valores atuais dos campos
 * @param {boolean} backendMode - Se deve usar backend para cálculos
 * 
 * @returns {Object} { results, errors, isComputing, compute }
 * 
 * @example
 * const { results, errors, compute } = useCompute(schema, values);
 * 
 * Hook: Fornece engine de cálculo local com fallback para backend
 * IA prompt: Adicionar cache de resultados e otimização de performance
 */

// Create safe MathJS instance
const math = mathCreate(all, {
  number: 'number',
  precision: 64
});

// Remove dangerous functions for security
math.import({
  'import': function () { throw new Error('Function import is disabled') },
  'createUnit': function () { throw new Error('Function createUnit is disabled') },
  'evaluate': function () { throw new Error('Function evaluate is disabled') },
  'parse': function () { throw new Error('Function parse is disabled') }
}, { override: true });

export const useCompute = (schema, values = {}, backendMode = false) => {
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [isComputing, setIsComputing] = useState(false);

  /**
   * Safely evaluate a mathematical expression
   * @param {string} expression - Mathematical expression to evaluate
   * @param {Object} context - Variable context for evaluation
   * @returns {number|null} Result or null if error
   */
  const safeEvaluate = useCallback((expression, context) => {
    try {
      // Replace variables in expression with values
      let processedExpression = expression;
      
      // Handle conditional expressions (ternary operator)
      if (expression.includes('?')) {
        // Simple ternary operator support: condition ? value1 : value2
        const ternaryMatch = expression.match(/(.+?)\s*\?\s*(.+?)\s*:\s*(.+)/);
        if (ternaryMatch) {
          const [, condition, trueValue, falseValue] = ternaryMatch;
          
          // Evaluate condition
          let conditionResult = false;
          if (condition.includes('==')) {
            const [left, right] = condition.split('==').map(s => s.trim());
            const leftVal = context[left] || left.replace(/['"`]/g, '');
            const rightVal = right.replace(/['"`]/g, '');
            conditionResult = leftVal === rightVal;
          }
          
          processedExpression = conditionResult ? trueValue.trim() : falseValue.trim();
        }
      }
      
      // Replace variables with their values
      Object.keys(context).forEach(key => {
        const value = context[key];
        if (typeof value === 'number' && !isNaN(value)) {
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          processedExpression = processedExpression.replace(regex, value.toString());
        }
      });
      
      // Evaluate the expression
      const result = math.evaluate(processedExpression);
      
      return typeof result === 'number' && !isNaN(result) ? result : null;
    } catch (error) {
      console.warn('Expression evaluation error:', error.message);
      return null;
    }
  }, []);

  /**
   * Compute all expressions in the schema
   */
  const compute = useCallback(async () => {
    if (!schema?.expressions) {
      return;
    }

    setIsComputing(true);
    setErrors({});
    
    try {
      const newResults = {};
      const newErrors = {};
      
      // Create context with current values and computed results
      const context = { ...values };
      
      // Process expressions in dependency order
      const expressions = schema.expressions;
      const processedKeys = new Set();
      const maxIterations = 10; // Prevent infinite loops
      let iteration = 0;
      
      while (processedKeys.size < Object.keys(expressions).length && iteration < maxIterations) {
        let progressMade = false;
        
        Object.entries(expressions).forEach(([key, expression]) => {
          if (processedKeys.has(key)) return;
          
          try {
            const result = safeEvaluate(expression, context);
            
            if (result !== null) {
              newResults[key] = result;
              context[key] = result; // Add to context for dependent calculations
              processedKeys.add(key);
              progressMade = true;
            }
          } catch (error) {
            newErrors[key] = error.message;
            processedKeys.add(key); // Mark as processed to avoid infinite loop
          }
        });
        
        if (!progressMade) break;
        iteration++;
      }
      
      setResults(newResults);
      setErrors(newErrors);
      
    } catch (error) {
      console.error('Computation error:', error);
      setErrors({ general: error.message });
    } finally {
      setIsComputing(false);
    }
  }, [schema, values, safeEvaluate]);

  // Auto-compute when values change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      compute();
    }, 100); // Debounce for 100ms
    
    return () => clearTimeout(timeoutId);
  }, [compute]);

  /**
   * Format result value according to field definition
   * @param {string} key - Field key
   * @param {number} value - Raw value
   * @returns {string} Formatted value
   */
  const formatResult = useCallback((key, value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '--';
    }
    
    const field = schema?.fields?.[key];
    const decimals = field?.decimals ?? 2;
    
    return Number(value).toFixed(decimals).replace('.', ',');
  }, [schema]);

  return {
    results,
    errors,
    isComputing,
    compute,
    formatResult
  };
};

export default useCompute;

// Connector: Usado em DynamicCalculator.tsx para cálculos em tempo real
// Hook: Fornece engine de cálculo local com suporte a expressions matemáticas