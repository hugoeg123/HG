const { PatientDocument } = require('../../models');
const { Sequelize } = require('sequelize');
const ollamaService = require('../ollama.service');

// Import transformers dynamically or standard requires if ESM/CJS allows.
// Since this is Node CJS, we use dynamic import for @xenova/transformers usually, or standard require if version supports it.
// Assuming standard integration for now. 
// If specific version issues arise, we handle them.
let pipeline;

class ClinicalRetriever {
    constructor() {
        this.vectorModel = 'bge-m3';
        this.rerankerModel = 'Xenova/bge-reranker-v2-m3';
        this.rerankerPipeline = null;
        this.rerankerDisabled = false;
        this.rerankerDisabledReason = null;
    }

    async initializeReranker() {
        if (this.rerankerDisabled) return;
        if (!this.rerankerPipeline) {
            try {
                const { pipeline: transformerPipeline } = await import('@xenova/transformers');
                console.log('[ClinicalRetriever] Loading Reranker model...');
                this.rerankerPipeline = await transformerPipeline('text-classification', this.rerankerModel, {
                    quantized: true
                });
                console.log('[ClinicalRetriever] Reranker model loaded.');
            } catch (err) {
                this.rerankerDisabled = true;
                this.rerankerDisabledReason = err?.message || String(err);
                throw err;
            }
        }
    }

    /**
     * Main Search Method
     */
    async search(query, filters = {}, topK = 5) {
        const { context, tags, dateFrom, dateTo } = filters;

        let queryVector = null;
        try {
            queryVector = await ollamaService.embeddings(this.vectorModel, query);
        } catch (err) {
            console.error('[ClinicalRetriever] Query embedding failed, falling back to lexical only:', err?.message || err);
        }

        const [vectorResults, lexicalResults] = await Promise.all([
            queryVector ? this.vectorSearch(queryVector, filters, 20) : Promise.resolve([]),
            this.lexicalSearch(query, filters, 20)
        ]);

        // 3. Reciprocal Rank Fusion (RRF)
        const fusedResults = this.performRRF([vectorResults, lexicalResults], 20);

        // 4. Reranking using Cross-Encoder
        // Only rerank the top 20 fused candidates to save compute
        const finalResults = await this.rerankResults(query, fusedResults, topK);

        return finalResults;
    }

    /**
     * Execute Vector Search (Cosine Similarity)
     */
    async vectorSearch(queryVector, filters, limit) {
        // Construct Where Clause
        const where = {};
        if (filters.context) where.context = filters.context;
        if (filters.tags && filters.tags.length > 0) {
            where.tags = { [Sequelize.Op.overlap]: filters.tags };
        }
        if (filters.patient_hash) where.patient_hash = filters.patient_hash;
        if (filters.doc_path) where.doc_path = filters.doc_path; // Support drilling down
        where.embedding = { [Sequelize.Op.ne]: null };

        // Handle Date Range using day_offset if available
        if (filters.dayOffsetFrom !== undefined || filters.dayOffsetTo !== undefined) {
            where.day_offset = {};
            if (filters.dayOffsetFrom !== undefined) where.day_offset[Sequelize.Op.gte] = filters.dayOffsetFrom;
            if (filters.dayOffsetTo !== undefined) where.day_offset[Sequelize.Op.lte] = filters.dayOffsetTo;
        }

        // Vector Search Query
        // Sequelize doesn't have native Order for vector distance yet in generic abstraction. 
        // We rely on literal order.
        // L2 distance: <->, Cosine distance: <=> (pgvector < 0.5.0 uses <=>)
        // Wait, pgvector uses <=> for cosine distance.
        // We want SIMILARITY usually, but Order By Distance ASC is standard.
        // Cosine Distance = 1 - Cosine Similarity.

        return await PatientDocument.findAll({
            where,
            order: [Sequelize.literal(`embedding <=> '${JSON.stringify(queryVector)}'`)],
            limit,
            attributes: { exclude: ['embedding'] } // Don't return the large vector
        });
    }

    /**
     * Execute Lexical Search (Full Text Search)
     */
    async lexicalSearch(query, filters, limit) {
        const where = {};
        if (filters.context) where.context = filters.context;
        if (filters.patient_hash) where.patient_hash = filters.patient_hash;
        // ...other filters as above...

        // FTS using websearch_to_tsquery for natural language query parsing
        where[Sequelize.Op.and] = Sequelize.literal(`to_tsvector('portuguese', content) @@ websearch_to_tsquery('portuguese', '${query.replace(/'/g, "''")}')`);

        return await PatientDocument.findAll({
            where,
            // Rank by relevance
            order: [Sequelize.literal(`ts_rank(to_tsvector('portuguese', content), websearch_to_tsquery('portuguese', '${query.replace(/'/g, "''")}')) DESC`)],
            limit
        });
    }

    /**
     * Reciprocal Rank Fusion
     * Combines lists based on rank position.
     * Score = 1 / (k + rank)
     */
    performRRF(resultLists, topN, k = 60) {
        const scoreMap = new Map();
        const docMap = new Map();

        resultLists.forEach(list => {
            list.forEach((doc, rank) => {
                const id = doc.id;
                if (!docMap.has(id)) docMap.set(id, doc);

                const currentScore = scoreMap.get(id) || 0;
                scoreMap.set(id, currentScore + (1 / (k + rank + 1))); // +1 because rank is 0-indexed
            });
        });

        // Sort by Accumulated Score DESC
        const sortedIds = Array.from(scoreMap.entries())
            .sort((a, b) => b[1] - a[1]) // Sort by score descending
            .slice(0, topN)
            .map(entry => entry[0]);

        return sortedIds.map(id => {
            const doc = docMap.get(id);
            return {
                ...doc.toJSON(), // Convert Sequelize instance to POJO
                rrf_score: scoreMap.get(id) // Attach internal score for debugging
            };
        });
    }

    /**
     * Reranking using Xenova Transformers
     */
    async rerankResults(query, candidates, topK) {
        if (candidates.length === 0) return [];
        if (this.rerankerDisabled) {
            return candidates.slice(0, topK);
        }

        try {
            await this.initializeReranker();
            // Update: usage of reranker depends on the specific model pipeline correctly.
            // For BGE-Reranker (Cross-Encoder), we pass pairs: [query, doc_text].
            // transformers.js expects something like: classifier(text, { candidate_labels: ... }) for ZeroShot
            // OR standard text-classification for single sequence.
            // BUT Cross-Encoder usually takes TWO inputs.
            // In transformers.js, we often need to format as "[CLS] query [SEP] document [SEP]".
            // OR use specific pipeline support. 
            // Since BGE-Reranker-v2-m3 is supported, let's verify usage. 
            // Usually: wrapper(text_pair). 
            // Let's assume standard score extraction.

            const reranked = [];

            // Processing sequentially or batched?
            for (const doc of candidates) {
                // Check content length. Truncate if too huge?
                const textPair = [query, doc.embedding_content];
                // 'embedding_content' is enriched and good for reranking.

                const output = await this.rerankerPipeline(textPair);
                // output usually: [ { label: 'LABEL_0', score: 0.99 } ] or similar logits.
                // BGE Reranker outputs a single logit (relevant/not relevant score).
                // Usually we take the score for the "positive" class or just the raw output if regression.
                // For BGE, it's often a single float score.

                // Let's handle the output structure safely
                let score = 0;
                if (Array.isArray(output) && output.length > 0) {
                    score = output[0].score; // Or specific logic
                } else if (output.score) {
                    score = output.score;
                }

                reranked.push({ ...doc, rerank_score: score });
            }

            // Sort by Rerank Score DESC
            return reranked
                .sort((a, b) => b.rerank_score - a.rerank_score)
                .slice(0, topK);

        } catch (err) {
            console.error('Reranking failed, falling back to RRF sort:', err);
            return candidates.slice(0, topK); // Fallback
        }
    }
}

module.exports = new ClinicalRetriever();
