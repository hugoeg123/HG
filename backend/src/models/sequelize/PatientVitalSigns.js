const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');
const { getSocketService } = require('../../services/socket.registry');
const { calculateAlerts } = require('../../utils/vitalSignParser');

class PatientVitalSigns extends Model { }

PatientVitalSigns.init({
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
  systolic_bp: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  diastolic_bp: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  heart_rate: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  respiratory_rate: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  spo2: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  consciousness_level: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recorded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  recorded_by: {
    type: DataTypes.STRING,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'manual'
  }
}, {
  sequelize,
  modelName: 'PatientVitalSigns',
  tableName: 'patient_vital_signs',
  timestamps: true,
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['recorded_at'] }
  ],
  hooks: {
    afterCreate: async (vital, options) => {
      try {
        const socketService = getSocketService();
        if (!socketService) return;

        // Fetch patient to build context
        const Patient = sequelize.models.Patient;
        const patient = await Patient.findByPk(vital.patient_id);
        if (!patient) return;

        // Build Context
        let age = 25;
        if (patient.dateOfBirth) {
            const today = new Date();
            const birth = new Date(patient.dateOfBirth);
            age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
        }

        const isPregnant = patient.obstetrics?.currentlyPregnant === true; // Assuming structure based on frontend usage or model def
        // Check for COPD in chronicConditions
        // chronicConditions is JSONB, usually array of strings or objects
        const conditions = patient.chronicConditions || [];
        const hasCOPD = Array.isArray(conditions) && conditions.some(c => {
             const name = (typeof c === 'string') ? c : (c.condition_name || c.name || '');
             return /dpoc|copd/i.test(name);
        });

        const context = {
            age,
            isPregnant,
            hasCOPD,
            onRoomAir: true // Defaulting to true as per current requirements (no field for O2 therapy yet)
        };

        // Map model fields to parser expected fields
        const vitalsForParser = {
            systolic: vital.systolic_bp,
            diastolic: vital.diastolic_bp,
            heartRate: vital.heart_rate,
            respiratoryRate: vital.respiratory_rate,
            spo2: vital.spo2,
            temp: vital.temperature
        };

        const generatedAlerts = calculateAlerts(vitalsForParser, context);

        if (generatedAlerts.length > 0) {
          const Alert = sequelize.models.Alert;
          const targetUserId = patient.createdBy; // Notifying the creator (doctor)

          if (targetUserId) {
            // Join messages
            const message = `ALERTA VITAIS - ${patient.name}: ${generatedAlerts.map(a => a.message).join(' | ')}`;
            
            // Determine max severity
            let maxSeverity = 'warning';
            if (generatedAlerts.some(a => a.type === 'critical' || a.type === 'emergency')) {
                maxSeverity = 'critical';
            }

            // 1. Create Alert in DB
            const savedAlert = await Alert.create({
              user_id: targetUserId,
              patient_id: patient.id,
              record_id: null,
              message: message,
              severity: maxSeverity,
              is_read: false
            });

            // 2. Send Socket
            socketService.sendToUser(targetUserId, 'alert:new', savedAlert);
            console.log(`[Socket] Alerta enviado para médico ${targetUserId}: ${message}`);
          }
        }
      } catch (error) {
        console.error('Erro no hook afterCreate de PatientVitalSigns:', error);
      }
    }
  }
});

PatientVitalSigns.associate = (models) => {
  PatientVitalSigns.belongsTo(models.Patient, {
    foreignKey: 'patient_id',
    as: 'patient'
  });
};

module.exports = PatientVitalSigns;
