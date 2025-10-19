const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AvailabilitySlot = sequelize.define('AvailabilitySlot', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    medico_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'medicos',
        key: 'id'
      }
    },
    start_time: {
      type: 'TIMESTAMPTZ',
      allowNull: false
    },
    end_time: {
      type: 'TIMESTAMPTZ',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('available', 'booked', 'blocked'),
      allowNull: false,
      defaultValue: 'available'
    },
    modality: {
      type: DataTypes.ENUM('presencial', 'telemedicina', 'domiciliar'),
      allowNull: false,
      defaultValue: 'presencial'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'availability_slots',
    timestamps: true,
    indexes: [
      { fields: ['medico_id'] },
      { fields: ['start_time'] },
      { fields: ['status'] },
      { fields: ['modality'] },
      { fields: ['medico_id', 'start_time'] }
    ]
  });

  AvailabilitySlot.associate = (models) => {
    AvailabilitySlot.belongsTo(models.Medico, {
      foreignKey: 'medico_id',
      as: 'medico'
    });

    AvailabilitySlot.hasMany(models.Appointment, {
      foreignKey: 'slot_id',
      as: 'appointments',
      onDelete: 'CASCADE'
    });
  };

  return AvailabilitySlot;
};