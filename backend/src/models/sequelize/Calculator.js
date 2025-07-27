/**
 * Modelo de Calculadora (Sequelize/PostgreSQL)
 * 
 * Define a estrutura de dados para calculadoras médicas no PostgreSQL usando Sequelize
 * 
 * Conector: Integra com o sistema de banco de dados PostgreSQL e é usado pelos controladores
 * Hook: Referenciado em calculator.service.js para operações CRUD
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

/**
 * Modelo Sequelize para Calculadora
 * @class Calculator
 * @extends Model
 * 
 * Integra com:
 * - services/calculator.service.js para lógica de negócio
 * - controllers/calculator.controller.js para operações CRUD
 * - routes/calculator.routes.js via controlador
 */
class Calculator extends Model {
  /**
   * Verifica se o usuário é o proprietário da calculadora
   * @param {string} userId - ID do usuário
   * @returns {boolean} Verdadeiro se o usuário for o proprietário
   */
  isOwner(userId) {
    return this.owner_id === userId;
  }

  /**
   * Verifica se a calculadora é acessível pelo usuário
   * @param {string} userId - ID do usuário
   * @returns {boolean} Verdadeiro se for pública ou do usuário
   */
  isAccessibleBy(userId) {
    return this.is_public || this.isOwner(userId);
  }

  /**
   * Valida os campos da calculadora
   * @returns {boolean} Verdadeiro se os campos são válidos
   */
  validateFields() {
    if (!Array.isArray(this.fields)) return false;
    
    return this.fields.every(field => {
      return field.name && 
             field.label && 
             field.type && 
             ['number', 'text', 'select', 'boolean'].includes(field.type);
    });
  }
}

Calculator.init({
  // ID da calculadora (chave primária)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Nome da calculadora
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  // Descrição da calculadora
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Categoria da calculadora
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  // Fórmula compatível com mathjs
  formula: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  // Campos de entrada (JSONB para flexibilidade)
  fields: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidFieldsArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Fields deve ser um array');
        }
        
        for (const field of value) {
          if (!field.name || !field.label || !field.type) {
            throw new Error('Cada campo deve ter name, label e type');
          }
          
          if (!['number', 'text', 'select', 'boolean'].includes(field.type)) {
            throw new Error('Tipo de campo inválido');
          }
        }
      }
    }
  },
  // Indica se a calculadora é pública
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // ID do usuário proprietário
  owner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Calculator',
  tableName: 'calculators',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    // Índice para busca por categoria
    {
      fields: ['category']
    },
    // Índice para busca por proprietário
    {
      fields: ['owner_id']
    },
    // Índice para calculadoras públicas
    {
      fields: ['is_public']
    },
    // Índice composto para busca eficiente
    {
      fields: ['owner_id', 'is_public']
    }
  ]
});

module.exports = Calculator;