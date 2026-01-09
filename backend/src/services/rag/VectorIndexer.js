const chunkingStrategy = require('./ClinicalChunkingStrategy');
const ollamaService = require('../ollama.service');
const { PatientDocument } = require('../../models');

class VectorIndexer {
    constructor() {
        this.modelName = 'bge-m3';
        this.batchSize = 10;
    }

    /**
     * Main entry point: Index a patient's data
     * @param {Object} patient Anonymized Patient JSON (output of Phase 1)
     */
    async indexPatient(patient) {
        if (!patient || !patient.patient_hash) {
            throw new Error('Invalid patient data: missing hash');
        }

        console.log(`[VectorIndexer] Starting indexing for patient ${patient.patient_hash.substring(0, 8)}...`);

        // 1. Chunk the data
        const chunks = chunkingStrategy.process(patient);
        console.log(`[VectorIndexer] Generated ${chunks.length} chunks.`);

        // 2. Process in batches
        for (let i = 0; i < chunks.length; i += this.batchSize) {
            const batch = chunks.slice(i, i + this.batchSize);
            await this.processBatch(patient.patient_hash, batch);
            console.log(`[VectorIndexer] Indexed batch ${i / this.batchSize + 1}/${Math.ceil(chunks.length / this.batchSize)}`);
        }

        console.log(`[VectorIndexer] Completed indexing for patient ${patient.patient_hash.substring(0, 8)}.`);
        return { success: true, chunks: chunks.length };
    }

    /**
     * Process a batch of chunks: Generate Embeddings -> Upsert to DB
     */
    async processBatch(patientHash, chunks) {
        const enrichedChunks = [];

        for (const chunk of chunks) {
            let vector = null;
            try {
                vector = await ollamaService.embeddings(this.modelName, chunk.embedding_content);
            } catch (err) {
                console.error(`[VectorIndexer] Error generating embedding for doc_path ${chunk.doc_path}:`, err.message);
            }

            enrichedChunks.push({
                ...chunk,
                patient_hash: patientHash,
                embedding: vector
            });
        }

        // Upsert to Database
        // We use bulkCreate with updateOnDuplicate for idempotency
        try {
            await PatientDocument.bulkCreate(enrichedChunks, {
                updateOnDuplicate: ['context', 'tags', 'content', 'embedding_content', 'embedding', 'metadata', 'day_offset', 'updated_at'],
                conflictAttributes: ['patient_hash', 'doc_path']
            });
        } catch (dbError) {
            console.error('[VectorIndexer] DB Upsert Error:', dbError);
            throw dbError;
        }
    }
}

module.exports = new VectorIndexer();
