const clinicalRetriever = require('../services/rag/ClinicalRetriever');
const vectorIndexer = require('../services/rag/VectorIndexer');
const patientAnonymizer = require('../services/anonymizer/PatientAnonymizer');
const { Patient } = require('../models');

class RetrievalController {

    /**
     * POST /api/retrieval/debug
     * Endpoint for visualizing retrieval logic
     */
    async debug(req, res) {
        try {
            const { query, filters } = req.body;

            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            const safeFilters = { ...(filters || {}) };
            if (!safeFilters.patient_hash) {
                if (!safeFilters.patientId) {
                    return res.status(400).json({ error: 'patientId is required' });
                }

                const patient = await Patient.findByPk(safeFilters.patientId);
                if (!patient) {
                    return res.status(404).json({ error: 'Paciente não encontrado' });
                }

                if (req.user && req.user.id && patient.createdBy !== req.user.id) {
                    return res.status(403).json({ error: 'Acesso negado' });
                }

                safeFilters.patient_hash = patientAnonymizer.hashId(patient.id);
                delete safeFilters.patientId;
            }

            console.log(`[RetrievalController] Debugging query: "${query}" with filters:`, safeFilters);

            // Call Retriever (getting more results for debug visualization)
            const results = await clinicalRetriever.search(query, safeFilters, 10);

            // Return results with scoring details
            return res.json({
                success: true,
                count: results.length,
                results: results.map(r => ({
                    id: r.id,
                    doc_path: r.doc_path,
                    content: r.content, // Snippet or full? Full for debug
                    context: r.context,
                    tags: r.tags,
                    score_rrf: r.rrf_score,
                    score_rerank: r.rerank_score
                }))
            });

        } catch (error) {
            console.error('[RetrievalController] Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/retrieval/index-sample
     * Helper to manually trigger indexing for a sample (dev only)
     */
    async indexSample(req, res) {
        try {
            const patientData = req.body;
            // Validate basic structure
            if (!patientData.patient_hash || !patientData.timeline) {
                return res.status(400).json({ error: 'Invalid patient JSON' });
            }

            const result = await vectorIndexer.indexPatient(patientData);
            return res.json(result);
        } catch (error) {
            console.error('[RetrievalController] Index Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

const instance = new RetrievalController();
console.log('[RetrievalController] Instance created. Debug method:', instance.debug ? 'Found' : 'Missing');
module.exports = instance;
