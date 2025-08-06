/**
 * Serviço de Calculadora
 * 
 * Contém a lógica de negócio para operações CRUD de calculadoras
 * e avaliação segura de fórmulas usando mathjs
 * 
 * Conectores:
 * - models/sequelize/Calculator.js para operações de banco
 * - mathjs para avaliação segura de fórmulas
 * - controllers/calculator.controller.js como consumidor
 */

const { create, all } = require('mathjs');
const Calculator = require('../models/sequelize/Calculator');
const Tag = require('../models/sequelize/Tag');
const { Op } = require('sequelize');

// Configuração segura do mathjs
const math = create(all, {
  // Configurações de segurança
  number: 'BigNumber',
  precision: 64
});

// Remover funções perigosas para segurança
const restrictedFunctions = [
  'import', 'createUnit', 'evaluate', 'parse', 'compile',
  'simplify', 'derivative', 'rationalize'
];

try {
  restrictedFunctions.forEach(fn => {
    if (math[fn]) {
      delete math[fn];
    }
  });
} catch (error) {
  console.warn('Aviso: Não foi possível remover algumas funções do mathjs:', error.message);
}

/**
 * Serviço de Calculadora
 * @class CalculatorService
 */
class CalculatorService {
  /**
   * Cria uma nova calculadora
   * @param {Object} calculatorData - Dados da calculadora
   * @param {string} userId - ID do usuário proprietário
   * @returns {Promise<Object>} Calculadora criada
   */
  async createCalculator(calculatorData, userId) {
    try {
      // Validar fórmula antes de salvar
      await this.validateFormula(calculatorData.formula, calculatorData.fields);
      
      const { tagIds, ...calculatorFields } = calculatorData;
      
      const calculator = await Calculator.create({
        ...calculatorFields,
        owner_id: userId
      });
      
      // Associar tags se fornecidas
      if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
        const validTags = await Tag.findAll({
          where: {
            id: {
              [Op.in]: tagIds
            }
          }
        });
        
        if (validTags.length > 0) {
          await calculator.setTags(validTags);
        }
      }
      
      // Retornar calculadora com tags
      return await this.getCalculatorById(calculator.id, userId);
    } catch (error) {
      throw new Error(`Erro ao criar calculadora: ${error.message}`);
    }
  }

  /**
   * Lista calculadoras acessíveis pelo usuário
   * @param {string} userId - ID do usuário
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Array>} Lista de calculadoras
   */
  async getCalculators(userId, filters = {}) {
    try {
      const whereClause = {
        [Op.or]: [
          { is_public: true },
          { owner_id: userId }
        ]
      };

      // Aplicar filtros
      if (filters.category) {
        whereClause.category = filters.category;
      }

      if (filters.search) {
        whereClause[Op.or] = [
          ...whereClause[Op.or],
          {
            name: {
              [Op.iLike]: `%${filters.search}%`
            }
          },
          {
            description: {
              [Op.iLike]: `%${filters.search}%`
            }
          }
        ];
      }

      const calculators = await Calculator.findAll({
        where: whereClause,
        include: [{
          model: Tag,
          as: 'tags',
          attributes: ['id', 'nome'],
          through: { attributes: [] }
        }],
        order: [['created_at', 'DESC']],
        limit: filters.limit || 50,
        offset: filters.offset || 0
      });

      return calculators;
    } catch (error) {
      throw new Error(`Erro ao buscar calculadoras: ${error.message}`);
    }
  }

  /**
   * Obtém uma calculadora específica
   * @param {string} calculatorId - ID da calculadora
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Calculadora encontrada
   */
  async getCalculatorById(calculatorId, userId) {
    try {
      const calculator = await Calculator.findByPk(calculatorId, {
        include: [{
          model: Tag,
          as: 'tags',
          attributes: ['id', 'nome'],
          through: { attributes: [] }
        }]
      });
      
      if (!calculator) {
        throw new Error('Calculadora não encontrada');
      }

      if (!calculator.isAccessibleBy(userId)) {
        throw new Error('Acesso negado à calculadora');
      }

      return calculator;
    } catch (error) {
      throw new Error(`Erro ao buscar calculadora: ${error.message}`);
    }
  }

  /**
   * Atualiza uma calculadora
   * @param {string} calculatorId - ID da calculadora
   * @param {Object} updateData - Dados para atualização
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Calculadora atualizada
   */
  async updateCalculator(calculatorId, updateData, userId) {
    try {
      const calculator = await Calculator.findByPk(calculatorId);
      
      if (!calculator) {
        throw new Error('Calculadora não encontrada');
      }

      if (!calculator.isOwner(userId)) {
        throw new Error('Apenas o proprietário pode atualizar a calculadora');
      }

      // Validar nova fórmula se fornecida
      if (updateData.formula) {
        const fields = updateData.fields || calculator.fields;
        await this.validateFormula(updateData.formula, fields);
      }

      const { tagIds, ...calculatorFields } = updateData;

      await calculator.update(calculatorFields);
      
      // Atualizar tags se fornecidas
      if (tagIds !== undefined) {
        if (Array.isArray(tagIds) && tagIds.length > 0) {
          const validTags = await Tag.findAll({
            where: {
              id: {
                [Op.in]: tagIds
              }
            }
          });
          
          await calculator.setTags(validTags);
        } else {
          // Se tagIds for array vazio, remover todas as tags
          await calculator.setTags([]);
        }
      }
      
      // Retornar calculadora atualizada com tags
      return await this.getCalculatorById(calculatorId, userId);
    } catch (error) {
      throw new Error(`Erro ao atualizar calculadora: ${error.message}`);
    }
  }

  /**
   * Deleta uma calculadora
   * @param {string} calculatorId - ID da calculadora
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deleteCalculator(calculatorId, userId) {
    try {
      const calculator = await Calculator.findByPk(calculatorId);
      
      if (!calculator) {
        throw new Error('Calculadora não encontrada');
      }

      if (!calculator.isOwner(userId)) {
        throw new Error('Apenas o proprietário pode deletar a calculadora');
      }

      await calculator.destroy();
      return true;
    } catch (error) {
      throw new Error(`Erro ao deletar calculadora: ${error.message}`);
    }
  }

  /**
   * Avalia uma fórmula de forma segura
   * @param {string} formula - Fórmula a ser avaliada
   * @param {Object} variables - Variáveis para substituição
   * @returns {Promise<number>} Resultado do cálculo
   */
  async evaluateFormula(formula, variables = {}) {
    try {
      // Validar entrada
      if (!formula || typeof formula !== 'string') {
        throw new Error('Fórmula inválida');
      }

      // Sanitizar fórmula
      const sanitizedFormula = this.sanitizeFormula(formula);
      
      // Validar variáveis
      const sanitizedVariables = this.sanitizeVariables(variables);
      
      // Avaliar com timeout
      const result = await this.evaluateWithTimeout(sanitizedFormula, sanitizedVariables, 5000);
      
      // Validar resultado
      if (!isFinite(result)) {
        throw new Error('Resultado inválido (infinito ou NaN)');
      }
      
      return Number(result);
    } catch (error) {
      throw new Error(`Erro na avaliação: ${error.message}`);
    }
  }

  /**
   * Valida uma fórmula sem executá-la
   * @param {string} formula - Fórmula a ser validada
   * @param {Array} fields - Campos esperados
   * @returns {Promise<boolean>} Validade da fórmula
   */
  async validateFormula(formula, fields = []) {
    try {
      // Verificar se a fórmula contém apenas variáveis válidas
      const fieldNames = fields.map(field => field.name);
      const formulaVariables = this.extractVariables(formula);
      
      const invalidVariables = formulaVariables.filter(variable => 
        !fieldNames.includes(variable)
      );
      
      if (invalidVariables.length > 0) {
        throw new Error(`Variáveis inválidas na fórmula: ${invalidVariables.join(', ')}`);
      }

      // Testar com valores dummy
      const dummyValues = {};
      fieldNames.forEach(name => {
        dummyValues[name] = 1;
      });
      
      await this.evaluateFormula(formula, dummyValues);
      return true;
    } catch (error) {
      throw new Error(`Fórmula inválida: ${error.message}`);
    }
  }

  /**
   * Sanitiza uma fórmula removendo caracteres perigosos
   * @param {string} formula - Fórmula a ser sanitizada
   * @returns {string} Fórmula sanitizada
   */
  sanitizeFormula(formula) {
    // Remover caracteres perigosos
    const dangerous = /[;{}\[\]"'`\\]/g;
    let sanitized = formula.replace(dangerous, '');
    
    // Limitar tamanho
    if (sanitized.length > 1000) {
      throw new Error('Fórmula muito longa');
    }
    
    return sanitized;
  }

  /**
   * Sanitiza variáveis de entrada
   * @param {Object} variables - Variáveis a serem sanitizadas
   * @returns {Object} Variáveis sanitizadas
   */
  sanitizeVariables(variables) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(variables)) {
      // Validar nome da variável
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        throw new Error(`Nome de variável inválido: ${key}`);
      }
      
      // Validar valor
      const numValue = Number(value);
      if (!isFinite(numValue)) {
        throw new Error(`Valor inválido para ${key}: ${value}`);
      }
      
      sanitized[key] = numValue;
    }
    
    return sanitized;
  }

  /**
   * Extrai variáveis de uma fórmula
   * @param {string} formula - Fórmula para análise
   * @returns {Array} Lista de variáveis encontradas
   */
  extractVariables(formula) {
    const variableRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const matches = formula.match(variableRegex) || [];
    
    // Filtrar funções matemáticas conhecidas
    const mathFunctions = ['sin', 'cos', 'tan', 'log', 'sqrt', 'abs', 'ceil', 'floor', 'round', 'max', 'min'];
    
    return [...new Set(matches.filter(match => !mathFunctions.includes(match)))];
  }

  /**
   * Avalia fórmula com timeout
   * @param {string} formula - Fórmula a ser avaliada
   * @param {Object} variables - Variáveis
   * @param {number} timeout - Timeout em ms
   * @returns {Promise<number>} Resultado
   */
  async evaluateWithTimeout(formula, variables, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout na avaliação da fórmula'));
      }, timeout);
      
      try {
        const result = math.evaluate(formula, variables);
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Obtém categorias disponíveis
   * @returns {Promise<Array>} Lista de categorias
   */
  async getCategories() {
    try {
      const categories = await Calculator.findAll({
        attributes: ['category'],
        where: {
          category: {
            [Op.ne]: null
          }
        },
        group: ['category'],
        raw: true
      });
      
      return categories.map(cat => cat.category).filter(Boolean);
    } catch (error) {
      throw new Error(`Erro ao buscar categorias: ${error.message}`);
    }
  }
}

module.exports = new CalculatorService();