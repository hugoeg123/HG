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
class Record extends Model { }

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
      model: 'medicos',
      key: 'id'
    }
  },
  // ID do usuário que atualizou o registro pela última vez
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'medicos',
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
Record.findByTag = async function (tagName, patientId = null) {
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
Record.findByType = async function (type, patientId = null) {
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

Record.addHook('afterCreate', async (record, options) => {
  try {
    // Dynamic import to avoid circular dependency issues during model init
    // Ideally RetrievalService should be robust enough, but let's be safe.
    // However, services usually import models, so importing service here is circular.
    // We can use a lazy require inside the hook.

    // Check if we are in a transaction? Usually safe to fire-and-forget or await if critical.
    // For RAG, we can fire-and-forget or catch errors to not block the main transaction if possible.
    // But since hooks run within transaction if options.transaction is present, we should be careful.
    // We'll run it purely async without awaiting, or await if we want to guarantee consistency.
    // Let's run it non-blocking to avoid latency in UI.

    const retrievalService = require('../../services/RetrievalService');
    console.log(`[Record Hook] New record created for patient ${record.patientId}. Triggering background re-index...`);

    // Fire and forget
    retrievalService.indexPatient(record.patientId).catch(err => {
      console.error(`[Record Hook] Background Indexing failed for ${record.patientId}:`, err);
    });

  } catch (error) {
    console.error('[Record Hook] Error triggering index:', error);
  }
});

Record.addHook('afterUpdate', async (record, options) => {
  try {
    const retrievalService = require('../../services/RetrievalService');
    console.log(`[Record Hook] Record updated for patient ${record.patientId}. Triggering background re-index...`);

    retrievalService.indexPatient(record.patientId).catch(err => {
      console.error(`[Record Hook] Background Indexing failed for ${record.patientId}:`, err);
    });

  } catch (error) {
    console.error('[Record Hook] Error triggering index:', error);
  }
});

module.exports = Record;