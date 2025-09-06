/**
 * CustomValidators - Sistema de validadores customizados para calculadoras médicas
 * 
 * Integrates with:
 * - services/ValidationService.js para resolução de validadores customizados
 * - data/schemas/*.json para validações específicas de calculadoras
 * 
 * Hook: Exportado em services/CustomValidators.js e usado em ValidationService
 * IA prompt: Adicionar novos validadores customizados conforme necessário
 */

/**
 * Registry de validadores customizados
 * Mapeia strings de customValidator para funções de validação
 */
export const CUSTOM_VALIDATORS = {
  /**
   * Valida que albumina ascítica é menor que albumina sérica
   * Usado em: gasa_calculator.json
   */
  ascites_less_than_serum: (value, context, allInputs) => {
    const ascitesAlbumin = parseFloat(value);
    const serumAlbumin = parseFloat(allInputs?.serum_albumin || context?.serum_albumin);
    
    if (isNaN(ascitesAlbumin) || isNaN(serumAlbumin)) {
      return {
        isValid: true, // Não validar se valores não estão disponíveis
        message: ''
      };
    }
    
    const isValid = ascitesAlbumin < serumAlbumin;
    return {
      isValid,
      message: isValid ? '' : 'Albumina ascítica deve ser menor que a albumina sérica'
    };
  },

  /**
   * Valida que pressão diastólica é menor que sistólica
   * Usado em: map_calculator.json
   */
  diastolic_less_than_systolic: (value, context, allInputs) => {
    const diastolic = parseFloat(value);
    const systolic = parseFloat(allInputs?.systolic_bp || context?.systolic_bp);
    
    if (isNaN(diastolic) || isNaN(systolic)) {
      return {
        isValid: true, // Não validar se valores não estão disponíveis
        message: ''
      };
    }
    
    const isValid = diastolic < systolic;
    return {
      isValid,
      message: isValid ? '' : 'Pressão diastólica deve ser menor que a sistólica'
    };
  },

  /**
   * Valida que TIBC é maior que ferro sérico
   * Usado em: ist_calculator.json
   */
  tibc_greater_than_iron: (value, context, allInputs) => {
    const tibc = parseFloat(value);
    const serumIron = parseFloat(allInputs?.serum_iron || context?.serum_iron);
    
    if (isNaN(tibc) || isNaN(serumIron)) {
      return {
        isValid: true, // Não validar se valores não estão disponíveis
        message: ''
      };
    }
    
    const isValid = tibc > serumIron;
    return {
      isValid,
      message: isValid ? '' : 'TIBC deve ser maior que o ferro sérico'
    };
  }
};

/**
 * Resolve um validador customizado por nome
 * @param {string} validatorName - Nome do validador
 * @returns {Function|null} Função de validação ou null se não encontrada
 */
export const resolveCustomValidator = (validatorName) => {
  return CUSTOM_VALIDATORS[validatorName] || null;
};

/**
 * Registra um novo validador customizado
 * @param {string} name - Nome do validador
 * @param {Function} validator - Função de validação
 */
export const registerCustomValidator = (name, validator) => {
  CUSTOM_VALIDATORS[name] = validator;
};

/**
 * Lista todos os validadores customizados disponíveis
 * @returns {string[]} Array com nomes dos validadores
 */
export const getAvailableValidators = () => {
  return Object.keys(CUSTOM_VALIDATORS);
};

export default {
  CUSTOM_VALIDATORS,
  resolveCustomValidator,
  registerCustomValidator,
  getAvailableValidators
};