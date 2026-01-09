const patientAnonymizer = require('../services/anonymizer/PatientAnonymizer');

/**
 * Anonymization Controller
 * Handles the retrieval and transformation of patient data for RAG indexing.
 * INTERNAL USE ONLY.
 */
exports.getAnonymizedPatient = async (req, res) => {
    try {
        const { id } = req.params;

        // Delegate to shared service method
        const document = await patientAnonymizer.getAnonymizedPatientData(id);
        return res.json(document);

    } catch (error) {
        console.error('Anonymization Controller Error:', error);
        return res.status(500).json({
            error: 'Anonymization Process Failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
