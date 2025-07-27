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
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      // Converter para maiúsculas para consistência
      this.setDataValue('nome', value.toUpperCase());
    }
  },
  // Cor da tag (hexadecimal)
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#6366f1',
    validate: {
      isValidColor(value) {
        if (value && !/^#[0-9A-F]{6}$/i.test(value)) {
          throw new Error('Cor deve estar no formato hexadecimal (#RRGGBB)');
        }
      }
    }
  },
  
  // Campo virtual para compatibilidade com frontend
  name: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.nome;
    },
    set(value) {
      this.setDataValue('nome', value);
    }
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
      fields: ['nome']
    }
  ]
});

module.exports = Tag;