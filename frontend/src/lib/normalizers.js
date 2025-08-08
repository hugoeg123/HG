/**
 * Value Normalizers for Medical Tags
 * 
 * Connectors:
 * - Used by patientTagsStore.js for automatic value conversion
 * - Integrates with calculatorStore.js for consistent units
 * - Referenced in TagToolbar.jsx for input validation
 * 
 * Hook: Provides consistent data normalization across the application
 * IA prompt: Add support for more medical units, localization, and validation rules
 */

import { eventUtils } from './events';

/**
 * @typedef {Object} NormalizationResult
 * @property {number|string} value - Normalized value
 * @property {string} unit - Standard unit
 * @property {string} [warning] - Warning message if conversion was ambiguous
 * @property {boolean} [converted] - Whether conversion occurred
 */

/**
 * Normalize height values to meters
 * 
 * Accepts:
 * - "170 cm" → 1.70 m
 * - "1,70 m" → 1.70 m
 * - "1.75" → 1.75 m (assumes meters if < 3)
 * - "175" → 1.75 m (assumes cm if > 3)
 * 
 * @param {string|number} input - Height input value
 * @returns {NormalizationResult} Normalized height in meters
 * 
 * Hook: Used for BMI calculations and patient data consistency
 */
export function normalizeHeight(input) {
  if (input === null || input === undefined || input === '') {
    throw new Error('Altura não pode estar vazia');
  }

  const originalInput = input;
  let inputStr = String(input).trim().toLowerCase();
  
  // Replace comma with dot for decimal parsing
  inputStr = inputStr.replace(',', '.');
  
  // Remove extra spaces
  inputStr = inputStr.replace(/\s+/g, ' ');
  
  let value, unit, converted = false, warning = null;
  
  try {
    // Handle explicit units
    if (inputStr.includes('cm')) {
      const numStr = inputStr.replace(/cm.*$/, '').trim();
      const numValue = parseFloat(numStr);
      
      if (isNaN(numValue) || numValue <= 0) {
        throw new Error('Valor de altura inválido em centímetros');
      }
      
      if (numValue > 300) {
        throw new Error('Altura muito alta (máximo 300 cm)');
      }
      
      value = numValue / 100; // Convert cm to m
      unit = 'm';
      converted = true;
      
    } else if (inputStr.includes('m')) {
      const numStr = inputStr.replace(/m.*$/, '').trim();
      const numValue = parseFloat(numStr);
      
      if (isNaN(numValue) || numValue <= 0) {
        throw new Error('Valor de altura inválido em metros');
      }
      
      if (numValue > 3) {
        throw new Error('Altura muito alta (máximo 3 m)');
      }
      
      value = numValue;
      unit = 'm';
      
    } else {
      // No explicit unit - need to infer
      const numValue = parseFloat(inputStr);
      
      if (isNaN(numValue) || numValue <= 0) {
        throw new Error('Valor de altura deve ser um número positivo');
      }
      
      if (numValue > 3) {
        // Assume centimeters
        if (numValue > 300) {
          throw new Error('Altura muito alta (máximo 300 cm)');
        }
        value = numValue / 100;
        unit = 'm';
        converted = true;
        warning = `Assumindo ${numValue} cm = ${value.toFixed(2)} m`;
        
      } else {
        // Assume meters
        if (numValue < 0.5) {
          warning = `Altura muito baixa: ${numValue} m`;
        }
        value = numValue;
        unit = 'm';
      }
    }
    
    // Round to 2 decimal places
    value = Math.round(value * 100) / 100;
    
    // Validation ranges
    if (value < 0.3 || value > 3.0) {
      throw new Error(`Altura fora do intervalo válido (0.3m - 3.0m): ${value}m`);
    }
    
    const result = { value, unit, converted, warning };
    
    // Emit normalization warning if conversion occurred
    if (converted || warning) {
      eventUtils.emitNormalizationWarning(
        'H',
        originalInput,
        `${value} ${unit}`,
        warning || `Convertido para ${unit}`
      );
    }
    
    return result;
    
  } catch (error) {
    console.error('Erro na normalização de altura:', error.message, 'Input:', originalInput);
    throw new Error(`Erro ao processar altura "${originalInput}": ${error.message}`);
  }
}

/**
 * Normalize weight values to kilograms
 * 
 * Accepts:
 * - "70 kg" → 70 kg
 * - "70,5" → 70.5 kg
 * - "1500 g" → 1.5 kg
 * - "75" → 75 kg
 * 
 * @param {string|number} input - Weight input value
 * @returns {NormalizationResult} Normalized weight in kilograms
 * 
 * Hook: Used for BMI calculations and medication dosing
 */
export function normalizeWeight(input) {
  if (input === null || input === undefined || input === '') {
    throw new Error('Peso não pode estar vazio');
  }

  const originalInput = input;
  let inputStr = String(input).trim().toLowerCase();
  
  // Replace comma with dot for decimal parsing
  inputStr = inputStr.replace(',', '.');
  
  // Remove extra spaces
  inputStr = inputStr.replace(/\s+/g, ' ');
  
  let value, unit, converted = false, warning = null;
  
  try {
    // Handle explicit units
    if (inputStr.includes('kg')) {
      const numStr = inputStr.replace(/kg.*$/, '').trim();
      const numValue = parseFloat(numStr);
      
      if (isNaN(numValue) || numValue <= 0) {
        throw new Error('Valor de peso inválido em quilogramas');
      }
      
      if (numValue > 1000) {
        throw new Error('Peso muito alto (máximo 1000 kg)');
      }
      
      value = numValue;
      unit = 'kg';
      
    } else if (inputStr.includes('g') && !inputStr.includes('kg')) {
      const numStr = inputStr.replace(/g.*$/, '').trim();
      const numValue = parseFloat(numStr);
      
      if (isNaN(numValue) || numValue <= 0) {
        throw new Error('Valor de peso inválido em gramas');
      }
      
      if (numValue > 1000000) {
        throw new Error('Peso muito alto (máximo 1000000 g)');
      }
      
      value = numValue / 1000; // Convert g to kg
      unit = 'kg';
      converted = true;
      
    } else {
      // No explicit unit - assume kg
      const numValue = parseFloat(inputStr);
      
      if (isNaN(numValue) || numValue <= 0) {
        throw new Error('Valor de peso deve ser um número positivo');
      }
      
      if (numValue > 1000) {
        throw new Error('Peso muito alto (máximo 1000 kg)');
      }
      
      value = numValue;
      unit = 'kg';
    }
    
    // Round to 1 decimal place
    value = Math.round(value * 10) / 10;
    
    // Validation ranges
    if (value < 0.5 || value > 1000) {
      throw new Error(`Peso fora do intervalo válido (0.5kg - 1000kg): ${value}kg`);
    }
    
    const result = { value, unit, converted, warning };
    
    // Emit normalization warning if conversion occurred
    if (converted || warning) {
      eventUtils.emitNormalizationWarning(
        'P',
        originalInput,
        `${value} ${unit}`,
        warning || `Convertido para ${unit}`
      );
    }
    
    return result;
    
  } catch (error) {
    console.error('Erro na normalização de peso:', error.message, 'Input:', originalInput);
    throw new Error(`Erro ao processar peso "${originalInput}": ${error.message}`);
  }
}

/**
 * Normalize blood pressure values
 * 
 * Accepts:
 * - "120/80" → { systolic: 120, diastolic: 80 }
 * - "140 / 90" → { systolic: 140, diastolic: 90 }
 * - "120" → { systolic: 120, diastolic: null }
 * 
 * @param {string} input - Blood pressure input
 * @returns {NormalizationResult} Normalized blood pressure
 * 
 * Hook: Used for cardiovascular risk calculations
 */
export function normalizeBloodPressure(input) {
  if (input === null || input === undefined || input === '') {
    throw new Error('Pressão arterial não pode estar vazia');
  }

  const originalInput = input;
  let inputStr = String(input).trim();
  
  try {
    // Remove units if present
    inputStr = inputStr.replace(/mmhg/gi, '').trim();
    
    let systolic, diastolic;
    
    if (inputStr.includes('/')) {
      // Format: "120/80"
      const parts = inputStr.split('/').map(p => p.trim());
      
      if (parts.length !== 2) {
        throw new Error('Formato inválido. Use: 120/80');
      }
      
      systolic = parseInt(parts[0]);
      diastolic = parseInt(parts[1]);
      
      if (isNaN(systolic) || isNaN(diastolic)) {
        throw new Error('Valores devem ser números inteiros');
      }
      
    } else {
      // Single value - assume systolic only
      systolic = parseInt(inputStr);
      diastolic = null;
      
      if (isNaN(systolic)) {
        throw new Error('Valor deve ser um número inteiro');
      }
    }
    
    // Validation
    if (systolic < 50 || systolic > 300) {
      throw new Error(`Pressão sistólica fora do intervalo válido (50-300): ${systolic}`);
    }
    
    if (diastolic !== null && (diastolic < 30 || diastolic > 200)) {
      throw new Error(`Pressão diastólica fora do intervalo válido (30-200): ${diastolic}`);
    }
    
    if (diastolic !== null && diastolic >= systolic) {
      throw new Error('Pressão diastólica deve ser menor que a sistólica');
    }
    
    const value = diastolic !== null ? { systolic, diastolic } : { systolic };
    
    return {
      value,
      unit: 'mmHg',
      converted: false
    };
    
  } catch (error) {
    console.error('Erro na normalização de pressão arterial:', error.message, 'Input:', originalInput);
    throw new Error(`Erro ao processar pressão arterial "${originalInput}": ${error.message}`);
  }
}

/**
 * Normalize heart rate values
 * 
 * @param {string|number} input - Heart rate input
 * @returns {NormalizationResult} Normalized heart rate in bpm
 */
export function normalizeHeartRate(input) {
  if (input === null || input === undefined || input === '') {
    throw new Error('Frequência cardíaca não pode estar vazia');
  }

  const originalInput = input;
  let inputStr = String(input).trim().toLowerCase();
  
  try {
    // Remove units
    inputStr = inputStr.replace(/bpm/gi, '').trim();
    
    const value = parseInt(inputStr);
    
    if (isNaN(value)) {
      throw new Error('Frequência cardíaca deve ser um número inteiro');
    }
    
    // Validation
    if (value < 20 || value > 300) {
      throw new Error(`Frequência cardíaca fora do intervalo válido (20-300): ${value}`);
    }
    
    return {
      value,
      unit: 'bpm',
      converted: false
    };
    
  } catch (error) {
    console.error('Erro na normalização de frequência cardíaca:', error.message, 'Input:', originalInput);
    throw new Error(`Erro ao processar frequência cardíaca "${originalInput}": ${error.message}`);
  }
}

/**
 * Normalize temperature values to Celsius
 * 
 * @param {string|number} input - Temperature input
 * @returns {NormalizationResult} Normalized temperature in Celsius
 */
export function normalizeTemperature(input) {
  if (input === null || input === undefined || input === '') {
    throw new Error('Temperatura não pode estar vazia');
  }

  const originalInput = input;
  let inputStr = String(input).trim().toLowerCase();
  
  // Replace comma with dot
  inputStr = inputStr.replace(',', '.');
  
  let value, unit, converted = false;
  
  try {
    if (inputStr.includes('°f') || inputStr.includes('f')) {
      // Fahrenheit to Celsius
      const numStr = inputStr.replace(/[°f]/g, '').trim();
      const fahrenheit = parseFloat(numStr);
      
      if (isNaN(fahrenheit)) {
        throw new Error('Valor de temperatura inválido em Fahrenheit');
      }
      
      value = (fahrenheit - 32) * 5 / 9;
      unit = '°C';
      converted = true;
      
    } else {
      // Assume Celsius
      const numStr = inputStr.replace(/[°c]/g, '').trim();
      const celsius = parseFloat(numStr);
      
      if (isNaN(celsius)) {
        throw new Error('Valor de temperatura inválido');
      }
      
      value = celsius;
      unit = '°C';
    }
    
    // Round to 1 decimal place
    value = Math.round(value * 10) / 10;
    
    // Validation
    if (value < 25 || value > 45) {
      throw new Error(`Temperatura fora do intervalo válido (25°C - 45°C): ${value}°C`);
    }
    
    const result = { value, unit, converted };
    
    if (converted) {
      eventUtils.emitNormalizationWarning(
        'TEMP',
        originalInput,
        `${value} ${unit}`,
        'Convertido de Fahrenheit para Celsius'
      );
    }
    
    return result;
    
  } catch (error) {
    console.error('Erro na normalização de temperatura:', error.message, 'Input:', originalInput);
    throw new Error(`Erro ao processar temperatura "${originalInput}": ${error.message}`);
  }
}

/**
 * Generic normalizer that routes to specific normalizers based on tag key
 * 
 * @param {string} tagKey - Tag identifier
 * @param {any} input - Input value
 * @returns {NormalizationResult} Normalized value
 * 
 * Hook: Main entry point for tag normalization
 */
export function normalizeTagValue(tagKey, input) {
  switch (tagKey) {
    case 'H':
    case 'HEIGHT':
      return normalizeHeight(input);
      
    case 'P':
    case 'WEIGHT':
      return normalizeWeight(input);
      
    case 'PA':
    case 'BP':
    case 'BLOOD_PRESSURE':
      return normalizeBloodPressure(input);
      
    case 'FC':
    case 'HR':
    case 'HEART_RATE':
      return normalizeHeartRate(input);
      
    case 'TEMP':
    case 'TEMPERATURE':
      return normalizeTemperature(input);
      
    default:
      // For unknown tags, try to parse as number or return as string
      if (typeof input === 'string') {
        const numValue = parseFloat(input.replace(',', '.'));
        if (!isNaN(numValue)) {
          return { value: numValue, unit: null, converted: false };
        }
      }
      
      return { value: input, unit: null, converted: false };
  }
}

/**
 * Validation utilities for normalized values
 */
export const validationUtils = {
  /**
   * Check if a normalized value is within expected ranges
   */
  isValidRange: (tagKey, value) => {
    switch (tagKey) {
      case 'H':
        return value >= 0.3 && value <= 3.0;
      case 'P':
        return value >= 0.5 && value <= 1000;
      case 'FC':
        return value >= 20 && value <= 300;
      case 'TEMP':
        return value >= 25 && value <= 45;
      default:
        return true; // No validation for unknown tags
    }
  },
  
  /**
   * Get expected unit for a tag
   */
  getExpectedUnit: (tagKey) => {
    const units = {
      'H': 'm',
      'P': 'kg',
      'PA': 'mmHg',
      'FC': 'bpm',
      'TEMP': '°C'
    };
    return units[tagKey] || null;
  },
  
  /**
   * Format value for display
   */
  formatForDisplay: (tagKey, value, unit) => {
    if (value === null || value === undefined) return '';
    
    switch (tagKey) {
      case 'H':
        return `${value.toFixed(2)} ${unit || 'm'}`;
      case 'P':
        return `${value.toFixed(1)} ${unit || 'kg'}`;
      case 'PA':
        if (typeof value === 'object') {
          return value.diastolic 
            ? `${value.systolic}/${value.diastolic} ${unit || 'mmHg'}`
            : `${value.systolic} ${unit || 'mmHg'}`;
        }
        return `${value} ${unit || 'mmHg'}`;
      case 'FC':
        return `${value} ${unit || 'bpm'}`;
      case 'TEMP':
        return `${value.toFixed(1)} ${unit || '°C'}`;
      default:
        return unit ? `${value} ${unit}` : String(value);
    }
  }
};

export default {
  normalizeHeight,
  normalizeWeight,
  normalizeBloodPressure,
  normalizeHeartRate,
  normalizeTemperature,
  normalizeTagValue,
  validationUtils
};