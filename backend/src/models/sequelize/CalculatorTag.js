/**
 * Modelo de Associação Calculator-Tag (Sequelize/PostgreSQL)
 * 
 * Define a tabela de junção para a relação many-to-many entre Calculator e Tag
 * 
 * Conector: Integra com o sistema de banco de dados PostgreSQL
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

/**
 * Modelo Sequelize para associação Calculator-Tag
 * @class CalculatorTag
 * @extends Model
 */
class CalculatorTag extends Model {}

CalculatorTag.init({
  // ID da calculadora
  calculator_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'calculators',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  // ID da tag
  tag_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tags',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  sequelize,
  modelName: 'CalculatorTag',
  tableName: 'calculator_tags',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    // Índice único para evitar duplicatas
    {
      unique: true,
      fields: ['calculator_id', 'tag_id']
    },
    // Índice para busca por calculadora
    {
      fields: ['calculator_id']
    },
    // Índice para busca por tag
    {
      fields: ['tag_id']
    }
  ]
});

module.exports = CalculatorTag;