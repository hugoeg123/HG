import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { create as mathCreate, all } from 'mathjs';
import { events, eventUtils, EVENT_TYPES } from '../lib/events';
import usePatientTagsStore from './patientTagsStore';

/**
 * Calculator Store - Manages calculator definitions and execution
 * 
 * Connectors:
 * - Integrates with patientTagsStore.js for input values
 * - Uses events.js for reactive calculation updates
 * - Referenced in CalculatorModal.jsx and Calculators.jsx
 * 
 * Hook: Provides calculator execution engine with MathJS integration
 * IA prompt: Add formula validation, unit checking, and performance optimization
 */

// Create MathJS instance with safe configuration
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

/**
 * @typedef {Object} Calculator
 * @property {string} id - Unique identifier
 * @property {string} name - Calculator name
 * @property {string} description - Description
 * @property {string} category - Category for grouping
 * @property {Array} inputs - Input tag definitions
 * @property {Array} outputs - Output definitions
 * @property {string} expression - Mathematical expression
 * @property {boolean} isPersonal - Whether calculator is personal
 * @property {string} createdBy - Creator user ID
 * @property {string} createdAt - Creation timestamp
 * @property {boolean} isActive - Whether calculator is active
 */

/**
 * @typedef {Object} CalculatorInput
 * @property {string} tag - Tag key (e.g., 'H', 'P')
 * @property {boolean} required - Whether input is required
 * @property {string} label - Display label
 * @property {number|string} defaultValue - Default value if not provided
 */

/**
 * @typedef {Object} CalculatorOutput
 * @property {string} key - Output key
 * @property {string} label - Display label
 * @property {number} rounding - Decimal places for rounding
 * @property {string} unit - Output unit
 * @property {string} format - Display format
 */

/**
 * @typedef {Object} CalculationResult
 * @property {boolean} ok - Whether calculation succeeded
 * @property {Object} values - Output values
 * @property {string} steps - Calculation steps for display
 * @property {Array} missing - Missing required inputs
 * @property {string} error - Error message if failed
 * @property {number} executionTime - Execution time in ms
 */

const useCalculatorStore = create(
  persist(
    (set, get) => ({
      // State
      calculators: [],
      results: {}, // { patientId: { calculatorId: CalculationResult } }
      loading: {},
      errors: {},
      lastExecution: {},

      // Actions
      /**
       * Register a new calculator
       * Hook: Called when creating or importing calculators
       */
      register: (calculator) => {
        const currentCalculators = get().calculators;
        const updatedCalculators = [
          ...currentCalculators.filter(c => c.id !== calculator.id),
          {
            ...calculator,
            createdAt: calculator.createdAt || new Date().toISOString(),
            isActive: calculator.isActive !== false
          }
        ];
        
        set({ calculators: updatedCalculators });
        
        // Trigger recalculation for all patients
        get().triggerRecalculationForAll(calculator.id);
      },

      /**
       * Update existing calculator
       * Hook: Called when editing calculator definitions
       */
      update: (calculatorId, updates) => {
        const currentCalculators = get().calculators;
        const updatedCalculators = currentCalculators.map(calc => 
          calc.id === calculatorId ? { ...calc, ...updates } : calc
        );
        
        set({ calculators: updatedCalculators });
        
        // Clear previous results and recalculate
        get().clearResults(calculatorId);
        get().triggerRecalculationForAll(calculatorId);
      },

      /**
       * Remove calculator
       * Hook: Called when deleting calculators
       */
      remove: (calculatorId) => {
        const currentCalculators = get().calculators;
        const updatedCalculators = currentCalculators.filter(c => c.id !== calculatorId);
        
        set({ calculators: updatedCalculators });
        
        // Clear all results for this calculator
        get().clearResults(calculatorId);
      },

      /**
       * Cleanup unwanted auto-created calculators
       * Hook: Runs on load to ensure only desired prebuilt remains
       */
      cleanupUnwanted: () => {
        const UNWANTED_IDS = ['bmi', 'bsa'];
        const UNWANTED_NAME_PATTERNS = [/mcg.*kg.*min.*ml.*h/i];
        const current = get().calculators || [];
        const cleaned = current.filter(calc => {
          if (!calc) return false;
          if (calc.id === 'conv-gotejamento') return true; // keep the prebuilt
          if (calc.id === 'conv-mcg-kg-min') return true; // keep the new prebuilt
          if (calc.id === 'conv-mcg-kg-min-gtt-min') return true; // keep the new gtt/min prebuilt
          if (UNWANTED_IDS.includes(calc.id)) return false; // drop known seeds
          // Drop known mcg/kg/min-ml/h calculator variants by name match (only user-created or old versions)
          if (typeof calc.name === 'string' && UNWANTED_NAME_PATTERNS.some(re => re.test(calc.name)) && !calc.isHardcoded) return false;
          return true; // keep all others (user-created)
        });
        if (cleaned.length !== current.length) {
          set({ calculators: cleaned });
        }
      },

      /**
       * Seed calculators with default definitions
       * Hook: Called when no calculators exist to provide initial set
       */
      seedCalculators: () => {
        const { register } = get();
        const current = get().calculators || [];

        const seedCalcs = [
          { 
            id: 'conv-gotejamento', 
            name: 'Conversão de Gotejamento', 
            category: 'Conversões', 
            description: 'gotas/min ↔ mL/h (tap tempo)',
            isHardcoded: true,
            immutable: true,
            tags: ['gotejamento', 'infusão', 'conversão'],
            summary: 'Conversão entre gotas por minuto e mL por hora com contador manual'
          },
          { 
            id: 'conv-mcg-kg-min', 
            name: 'Conversão mcg/kg/min ↔ mL/h', 
            category: 'Conversões', 
            description: 'Drogas vasoativas: mcg/kg/min ↔ mL/h',
            isHardcoded: true,
            immutable: true,
            tags: ['mcg', 'kg', 'min', 'mL/h', 'vasoativas', 'conversão'],
            summary: 'Conversão de dosagem de drogas vasoativas entre mcg/kg/min e mL/h'
          },
          {
            id: 'conv-mcg-kg-min-gtt-min',
            name: 'Conversão mcg/kg/min ↔ gtt/min',
            category: 'Conversões',
            description: 'Converte mcg/kg/min para gtt/min e vice-versa, com Tap para contagem de gotas',
            isHardcoded: true,
            immutable: true,
            tags: ['mcg', 'kg', 'min', 'gtt/min', 'infusão', 'conversão'],
            summary: 'Dose → gotas por minuto com base em peso, concentração e fator de gotas'
          }
        ];

        // Register only missing seeds
        seedCalcs.forEach((calc) => {
          const exists = current.some((c) => c && c.id === calc.id);
          if (!exists) register(calc);
        });
      },

      /**
       * Get all calculators
       * Hook: Compatibility method for legacy code
       */
      getAll: () => {
        const { seedCalculators, cleanupUnwanted } = get();
        // Always ensure core calculators exist
        seedCalculators();
        // Ensure unwanted defaults are removed (including persisted ones)
        cleanupUnwanted();
        return get().calculators;
      },

      /**
       * Get calculator by ID
       * Hook: Used for calculator lookup and validation
       */
      getById: (calculatorId) => {
        return get().calculators.find(c => c.id === calculatorId);
      },

      /**
       * Get calculators by category
       * Hook: Used for filtering in UI
       */
      getByCategory: (category) => {
        return get().calculators.filter(c => 
          c.category === category && c.isActive
        );
      },

      /**
       * Evaluate calculator for a specific patient
       * Hook: Main calculation engine
       */
      evaluateForPatient: async (calculatorId, patientId) => {
        const startTime = performance.now();
        
        try {
          const calculator = get().getById(calculatorId);
          if (!calculator) {
            throw new Error(`Calculator ${calculatorId} not found`);
          }

          if (!calculator.isActive) {
            throw new Error(`Calculator ${calculatorId} is inactive`);
          }

          // Get patient tag values
          const patientTags = usePatientTagsStore.getState().getFor(patientId);
          
          // Check for missing required inputs
          const missing = calculator.inputs
            .filter(input => input.required !== false)
            .map(input => input.tag)
            .filter(tag => !(tag in patientTags) || patientTags[tag].value === null || patientTags[tag].value === undefined);

          if (missing.length > 0) {
            const result = {
              ok: false,
              missing,
              error: `Missing required inputs: ${missing.join(', ')}`,
              executionTime: performance.now() - startTime
            };
            
            // Store result
            get().storeResult(patientId, calculatorId, result);
            return result;
          }

          // Prepare calculation scope
          const scope = {};
          const substitutions = {};
          
          for (const input of calculator.inputs) {
            const tagData = patientTags[input.tag];
            let value;
            
            if (tagData) {
              value = tagData.value;
              substitutions[input.tag] = `${value} (${tagData.unit || 'no unit'})`;
            } else if (input.defaultValue !== undefined) {
              value = input.defaultValue;
              substitutions[input.tag] = `${value} (default)`;
            } else {
              value = 0;
              substitutions[input.tag] = '0 (missing)';
            }
            
            scope[input.tag] = value;
          }

          // Validate expression safety
          if (!get().isExpressionSafe(calculator.expression)) {
            throw new Error('Expression contains unsafe operations');
          }

          // Execute calculation
          let calculatedValue;
          try {
            calculatedValue = math.evaluate(calculator.expression, scope);
          } catch (mathError) {
            throw new Error(`Math error: ${mathError.message}`);
          }

          // Process outputs
          const values = {};
          const output = calculator.outputs[0] || { key: 'result', rounding: 2 };
          
          if (typeof calculatedValue === 'number') {
            const roundedValue = Number(calculatedValue.toFixed(output.rounding || 2));
            values[output.key] = roundedValue;
          } else {
            values[output.key] = calculatedValue;
          }

          // Generate calculation steps
          const steps = get().generateSteps(calculator, substitutions, values);

          const result = {
            ok: true,
            values,
            steps,
            executionTime: performance.now() - startTime,
            timestamp: new Date().toISOString()
          };

          // Store result
          get().storeResult(patientId, calculatorId, result);
          
          // Emit calculation event
          eventUtils.emitCalculatorExecuted(calculatorId, patientId, result);
          
          return result;

        } catch (error) {
          console.error(`Calculator execution error for ${calculatorId}:`, error);
          
          const result = {
            ok: false,
            error: error.message,
            executionTime: performance.now() - startTime,
            timestamp: new Date().toISOString()
          };
          
          get().storeResult(patientId, calculatorId, result);
          return result;
        }
      },

      /**
       * Store calculation result
       * Hook: Internal method for result caching
       */
      storeResult: (patientId, calculatorId, result) => {
        const currentResults = get().results;
        const patientResults = currentResults[patientId] || {};
        
        set({
          results: {
            ...currentResults,
            [patientId]: {
              ...patientResults,
              [calculatorId]: result
            }
          },
          lastExecution: {
            ...get().lastExecution,
            [`${patientId}_${calculatorId}`]: new Date().toISOString()
          }
        });
      },

      /**
       * Get stored result for patient and calculator
       * Hook: Used for displaying cached results
       */
      getResult: (patientId, calculatorId) => {
        const patientResults = get().results[patientId] || {};
        return patientResults[calculatorId] || null;
      },

      /**
       * Clear results for a calculator
       * Hook: Called when calculator is updated or deleted
       */
      clearResults: (calculatorId) => {
        const currentResults = get().results;
        const updatedResults = {};
        
        for (const [patientId, patientResults] of Object.entries(currentResults)) {
          const { [calculatorId]: removed, ...remainingResults } = patientResults;
          if (Object.keys(remainingResults).length > 0) {
            updatedResults[patientId] = remainingResults;
          }
        }
        
        set({ results: updatedResults });
      },

      /**
       * Trigger recalculation for all patients
       * Hook: Called when calculator is updated
       */
      triggerRecalculationForAll: async (calculatorId) => {
        const patientStore = usePatientTagsStore.getState();
        const patientIds = Object.keys(patientStore.byPatient);
        
        for (const patientId of patientIds) {
          // Don't await to allow parallel execution
          get().evaluateForPatient(calculatorId, patientId);
        }
      },

      /**
       * Validate expression safety
       * Hook: Security check for mathematical expressions
       */
      isExpressionSafe: (expression) => {
        // Check for dangerous patterns
        const dangerousPatterns = [
          /import/i,
          /require/i,
          /eval/i,
          /function/i,
          /=>/,
          /\$\{/,
          /\[.*\]/,
          /\.__/,
          /prototype/i
        ];
        
        return !dangerousPatterns.some(pattern => pattern.test(expression));
      },

      /**
       * Generate calculation steps for display
       * Hook: Creates human-readable calculation explanation
       */
      generateSteps: (calculator, substitutions, values) => {
        let steps = `${calculator.name}:\n`;
        
        // Show input substitutions
        steps += 'Inputs:\n';
        for (const [variable, value] of Object.entries(substitutions)) {
          steps += `  ${variable} = ${value}\n`;
        }
        
        // Show formula with substitutions
        let formulaWithValues = calculator.expression;
        for (const [variable, value] of Object.entries(substitutions)) {
          const numericValue = value.split(' ')[0]; // Extract just the number
          formulaWithValues = formulaWithValues.replace(
            new RegExp(`\\b${variable}\\b`, 'g'), 
            numericValue
          );
        }
        
        steps += `\nFormula: ${calculator.expression}\n`;
        steps += `Calculation: ${formulaWithValues}\n`;
        
        // Show results
        steps += '\nResults:\n';
        for (const [key, value] of Object.entries(values)) {
          const output = calculator.outputs.find(o => o.key === key);
          const unit = output?.unit || '';
          steps += `  ${output?.label || key} = ${value}${unit ? ` ${unit}` : ''}\n`;
        }
        
        return steps;
      },

      /**
       * Validate calculator definition
       * Hook: Used before saving calculator
       */
      validateCalculator: (calculator) => {
        const errors = [];
        
        if (!calculator.name?.trim()) {
          errors.push('Nome é obrigatório');
        }
        
        if (!calculator.expression?.trim()) {
          errors.push('Fórmula é obrigatória');
        }
        
        if (!get().isExpressionSafe(calculator.expression)) {
          errors.push('Fórmula contém operações não permitidas');
        }
        
        if (!calculator.inputs || calculator.inputs.length === 0) {
          errors.push('Pelo menos uma entrada é obrigatória');
        }
        
        // Check if all variables in expression are defined in inputs
        if (calculator.expression) {
          const variables = new Set(calculator.expression.match(/[A-Z_]\w*/g) || []);
          const inputTags = new Set(calculator.inputs?.map(i => i.tag) || []);
          const unknownVars = [...variables].filter(v => !inputTags.has(v));
          
          if (unknownVars.length > 0) {
            errors.push(`Variáveis não definidas: ${unknownVars.join(', ')}`);
          }
        }
        
        return errors;
      },

      /**
       * Get calculators applicable to a patient
       * Hook: Used for showing relevant calculators
       */
      getApplicableCalculators: (patientId) => {
        const patientTags = usePatientTagsStore.getState().getFor(patientId);
        const availableTags = new Set(Object.keys(patientTags));
        
        return get().calculators.filter(calc => {
          if (!calc.isActive) return false;
          
          // Check if we have at least some required inputs
          const requiredInputs = calc.inputs.filter(i => i.required !== false);
          const availableInputs = requiredInputs.filter(i => availableTags.has(i.tag));
          
          // Show calculator if we have at least 50% of required inputs
          return availableInputs.length >= Math.ceil(requiredInputs.length * 0.5);
        });
      },

      /**
       * Reset store to initial state
       * Hook: Called on logout or app reset
       */
      reset: () => {
        set({
          calculators: [],
          results: {},
          loading: {},
          errors: {},
          lastExecution: {}
        });
      }
    }),
    {
      name: 'calculator-storage',
      // Only persist calculators, not results or loading states
      partialize: (state) => ({ calculators: state.calculators }),
      onRehydrateStorage: () => (state) => {
        // Após carregar do localStorage, se não há calculadoras, inicializa
        if (state && (!state.calculators || state.calculators.length === 0)) {
          console.log('Inicializando calculadoras padrão após rehydrate');
          state.seedCalculators();
        }
      }
    }
  )
);

// Set up event listeners for tag updates
if (typeof window !== 'undefined') {
  events.on(EVENT_TYPES.TAG_UPDATED, ({ tagKey, patientId }) => {
    const store = useCalculatorStore.getState();
    
    // Find calculators that use this tag
    const affectedCalculators = store.calculators.filter(calc => 
      calc.inputs.some(input => input.tag === tagKey) && calc.isActive
    );
    
    // Recalculate affected calculators
    affectedCalculators.forEach(calc => {
      store.evaluateForPatient(calc.id, patientId);
    });
  });
}

export default useCalculatorStore;

// Named exports for convenience
export { useCalculatorStore };

/**
 * Hook for getting calculator results with reactive updates
 * 
 * @param {string} patientId - Patient identifier
 * @param {string[]} calculatorIds - Calculator IDs to watch
 * @returns {Object} Calculator results
 * 
 * Hook: Provides reactive calculator results for UI components
 */
export const useCalculatorResults = (patientId, calculatorIds = []) => {
  return useCalculatorStore(state => {
    const patientResults = state.results[patientId] || {};
    
    if (calculatorIds.length === 0) {
      return patientResults;
    }
    
    return calculatorIds.reduce((acc, calcId) => {
      acc[calcId] = patientResults[calcId] || null;
      return acc;
    }, {});
  });
};