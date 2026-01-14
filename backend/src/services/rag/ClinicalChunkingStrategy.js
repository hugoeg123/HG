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

    // ============================================
    // STRATEGIES
    // ============================================

    /**
     * Strategy: Shift-Based (e.g., UTI)
     * Groups records by relative date
     * Creates:
     * 1. Parent Chunk (Full Day Record) - No Embedding
     * 2. Child Chunks (Split by Tags) - Vectorized
     */
    strategyShiftBased(patientHash, context, records) {
        const groups = this.groupByField(records, 'relative_date');
        const chunks = [];

        for (const [date, items] of Object.entries(groups)) {
            const combinedContent = items.map(this.formatRecord).join('\n---\n');
            const parentDocPath = `${context}/${date.replace(/\s+/g, '_')}`;

            // 1. Parent Chunk (The "Source of Truth" for the LLM)
            chunks.push({
                doc_path: parentDocPath,
                context: context,
                tags: this.extractUniqueTags(items),
                content: `DATE: ${date}\n${combinedContent}`,
                embedding_content: `Context: ${context} | Parent: ${parentDocPath} | Date: ${date}`,
                metadata: {
                    type: 'parent',
                    subtype: 'day',
                    date_range: date,
                    count: items.length,
                    original_ids: items.map(i => i.id)
                },
                day_offset: this.extractDayOffset(date)
            });

            for (const record of items) {
                const recordParentDocPath = `${parentDocPath}/${this.getRecordId(record)}`;
                const recordText = this.formatRecord(record);

                chunks.push({
                    doc_path: recordParentDocPath,
                    context: context,
                    tags: this.normalizeTags(record.tags),
                    content: recordText,
                    embedding_content: `Context: ${context} | Parent: ${recordParentDocPath} | Date: ${date}`,
                    metadata: {
                        type: 'parent',
                        subtype: 'record',
                        parent_path: parentDocPath,
                        id: this.getRecordId(record)
                    },
                    day_offset: this.extractDayOffset(date)
                });

                const childChunks = this.createChildChunksFromText(
                    recordText,
                    recordParentDocPath,
                    context,
                    this.extractDayOffset(date)
                );
                chunks.push(...childChunks);
            }

            // 3. Structured Data Chunks (Level 1 - Keeping this for extra structure if needed)
            chunks.push(...this.extractLevel1Chunks(patientHash, context, items, date, parentDocPath));
        }
        return chunks;
    }

    /**
     * Strategy: Event-Based (e.g., Emergencia)
     * Each record is a Parent. Tags within it are Children.
     */
    strategyEventBased(patientHash, context, records) {
        const chunks = [];
        for (const record of records) {
            const date = record.relative_date;
            const parentDocPath = `${context}/${date.replace(/\s+/g, '_')}/${this.getRecordId(record)}`;

            // 1. Parent Chunk
            chunks.push({
                doc_path: parentDocPath,
                context: context,
                tags: this.normalizeTags(record.tags),
                content: this.formatRecord(record),
                embedding_content: `Context: ${context} | Parent: ${parentDocPath} | Date: ${date}`,
                metadata: { type: 'parent', subtype: 'record', id: this.getRecordId(record) },
                day_offset: this.extractDayOffset(date)
            });

            // 2. Child Chunks
            const childChunks = this.createChildChunksFromText(
                this.formatRecord(record),
                parentDocPath,
                context,
                this.extractDayOffset(date)
            );
            chunks.push(...childChunks);
        }
        return chunks;
    }

    /**
     * Strategy: Visit-Based (Ambulatorio)
     */
    strategyVisitBased(patientHash, context, records) {
        return this.strategyShiftBased(patientHash, context, records);
    }

    /**
     * Strategy: Semantic (Default)
     * Fallback that groups by batch but still tries to structure chunks
     */
    strategySemantic(patientHash, context, records) {
        return this.strategyEventBased(patientHash, context, records);
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * core Logic: Split text by Tags (#HMA, #ExameFisico, etc.)
     * Handles "Orphan" text (text before first tag) as a 'default' chunk.
     */
    createChildChunksFromText(fullText, parentPath, context, dayOffset) {
        const chunks = [];

        const blocks = this.parseStructuredBlocks(fullText);
        if (blocks.length === 0) {
            return chunks;
        }

        if (blocks.length === 1 && blocks[0].type === 'preamble') {
            chunks.push(this.createChildChunk(
                blocks[0].content,
                'default',
                parentPath,
                context,
                dayOffset
            ));
            return chunks;
        }

        for (const block of blocks) {
            if (!block.content || block.content.trim().length === 0) continue;
            chunks.push(this.createChildChunk(
                block.content,
                block.type === 'tag' ? block.tag : 'general',
                parentPath,
                context,
                dayOffset
            ));
        }

        return chunks;
    }

    parseStructuredBlocks(fullText) {
        const text = String(fullText || '');
        if (!text.trim()) return [];

        const lines = text.split(/\r?\n/);
        const blocks = [];

        let current = { type: 'preamble', tag: null, lines: [] };

        const flush = () => {
            const content = current.lines.join('\n').trim();
            if (content) {
                blocks.push({
                    type: current.type,
                    tag: current.tag,
                    content
                });
            }
        };

        for (const line of lines) {
            const match = line.match(/^\s*(#|>>)([A-Za-z0-9_]+)\b\s*:?\s*(.*)\s*$/);
            if (match) {
                flush();
                const [, , rawTag, inlineValue] = match;
                current = { type: 'tag', tag: rawTag, lines: [] };
                if (inlineValue && inlineValue.trim()) {
                    current.lines.push(inlineValue.trim());
                }
                continue;
            }
            current.lines.push(line);
        }

        flush();
        return blocks;
    }

    createChildChunk(content, tagName, parentPath, context, dayOffset) {
        const safeTag = tagName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        // Unique path for child: parent/tag_index (using hash of content to be safe or random)
        const uniqueSuffix = crypto.createHash('md5').update(content).digest('hex').substring(0, 6);

        return {
            doc_path: `${parentPath}/${safeTag}_${uniqueSuffix}`,
            context: context,
            tags: [tagName], // The specific tag of this chunk
            content: content,
            // Embedding should be focused on specific medical content
            embedding_content: `Context: ${context} | Tag: ${tagName} | Content: ${content}`,
            metadata: {
                type: 'child',
                parent_path: parentPath,
                tag_detected: tagName
            },
            day_offset: dayOffset
        };
    }

    /**
     * Level 1: Extract Structured Tags
     * (Updated to link to Parent)
     */
    extractLevel1Chunks(patientHash, context, records, dateReference, parentPath) {
        const chunks = [];

        records.forEach(record => {
            if (!record.structured_data) return;

            Object.entries(record.structured_data).forEach(([tag, content]) => {
                const enriched = `Context: ${context} | System: ${tag} | Date: ${record.relative_date} | Content: ${content}`;
                const recordId = this.getRecordId(record);
                const docPath = `${parentPath}/${tag}_${String(recordId).substring(0, 6)}`;

                chunks.push({
                    doc_path: docPath,
                    context: context,
                    tags: [tag],
                    content: `[${tag}] ${content}`,
                    embedding_content: enriched,
                    metadata: { type: 'child', parent_path: parentPath, origin: 'structured_data' },
                    day_offset: this.extractDayOffset(record.relative_date)
                });
            });
        });

        return chunks;
    }

    formatRecord(record) {
        let text = String(record.content_redacted || '');
        // Note: We don't append structured_data here to the text block automatically 
        // because we treat it separately or it might duplicate.
        // But for the Parent Record (Search Result), we WANT everything.
        if (record.structured_data) {
            text += '\n' + JSON.stringify(record.structured_data, null, 2);
        }
        return text.trim();
    }

    enrichRecord(record, context) {
        // Normalize tags to strings for embedding text
        const tagStrings = (record.tags || []).map(t => {
            if (typeof t === 'string') return t;
            if (typeof t === 'object' && t !== null && t.name) return t.name;
            return '';
        }).filter(t => t);

        return `Context: ${context} | Date: ${record.relative_date} | Tags: ${tagStrings.join(', ')} | Content: ${record.content_redacted}`;
    }

    extractUniqueTags(records) {
        const tags = new Set();
        records.forEach(r => {
            (r.tags || []).forEach(t => {
                if (typeof t === 'string') {
                    tags.add(t.replace(/^(#|>>)/, ''));
                } else if (typeof t === 'object' && t !== null && t.name) {
                    tags.add(String(t.name).replace(/^(#|>>)/, ''));
                }
            });
        });
        return Array.from(tags).filter(t => t); // Remove empty
    }

    normalizeTags(tagList) {
        const tags = [];
        for (const t of (tagList || [])) {
            if (typeof t === 'string') {
                const cleaned = t.trim().replace(/^(#|>>)/, '');
                if (cleaned) tags.push(cleaned);
                continue;
            }
            if (typeof t === 'object' && t !== null) {
                const name = t.name || t.nome || t.codigo;
                if (typeof name === 'string' && name.trim()) {
                    tags.push(name.trim().replace(/^(#|>>)/, ''));
                }
            }
        }
        return tags;
    }

    getRecordId(record) {
        return record?.id || record?.record_hash || record?.recordHash || 'unknown';
    }

    groupByField(array, field) {
        return array.reduce((acc, item) => {
            const key = item[field];
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
    }

    extractDayOffset(dateString) {
        if (!dateString) return 0;
        const match = dateString.match(/Day \+(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }
}

module.exports = new ClinicalChunkingStrategy();
