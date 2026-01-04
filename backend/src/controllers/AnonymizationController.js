const { Patient, Record } = require('../models/sequelize');
const patientAnonymizer = require('../services/anonymizer/PatientAnonymizer');

/**
 * Anonymization Controller
 * Handles the retrieval and transformation of patient data for RAG indexing.
 * INTERNAL USE ONLY.
 */
exports.getAnonymizedPatient = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch Raw Data
        // We need the raw data to perform the transformation, specifically DOB and Name for context.
        const patient = await Patient.findByPk(id);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const records = await Record.findAll({
            where: { patientId: id, isDeleted: false },
            order: [['date', 'ASC']]
        });

        // 2. Anonymize Patient
        const anonymizedPatient = patientAnonymizer.anonymizePatient(patient);

        // 3. Anonymize Records (w/ Context)
        const anonymizedRecords = [];
        const failClosed = patientAnonymizer.strictMode;

        // We pass the RAW patient data to anonymizeRecord because it needs Name & DOB
        // for self-leakage redaction and relative date calculation.
        for (const record of records) {
            try {
                const anonRecord = patientAnonymizer.anonymizeRecord(record, patient);
                anonymizedRecords.push(anonRecord);
            } catch (err) {
                if (err.message.startsWith('PII_AUDIT_FAILURE')) {
                    if (failClosed) {
                        throw err;
                    }
                    console.error(`Skipping Record ${record.id} due to PII Audit Failure.`);
                    continue;
                }
                throw err; // Other errors pass through
            }
        }

        // 4. Construct Final Document
        const document = {
            patient: anonymizedPatient,
            timeline: anonymizedRecords,
            meta: {
                total_records: records.length,
                anonymized_count: anonymizedRecords.length,
                skipped_count: records.length - anonymizedRecords.length,
                doc_path: `patient/${anonymizedPatient.patient_hash}/full_history`
            }
        };

        return res.json(document);

    } catch (error) {
        console.error('Anonymization Controller Error:', error);
        return res.status(500).json({
            error: 'Anonymization Process Failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
