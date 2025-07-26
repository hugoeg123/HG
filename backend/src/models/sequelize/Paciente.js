/**
 * Modelo Sequelize para Pacientes
 * 
 * MISSÃO ZERO-DÉBITO: Modelo simplificado para pacientes
 * focado no sistema de prontuário dinâmico
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Paciente = sequelize.define('Paciente', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    nome: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [2, 500]
      }
    }
  }, {
    tableName: 'pacientes',
    timestamps: true,
    indexes: [
      {
        fields: ['nome']
      }
    ]
  });

  Paciente.associate = (models) => {
    // Um paciente pode ter muitos registros
    Paciente.hasMany(models.Registro, {
      foreignKey: 'paciente_id',
      as: 'registros'
    });
  };

  return Paciente;
};