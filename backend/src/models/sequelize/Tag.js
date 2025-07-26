/**
 * Modelo de Tag (Sequelize/PostgreSQL)
 * 
 * Define a estrutura de dados para tags no PostgreSQL usando Sequelize
 * 
 * Conector: Integra com o sistema de banco de dados PostgreSQL e é usado pelos controladores
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

/**
 * Modelo Sequelize para Tag
 * @class Tag
 * @extends Model
 */
class Tag extends Model {}

Tag.init({
  // ID da tag (chave primária)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Nome da tag (único)
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      // Converter para maiúsculas para consistência
      this.setDataValue('name', value.toUpperCase());
    }
  },
  // Cor da tag
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#3B82F6' // Azul padrão
  },
  // Descrição da tag
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Metadados adicionais
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // ID do usuário que criou a tag
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Tag',
  tableName: 'tags',
  timestamps: true,
  indexes: [
    // Índice para busca por nome
    {
      fields: ['name']
    }
  ]
});

module.exports = Tag;