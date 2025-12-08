const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

class PatientCondition extends Model { }

PatientCondition.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    patient_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'patients',
            key: 'id'
        }
    },
    condition_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    onset_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    resolution_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'resolved', 'inactive'),
        defaultValue: 'active'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    recorded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    source: {
        type: DataTypes.STRING,
        defaultValue: 'patient_profile'
    }
}, {
    sequelize,
    modelName: 'PatientCondition',
    tableName: 'patient_conditions',
    timestamps: true
});

module.exports = PatientCondition;
