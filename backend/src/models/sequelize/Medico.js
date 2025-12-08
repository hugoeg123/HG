/**
 * Modelo Sequelize para Médicos
 * 
 * MISSÃO ZERO-DÉBITO: Modelo para isolamento por médico
 * com autenticação JWT e gestão de tags personalizadas
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Medico = sequelize.define('Medico', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [2, 255]
      }
    },
    senha_hash: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    professional_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'medico'
    },
    professional_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    specialty: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    titulo_profissional: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Título profissional do médico (ex: Cardiologista, Clínico Geral)'
    },
    biografia: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Biografia/apresentação profissional do médico'
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL da foto de perfil do médico'
    },
    curriculo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL do currículo em PDF do médico'
    },
    formacao: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Lista de formações acadêmicas do médico'
    },
    experiencias: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Lista de experiências profissionais do médico'
    },
    public_visibility: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Controle de visibilidade pública no marketplace'
    }
  }, {
    tableName: 'medicos',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  Medico.associate = (models) => {
    // Um médico pode ter muitas tags personalizadas
    Medico.hasMany(models.TagDinamica, {
      foreignKey: 'medico_id',
      as: 'tags'
    });

    // Um médico pode criar muitos registros
    Medico.hasMany(models.Registro, {
      foreignKey: 'medico_id',
      as: 'registros'
    });
  };

  return Medico;
};