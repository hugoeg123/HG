const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

class PatientAnthropometrics extends Model { }

PatientAnthropometrics.init({
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
    weight_kg: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    height_m: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    bmi: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    recorded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    source: {
        type: DataTypes.STRING,
        defaultValue: 'patient_profile'
    },
    recorded_by: {
        type: DataTypes.UUID,
        allowNull: true // Could be patient or doctor
    }
}, {
    sequelize,
    modelName: 'PatientAnthropometrics',
    tableName: 'patient_anthropometrics',
    timestamps: true
});

module.exports = PatientAnthropometrics;
