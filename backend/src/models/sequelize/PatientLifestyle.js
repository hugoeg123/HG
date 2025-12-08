const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

class PatientLifestyle extends Model { }

PatientLifestyle.init({
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
    // Smoking
    smoking_status: {
        type: DataTypes.ENUM('never', 'former', 'current'),
        defaultValue: 'never'
    },
    cigarettes_per_day: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    years_smoked: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    pack_years: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    years_since_quit: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    // Alcohol
    drinks_per_week: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    binge_last_30_days: {
        type: DataTypes.ENUM('none', '1', '2-3', '4+'),
        defaultValue: 'none'
    },
    // Exercise
    mod_minutes_per_week: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    vig_minutes_per_week: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    strength_days_per_week: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Metadata
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
    modelName: 'PatientLifestyle',
    tableName: 'patient_lifestyles',
    timestamps: true
});

module.exports = PatientLifestyle;
