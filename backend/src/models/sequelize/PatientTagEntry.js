/**
 * Modelo PatientTagEntry (Sequelize/PostgreSQL)
 *
 * Define entradas de saúde fornecidas pelo paciente com tags estruturadas.
 *
 * Conector: Integrado com controllers/patientTag.controller.js
 * Hook: Usado para registrar inputs do paciente no perfil
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PatientTagEntry = sequelize.define('PatientTagEntry', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    // Origem do dado: 'patient' (padrão), 'device', 'import'
    source: {
      type: DataTypes.ENUM('patient', 'device', 'import'),
      allowNull: false,
      defaultValue: 'patient'
    },
    // Estrutura flexível de tags: { TAG_NAME: value }
    tags: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    // Texto livre para notas/sintomas
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Metadados adicionais (ex.: unidade de medida, device id)
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: 'patient_tag_entries',
    timestamps: true,
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['source'] },
      { fields: ['createdAt'] }
    ]
  });

  PatientTagEntry.associate = (models) => {
    PatientTagEntry.belongsTo(models.Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
  };

  return PatientTagEntry;
};