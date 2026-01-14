const clinicalRetriever = require('../services/rag/ClinicalRetriever');
const vectorIndexer = require('../services/rag/VectorIndexer');
const retrievalService = require('../services/RetrievalService');
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
            // Enable debug mode to get full pipeline details
            const results = await clinicalRetriever.search(query, safeFilters, 10, true);

            // Return results directly as they are already formatted by ClinicalRetriever in debug mode
            return res.json({
                success: true,
                results
            });

        } catch (error) {
            console.error('[RetrievalController] Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/retrieval/inspect/:patientId
     * Inspect all indexed documents for a patient
     */
    async inspect(req, res) {
        try {
            const { patientId } = req.params;

            const patient = await Patient.findByPk(patientId);
            if (!patient) {
                return res.status(404).json({ error: 'Paciente não encontrado' });
            }

            if (req.user && req.user.id && patient.createdBy !== req.user.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const patient_hash = patientAnonymizer.hashId(patient.id);
            const { PatientDocument } = require('../models');

            const documents = await PatientDocument.findAll({
                where: { patient_hash },
                order: [['created_at', 'DESC']],
                attributes: ['id', 'doc_path', 'context', 'tags', 'content', 'created_at', 'metadata']
            });

            // Count with embeddings
            const total = documents.length;
            const withEmbedding = await PatientDocument.count({
                where: {
                    patient_hash,
                    embedding: { [require('sequelize').Op.ne]: null }
                }
            });

            res.json({
                total,
                withEmbedding,
                documents
            });
        } catch (error) {
            console.error('[RetrievalController] Inspect Error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/retrieval/reindex/:patientId
     * Manually trigger full re-indexing for a patient
     */
    async reindex(req, res) {
        try {
            const { patientId } = req.params;

            const patient = await Patient.findByPk(patientId);
            if (!patient) {
                return res.status(404).json({ error: 'Paciente não encontrado' });
            }

            if (req.user && req.user.id && patient.createdBy !== req.user.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const result = await retrievalService.indexPatient(patientId);
            return res.json(result);
        } catch (error) {
            console.error('[RetrievalController] Reindex Error:', error);
            // Return full error details for debugging
            return res.status(500).json({
                error: error.message,
                stack: error.stack,
                type: error.name
            });
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
