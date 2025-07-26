/**
 * Modelo de Template
 * 
 * Define a estrutura de dados para templates de registros médicos no PostgreSQL
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Nome do template
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  // Descrição do template
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Tipo de registro associado ao template
  recordType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  // Seções do template (JSON)
  sections: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  // Conteúdo padrão
  defaultContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Indica se o template está ativo
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Usuário que criou o template
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'templates',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['recordType']
    },
    {
      fields: ['isActive']
    }
  ]
});

// Definir associações
Template.associate = (models) => {
  Template.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
};

module.exports = Template;