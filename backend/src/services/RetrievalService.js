const patientAnonymizer = require('./anonymizer/PatientAnonymizer');
const vectorIndexer = require('./rag/VectorIndexer');

class RetrievalService {
    /**
     * Full Indexing Workflow for a Patient
     * 1. Fetches data from DB (via Anonymizer helper)
     * 2. Anonymizes data
     * 3. Chunks and Indexes (Vector + DB)
     * @param {string} patientId 
     */
    async indexPatient(patientId) {
        console.log(`[RetrievalService] Triggering indexing for patientId: ${patientId}`);
        try {
            // 1. Get Anonymized Data (Standardized Format)
            const anonymizedData = await patientAnonymizer.getAnonymizedPatientData(patientId);

            // 2. Pass to Vector Indexer
            const result = await vectorIndexer.indexPatient(anonymizedData);

            console.log(`[RetrievalService] Indexing success for ${anonymizedData.patient_hash}. processed ${result.chunks} chunks.`);
            return {
                success: true,
                patient_hash: anonymizedData.patient_hash,
                ...result
            };

        } catch (error) {
            console.error(`[RetrievalService] Indexing failed for patientId ${patientId}:`, error);
            // We don't throw here if we want to fail gracefully in background hooks, 
            // but for API calls we might want to propagate.
            throw error;
        }
    }
}

module.exports = new RetrievalService();
