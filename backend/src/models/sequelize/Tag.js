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
class Tag extends Model { }

Tag.init({
  // ID da tag (chave primária)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // ID do médico que criou a tag
  medico_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'medicos',
      key: 'id'
    }
  },
  // ID da tag pai (para hierarquia)
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tags',
      key: 'id'
    }
  },
  // Código da tag (ex: #DX, #MEDICAMENTO)
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      is: /^#\w+|##\w+/
    }
  },
  // Nome da tag
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  // Tipo de dado da tag
  tipo_dado: {
    type: DataTypes.ENUM('texto', 'numero', 'data', 'booleano', 'bp'),
    allowNull: false
  },
  // Regras de validação (JSON)
  regras_validacao: {
    type: DataTypes.JSONB,
    defaultValue: {}
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
  }
}, {
  sequelize,
  modelName: 'Tag',
  tableName: 'tags',
  timestamps: true,
  // createdAt: 'created_at',
  // updatedAt: 'updated_at',
  indexes: [
    // Índice para busca por nome
    {
      fields: ['nome']
    }
  ]
});

module.exports = Tag;