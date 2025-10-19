const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    slot_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'availability_slots',
        key: 'id'
      }
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('booked', 'cancelled', 'completed', 'no_show'),
      allowNull: false,
      defaultValue: 'booked'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'appointments',
    timestamps: true,
    indexes: [
      { fields: ['slot_id'] },
      { fields: ['patient_id'] },
      { fields: ['status'] }
    ]
  });

  Appointment.associate = (models) => {
    Appointment.belongsTo(models.AvailabilitySlot, {
      foreignKey: 'slot_id',
      as: 'slot'
    });

    Appointment.belongsTo(models.Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
  };

  return Appointment;
};