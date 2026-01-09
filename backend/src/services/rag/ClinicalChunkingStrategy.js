const crypto = require('crypto');

/**
 * ClinicalChunkingStrategy
 * 
 * Implements the "Medical-Semantic Splitting" logic.
 * Treats medical records like a software project:
 * - Demographics -> README/Header
 * - Contexts -> Directories
 * - Tags -> Functions/Classes
 * - Records -> Code
 */
class ClinicalChunkingStrategy {
    constructor() {
        this.strategies = {
            'uti': this.strategyShiftBased.bind(this),
            'emergencia': this.strategyEventBased.bind(this),
            'patient_reported': this.strategyEventBased.bind(this), // High relevance
            'ambulatorio': this.strategyVisitBased.bind(this), // If needed
            'default': this.strategySemantic.bind(this)
        };
    }

    /**
     * Main entry point to chunk a patient
     * @param {Object} patient Anonymized Patient JSON
     * @returns {Array} Array of chunks ready for indexing
     */
    process(patient) {
        const chunks = [];
        const patientHash = patient.patient_hash;

        // LEVEL 0: Demographics (The "README")
        chunks.push(this.createDemographicsChunk(patient));

        // Group timeline by context to apply Level 2 strategies
        const timelineByContext = this.groupTimelineByContext(patient.timeline);

        for (const [context, records] of Object.entries(timelineByContext)) {
            const strategy = this.strategies[context] || this.strategies['default'];

            // Execute Strategy
            const contextChunks = strategy(patientHash, context, records);
            chunks.push(...contextChunks);
        }

        return chunks;
    }

    /**
     * Level 0: Static Demographics Chunk
     */
    createDemographicsChunk(patient) {
        // Handle structure: user passed { patient: { age_bucket, gender, ... }, ... }
        const pData = patient.patient || {};
        const age = pData.age_bucket || 'Unknown';
        const gender = pData.gender || 'Unknown';

        const content = `DEMOGRAPHICS\nAge: ${age}\nGender: ${gender}`;
        return {
            doc_path: 'demographics',
            context: 'demographics',
            tags: ['DEMOGRAPHICS'],
            content: content,
            embedding_content: `Context: Demographics | Content: ${content}`,
            metadata: { type: 'demographics' },
            day_offset: 0
        };
    }

    /**
     * Groups timeline items by their 'context' field
     */
    groupTimelineByContext(timeline) {
        return timeline.reduce((acc, item) => {
            const ctx = item.context || 'default';
            if (!acc[ctx]) acc[ctx] = [];
            acc[ctx].push(item);
            return acc;
        }, {});
    }

    // ============================================
    // STRATEGIES
    // ============================================

    /**
     * Strategy: Shift-Based (e.g., UTI)
     * Groups records by relative date (and potentially shift if we had time, but for now Day based)
     */
    strategyShiftBased(patientHash, context, records) {
        // For now, grouping by Relative Date (Day +X)
        const groups = this.groupByField(records, 'relative_date');
        const chunks = [];

        for (const [date, items] of Object.entries(groups)) {
            const combinedContent = items.map(this.formatRecord).join('\n---\n');
            const enriched = items.map(i => this.enrichRecord(i, context)).join('\n');

            chunks.push({
                doc_path: `${context}/${date.replace(/\s+/g, '_')}`,
                context: context,
                tags: this.extractUniqueTags(items),
                content: `DATE: ${date}\n${combinedContent}`,
                embedding_content: `Context: ${context} | Date: ${date}\n${enriched}`,
                metadata: { date_range: date, count: items.length },
                day_offset: this.extractDayOffset(date)
            });

            // Level 1: Extract Structured Tags into separate chunks
            chunks.push(...this.extractLevel1Chunks(patientHash, context, items, date));
        }
        return chunks;
    }

    /**
     * Strategy: Event-Based (e.g., Emergency, Patient Reported)
     * Treats each record as a critical standalone event
     */
    strategyEventBased(patientHash, context, records) {
        return records.map(record => {
            const date = record.relative_date;
            return {
                doc_path: `${context}/${date.replace(/\s+/g, '_')}/${record.id}`,
                context: context,
                tags: record.tags || [],
                content: this.formatRecord(record),
                embedding_content: this.enrichRecord(record, context),
                metadata: { id: record.id, type: 'event' },
                day_offset: this.extractDayOffset(date)
            };
        });
    }

    /**
     * Strategy: Visit-Based (Ambulatorio)
     * Placeholder for now, reusing ShiftBased logic of grouping by date
     */
    strategyVisitBased(patientHash, context, records) {
        return this.strategyShiftBased(patientHash, context, records);
    }

    /**
     * Strategy: Semantic (Default)
     * Fallback that groups by token limit (simplified to N records for MVP)
     */
    strategySemantic(patientHash, context, records) {
        // Simple batching for now (e.g., 3 records per chunk)
        const BATCH_SIZE = 3;
        const chunks = [];

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            const dateRange = `${batch[0].relative_date} - ${batch[batch.length - 1].relative_date}`;
            const combinedContent = batch.map(this.formatRecord).join('\n---\n');
            const enriched = batch.map(rec => this.enrichRecord(rec, context)).join('\n');

            chunks.push({
                doc_path: `${context}/chunk_${Math.floor(i / BATCH_SIZE)}`,
                context: context,
                tags: this.extractUniqueTags(batch),
                content: combinedContent,
                embedding_content: `Context: ${context} | Range: ${dateRange}\n${enriched}`,
                metadata: { batch_index: i, count: batch.length },
                day_offset: this.extractDayOffset(batch[0].relative_date)
            });

            // Level 1 extraction for default records too? Yes, if meaningful tags exist.
            chunks.push(...this.extractLevel1Chunks(patientHash, context, batch, dateRange));
        }
        return chunks;
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Level 1: Extract Structured Tags
     * If a record has "structured_data" with keys like "NEUROLOGICAL", save them as focused chunks.
     */
    extractLevel1Chunks(patientHash, context, records, dateReference) {
        const chunks = [];

        records.forEach(record => {
            if (!record.structured_data) return;

            Object.entries(record.structured_data).forEach(([tag, content]) => {
                const enriched = `Context: ${context} | System: ${tag} | Date: ${record.relative_date} | Content: ${content}`;
                const docPath = `${context}/${record.relative_date.replace(/\s+/g, '_')}/${tag}_${record.id.substring(0, 6)}`;

                chunks.push({
                    doc_path: docPath,
                    context: context,
                    tags: [tag],
                    content: `[${tag}] ${content}`,
                    embedding_content: enriched,
                    metadata: { parent_id: record.id, type: 'structured_tag' },
                    day_offset: this.extractDayOffset(record.relative_date)
                });
            });
        });

        return chunks;
    }

    formatRecord(record) {
        let text = `[${record.relative_date}] ${record.content_redacted}`;
        if (record.structured_data) {
            text += '\n' + JSON.stringify(record.structured_data, null, 2);
        }
        return text;
    }

    enrichRecord(record, context) {
        // Create a dense representation for embedding
        return `Context: ${context} | Date: ${record.relative_date} | Tags: ${(record.tags || []).join(',')} | Content: ${record.content_redacted}`;
    }

    extractUniqueTags(records) {
        const tags = new Set();
        records.forEach(r => (r.tags || []).forEach(t => tags.add(t)));
        return Array.from(tags);
    }

    groupByField(array, field) {
        return array.reduce((acc, item) => {
            const key = item[field];
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
    }

    /**
     * Extracts integer day offset from "Day +45"
     */
    extractDayOffset(dateString) {
        if (!dateString) return 0;
        const match = dateString.match(/Day \+(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }
}

module.exports = new ClinicalChunkingStrategy();
