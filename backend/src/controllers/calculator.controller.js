/**
 * Controlador de Calculadora
 * 
 * Gerencia requisições HTTP para operações CRUD de calculadoras
 * e avaliação segura de fórmulas
 * 
 * Conectores:
 * - services/calculator.service.js para lógica de negócio
 * - routes/calculator.routes.js como consumidor
 * - middleware/auth.middleware.js para autenticação
 */

const { validationResult } = require('express-validator');
const calculatorService = require('../services/calculator.service');

/**
 * Controlador de Calculadora
 * @class CalculatorController
 */
class CalculatorController {
  /**
   * Cria uma nova calculadora
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  async createCalculator(req, res) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const userId = req.user.sub;
      const calculatorData = req.body;

      const calculator = await calculatorService.createCalculator(calculatorData, userId);

      res.status(201).json({
        success: true,
        message: 'Calculadora criada com sucesso',
        data: calculator
      });
    } catch (error) {
      console.error('Erro ao criar calculadora:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  /**
   * Lista calculadoras acessíveis pelo usuário
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  async getCalculators(req, res) {
    try {
      const userId = req.user.sub;
      const filters = {
        category: req.query.category,
        search: req.query.search,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const calculators = await calculatorService.getCalculators(userId, filters);

      res.status(200).json(calculators);
    } catch (error) {
      console.error('Erro ao buscar calculadoras:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém uma calculadora específica
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  async getCalculatorById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          errors: errors.array()
        });
      }

      const calculatorId = req.params.id;
      const userId = req.user.sub;

      const calculator = await calculatorService.getCalculatorById(calculatorId, userId);

      res.status(200).json({
        success: true,
        message: 'Calculadora encontrada',
        data: calculator
      });
    } catch (error) {
      console.error('Erro ao buscar calculadora:', error);
      
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualiza uma calculadora
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  async updateCalculator(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const calculatorId = req.params.id;
      const userId = req.user.sub;
      const updateData = req.body;

      const calculator = await calculatorService.updateCalculator(calculatorId, updateData, userId);

      res.status(200).json({
        success: true,
        message: 'Calculadora atualizada com sucesso',
        data: calculator
      });
    } catch (error) {
      console.error('Erro ao atualizar calculadora:', error);
      
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('proprietário')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  /**
   * Deleta uma calculadora
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  async deleteCalculator(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          errors: errors.array()
        });
      }

      const calculatorId = req.params.id;
      const userId = req.user.sub;

      await calculatorService.deleteCalculator(calculatorId, userId);

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar calculadora:', error);
      
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('proprietário')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Avalia uma fórmula de forma segura
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  async evaluateFormula(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { formula, variables } = req.body;

      const result = await calculatorService.evaluateFormula(formula, variables);

      res.status(200).json({
        success: true,
        message: 'Fórmula avaliada com sucesso',
        data: {
          result: result,
          formula: formula,
          variables: variables
        }
      });
    } catch (error) {
      console.error('Erro ao avaliar fórmula:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro na avaliação da fórmula'
      });
    }
  }

  /**
   * Obtém categorias disponíveis
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  async getCategories(req, res) {
    try {
      const categories = await calculatorService.getCategories();

      res.status(200).json({
        success: true,
        message: 'Categorias recuperadas com sucesso',
        data: categories
      });
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Valida uma fórmula sem executá-la
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   */
  async validateFormula(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }

      const { formula, fields } = req.body;

      const isValid = await calculatorService.validateFormula(formula, fields);

      res.status(200).json({
        success: true,
        message: 'Fórmula validada com sucesso',
        data: {
          valid: isValid,
          formula: formula
        }
      });
    } catch (error) {
      console.error('Erro ao validar fórmula:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro na validação da fórmula',
        data: {
          valid: false,
          formula: req.body.formula
        }
      });
    }
  }
}

module.exports = new CalculatorController();