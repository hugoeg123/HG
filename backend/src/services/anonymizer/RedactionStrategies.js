/**
 * RedactionStrategies.js
 * Implements specific logic to strip PII from text.
 * Future-proof: Can be extended to use NLP/LLM strategies.
 */

class RegexStrategy {
    constructor() {
        // Pre-compiled regexes for performance
        this.patterns = {
            // CPF: 11 digits, with or without dots/hyphens
            cpf: {
                regex: /(?:\d{3}\.?){3}-?\d{2}/g,
                replacement: '[CPF_REDACTED]'
            },
            // CNS (Cartão Nacional de Saúde): 15 digits, often starting with 7, 8, 1, 2
            cns: {
                regex: /\b[12789]\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\b/g,
                replacement: '[CNS_REDACTED]'
            },
            // Email
            email: {
                regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Simplificated robust email regex
                replacement: '[EMAIL_REDACTED]'
            },
            // Phone (Mobile & Landline in BR format)
            // Covers: (11) 91234-5678, 11 912345678, +55 11..., 91234-5678
            phone: {
                regex: /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-.\s]?\d{4})\b/g,
                replacement: '[PHONE_REDACTED]'
            },
            // Zip Code (CEP): 8 digits
            cep: {
                regex: /\b\d{5}-?\d{3}\b/g,
                replacement: '[CEP_REDACTED]'
            },
            // Basic Dates (DD/MM/YYYY or YYYY-MM-DD) - to avoid absolute date leakage in text
            date: {
                regex: /\b(?:\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/g,
                replacement: '[DATE_REDACTED]'
            }
        };

        // Heuristics for Entities (Naive NER)
        this.entityPatterns = [
            // Titles
            { regex: /\b(Dr\.|Dra\.|Sr\.|Sra\.)\s+([A-Z][a-zà-ú]+)\b/g, replacement: '$1 [NOME_REDACTED]' },
            // Address markers
            { regex: /\b(Rua|Av\.|Avenida|Alameda|Travessa)\s+([A-Z][a-zà-ú]+)/g, replacement: '$1 [ENDERECO_REDACTED]' },
            // Numbers indicative of address number
            { regex: /\bnº\s*\d+/gi, replacement: '[NUM_REDACTED]' }
        ];
    }

    /**
     * Main processing method
     * @param {string} text - Raw text
     * @param {object} context - Metadata (e.g., patientName for self-leakage)
     */
    process(text, context = {}) {
        if (!text || typeof text !== 'string') return text;

        let processed = text;

        // 1. Normalize (Unicode NFD to handle accents more easily if needed, but keeping simple for now)
        // processed = processed.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 

        // 2. Dynamic Self-Leakage Protection (Patient's Own Name)
        // "Maria complained that Maria's leg hurts" -> "Maria complained that [PATIENT_NAME]'s leg hurts"
        if (context.patientName) {
            const cleanName = context.patientName.trim();
            if (cleanName.length > 3) {
                // Split full name into parts to catch first/last names individually if they are distinctive?
                // Risk: "da", "de", "silva" are too common.
                // Better strategy: Redact the Full Name first.
                const fullNameRegex = new RegExp(this.escapeRegExp(cleanName), 'gi');
                processed = processed.replace(fullNameRegex, '[PATIENT_NAME]');

                // Optional: Redact first name if uncommon? For now let's stick to Full Name 
                // or distinct parts to avoid destroying text readability.
                // We can also use the first name if it's provided specifically.
            }
        }

        // 3. Static PII Patterns
        for (const [key, config] of Object.entries(this.patterns)) {
            processed = processed.replace(config.regex, config.replacement);
        }

        // 4. Entity Heuristics
        this.entityPatterns.forEach(p => {
            processed = processed.replace(p.regex, p.replacement);
        });

        return processed;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

module.exports = new RegexStrategy();
