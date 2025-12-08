const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  /**
   * Appointment model
   *
   * Connectors:
   * - Referenced in controllers/agenda.controller.js for CRUD operations
   * - Joined with AvailabilitySlot (as 'slot') and Patient (as 'patient')
   *
   * Hook: Creation via agenda.controller.createAppointment sets `origin`
   * Context: `origin` indicates booking source for UI conditioning (doctor vs marketplace)
   */
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
    },
    // Booking origin/source (kept as STRING to avoid enum migration complexity)
    // Values used: 'doctor_manual' | 'patient_marketplace' | 'system'
    origin: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'doctor_manual'
    }
  }, {
    tableName: 'appointments',
    timestamps: true,
    indexes: [
      { fields: ['slot_id'] },
      { fields: ['patient_id'] },
      { fields: ['status'] },
      { fields: ['origin'] }
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