const {
    Patient,
    PatientAnthropometrics,
    PatientLifestyle,
    PatientCondition,
    PatientVitalSigns,
    sequelize
} = require('../models/sequelize');

const ProfileController = {
    // Get full profile with latest snapshots
    getProfile: async (req, res) => {
        try {
            const { patientId } = req.params;

            const patient = await Patient.findByPk(patientId, {
                attributes: { exclude: ['password_hash'] }
            });

            if (!patient) {
                return res.status(404).json({ message: 'Patient not found' });
            }

            // Get latest anthropometrics
            const anthropometrics = await PatientAnthropometrics.findOne({
                where: { patient_id: patientId },
                order: [['recorded_at', 'DESC']]
            });

            // Get latest lifestyle
            const lifestyle = await PatientLifestyle.findOne({
                where: { patient_id: patientId },
                order: [['recorded_at', 'DESC']]
            });

            // Get all active conditions
            const conditions = await PatientCondition.findAll({
                where: { patient_id: patientId },
                order: [['onset_date', 'DESC']]
            });

            // Get latest vital signs
            const vitalSigns = await PatientVitalSigns.findOne({
                where: { patient_id: patientId },
                order: [['recorded_at', 'DESC']]
            });

            return res.json({
                patient,
                anthropometrics,
                lifestyle,
                conditions,
                vitalSigns
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            return res.status(500).json({ message: 'Error fetching profile', error: error.message });
        }
    },

    // Add anthropometrics entry
    addAnthropometrics: async (req, res) => {
        try {
            const { patientId } = req.params;
            const { weight_kg, height_m, recorded_at } = req.body;

            let bmi = null;
            if (weight_kg && height_m) {
                bmi = weight_kg / (height_m * height_m);
            }

            const entry = await PatientAnthropometrics.create({
                patient_id: patientId,
                weight_kg,
                height_m,
                bmi,
                recorded_at: recorded_at || new Date(),
                recorded_by: req.user?.id // Assuming auth middleware populates req.user
            });

            // Notify clients about the update
            try {
                const { getSocketService } = require('../services/socket.registry');
                const socketService = getSocketService();
                if (socketService) {
                    socketService.sendToRoom(`patient:${patientId}`, `patient:${patientId}:update`, { 
                        type: 'anthropometrics', 
                        entry 
                    });
                }
            } catch (sockErr) {
                console.warn('Socket emit failed:', sockErr.message);
            }

            return res.status(201).json(entry);
        } catch (error) {
            console.error('Error adding anthropometrics:', error);
            return res.status(500).json({ message: 'Error adding anthropometrics', error: error.message });
        }
    },

    // Add lifestyle snapshot
    addLifestyle: async (req, res) => {
        try {
            const { patientId } = req.params;
            const data = req.body;

            // Calculate pack_years if applicable
            if (data.smoking_status === 'current' || data.smoking_status === 'former') {
                if (data.cigarettes_per_day && data.years_smoked) {
                    data.pack_years = (data.cigarettes_per_day / 20) * data.years_smoked;
                }
            }

            const entry = await PatientLifestyle.create({
                patient_id: patientId,
                ...data,
                recorded_at: data.recorded_at || new Date()
            });

            return res.status(201).json(entry);
        } catch (error) {
            console.error('Error adding lifestyle:', error);
            return res.status(500).json({ message: 'Error adding lifestyle', error: error.message });
        }
    },

    // Add condition
    addCondition: async (req, res) => {
        try {
            const { patientId } = req.params;
            const data = req.body;

            const entry = await PatientCondition.create({
                patient_id: patientId,
                ...data,
                recorded_at: data.recorded_at || new Date()
            });

            return res.status(201).json(entry);
        } catch (error) {
            console.error('Error adding condition:', error);
            return res.status(500).json({ message: 'Error adding condition', error: error.message });
        }
    },

    // Update condition (e.g. resolve it)
    updateCondition: async (req, res) => {
        try {
            const { patientId, conditionId } = req.params;
            const data = req.body;

            const condition = await PatientCondition.findOne({
                where: { id: conditionId, patient_id: patientId }
            });

            if (!condition) {
                return res.status(404).json({ message: 'Condition not found' });
            }

            await condition.update(data);
            return res.json(condition);
        } catch (error) {
            console.error('Error updating condition:', error);
            return res.status(500).json({ message: 'Error updating condition', error: error.message });
        }
    },

    // Add vital signs
    addVitalSigns: async (req, res) => {
        try {
            const { patientId } = req.params;
            const data = req.body;

            const entry = await PatientVitalSigns.create({
                patient_id: patientId,
                ...data,
                recorded_at: data.recorded_at || new Date(),
                recorded_by: req.user?.id
            });

            return res.status(201).json(entry);
        } catch (error) {
            console.error('Error adding vital signs:', error);
            return res.status(500).json({ message: 'Error adding vital signs', error: error.message });
        }
    }
};

module.exports = ProfileController;
