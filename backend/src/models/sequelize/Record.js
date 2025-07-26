/**
 * Modelo de Registro Médico (Sequelize/PostgreSQL)
 * 
 * Define a estrutura de dados para registros médicos no PostgreSQL usando Sequelize
 * 
 * Conector: Integra com o sistema de banco de dados PostgreSQL e é usado pelos controladores
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

/**
 * Modelo Sequelize para Registro Médico
 * @class Record
 * @extends Model
 */
class Record extends Model {}

Record.init({
  // ID do registro (chave primária)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // ID do paciente associado ao registro
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  // Título do registro
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Tipo de registro (consulta, exame, procedimento, etc.)
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Data do registro
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  // Conteúdo principal do registro
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Tags associadas ao registro (array JSON)
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Arquivos anexados (array JSON)
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // ID do usuário que criou o registro
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // ID do usuário que atualizou o registro pela última vez
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Indica se o registro foi excluído (exclusão lógica)
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Metadados adicionais
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'Record',
  tableName: 'records',
  timestamps: true,
  indexes: [
    // Índice para busca por paciente e data
    {
      fields: ['patientId', 'date'],
      order: [['date', 'DESC']]
    },
    // Índice para busca por paciente e tipo
    {
      fields: ['patientId', 'type']
    },
    // Índice para busca por conteúdo (pesquisa de texto)
    {
      fields: ['content'],
      using: 'GIN',
      operator: 'gin_trgm_ops'
    }
  ]
});

/**
 * Método para buscar registros por tag
 * @param {string} tagName - Nome da tag
 * @param {string} patientId - ID do paciente (opcional)
 * @returns {Promise<Array>} Lista de registros
 */
Record.findByTag = async function(tagName, patientId = null) {
  const query = {
    isDeleted: false,
    tags: {
      [sequelize.Op.contains]: [{ name: tagName.toUpperCase() }]
    }
  };
  
  if (patientId) {
    query.patientId = patientId;
  }
  
  return await this.findAll({
    where: query,
    order: [['date', 'DESC']]
  });
};

/**
 * Método para buscar registros por tipo
 * @param {string} type - Tipo de registro
 * @param {string} patientId - ID do paciente (opcional)
 * @returns {Promise<Array>} Lista de registros
 */
Record.findByType = async function(type, patientId = null) {
  const query = {
    type,
    isDeleted: false
  };
  
  if (patientId) {
    query.patientId = patientId;
  }
  
  return await this.findAll({
    where: query,
    order: [['date', 'DESC']]
  });
};

module.exports = Record;