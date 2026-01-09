const crypto = require('crypto');
const redactionStrategy = require('./RedactionStrategies');
const config = require('../../config/anonymization.config');

class PatientAnonymizer {
    constructor() {
        this.key = process.env.ANONYMIZER_KEY;
        this.strictMode = process.env.ANONYMIZER_STRICT_MODE === 'true';

        // FAIL-CLOSED: Ensure Key exists
        if (!this.key || this.key.length < 32) {
            throw new Error('CRITICAL SEC ERROR: ANONYMIZER_KEY is missing or too weak (min 32 chars). Anonymizer cannot start.');
        }
    }

    /**
     * Pseudonymization: HMAC-SHA256
     * Deterministic logic: Same input + Same Key = Same Output
     */
    hashId(originalId) {
        if (!originalId) return null;
        return crypto
            .createHmac('sha256', this.key)
            .update(String(originalId))
            .digest('hex');
    }

    /**
     * Calculates Age Bucket from Date of Birth
     * Returns: "30-34" or "90+"
     */
    getAgeBucket(dateOfBirth) {
        if (!dateOfBirth) return 'Unknown';
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) return 'Invalid';

        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs); // epoch
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        const maxAge = config.BUCKETING.MAX_AGE_CAP;
        if (age >= maxAge) return `${maxAge}+`;

        const range = config.BUCKETING.AGE_BUCKET_SIZE;
        const lower = Math.floor(age / range) * range;
        return `${lower}-${lower + range - 1}`;
    }

    /**
     * Relative Date Calculation
     * Returns: "Day +120", "Day -30", "Day 0"
     */
    calculateRelativeDay(targetDate, referenceDate) {
        if (!targetDate || !referenceDate) return null;
        const t = new Date(targetDate);
        const ref = new Date(referenceDate);

        if (isNaN(t.getTime()) || isNaN(ref.getTime())) return null;

        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round((t - ref) / oneDay);

        return diffDays >= 0 ? `Day +${diffDays}` : `Day ${diffDays}`;
    }

    /**
     * Whitelist Filter
     * Removes any key not in SAFE_FIELDS
     */
    filterSafeFields(data) {
        const safeData = {};
        config.SAFE_FIELDS.forEach(field => {
            if (data[field] !== undefined && data[field] !== null) {
                safeData[field] = data[field];
            }
        });
        return safeData;
    }

    /**
     * Audit for PII Leaks
     * Checks final object strings against Blacklist regexes
     */
    auditForPII(anonymizedObj) {
        const jsonStr = JSON.stringify(anonymizedObj).toLowerCase();
        const violations = [];

        // Check simple Key names that might have leaked (e.g., if someone added 'email' to safe list by mistake)
        config.BLACKLIST_FIELDS.forEach(badField => {
            // Look for "badField": value pattern in JSON
            if (jsonStr.includes(`"${badField.toLowerCase()}":`)) {
                violations.push(`Schema Violation: Field '${badField}' detected in output.`);
            }
        });

        // Check values using Redaction Regexes to see if they match raw PII
        // We check the stringified content against the Patterns defined in RedactionStrategy
        const patterns = redactionStrategy.patterns;
        for (const [key, patternConfig] of Object.entries(patterns)) {
            // We assume RedactionStrategy patterns are robust enough to find leaks.
            // If we find a match in the JSON string that IS NOT the placeholder, it's a leak.
            // However, looking for matches is simpler: if the output contains "123.456.789-00", it's a leak.
            const auditRegex = new RegExp(
                patternConfig.regex.source,
                patternConfig.regex.flags.replace('g', '')
            );
            if (auditRegex.test(jsonStr)) {
                // We must filter out matches that are actually safely redacted placeholders?
                // No, the regex matches the PII itself (digits), not the string "[CPF_REDACTED]".
                // So if we match anything, it means raw PII is present.
                violations.push(`Content Violation: Potential ${key.toUpperCase()} detected.`);
            }
        }

        return {
            hasPII: violations.length > 0,
            violations
        };
    }

    /**
     * Main Patient Flow
     */
    anonymizePatient(patientModel) {
        const p = patientModel.toJSON ? patientModel.toJSON() : patientModel;

        // 1. Structural Anonymization
        const safeData = this.filterSafeFields(p);

        // 2. Add Derbyved/Pseudonymized Fields
        const patientHash = this.hashId(p.id);
        const ageBucket = this.getAgeBucket(p.dateOfBirth);

        const anonymized = {
            ...safeData,
            id: patientHash, // Replace UUID with Hash
            patient_hash: patientHash, // Redundant but explicit
            age_bucket: ageBucket,
            meta: {
                anonymizer_version: '1.0.0',
                generated_at: new Date().toISOString()
            }
        };

        return anonymized;
    }

    /**
     * Main Record Flow
     */
    anonymizeRecord(recordModel, patientData) {
        const r = recordModel.toJSON ? recordModel.toJSON() : recordModel;

        // Context for Redaction
        const context = {
            patientName: patientData.name // Used for self-leakage removal
        };

        // 1. Redact Content
        // Assuming record has 'content', 'title', 'notes'
        // We iterate over likely text fields
        const redactedContent = redactionStrategy.process(r.content, context);
        // If you have specific structured fields inside content, you might need deep traversal.
        // For now assuming 'content' is the main text body.

        // 2. Relative Date
        const relDate = this.calculateRelativeDay(r.date, patientData.dateOfBirth);

        const anonymizedRecord = {
            record_hash: this.hashId(r.id),
            patient_hash: this.hashId(patientData.id),
            type: r.type,
            relative_date: relDate,
            day_offset: relDate ? parseInt(relDate.replace('Day ', ''), 10) : null,
            content_redacted: redactedContent,
            tags: r.tags || [] // Watch out for PII in tags
        };

        // 3. Audit Checks (Fail-Closed)
        if (this.strictMode) {
            // Run regex check on the scrubbed content one last time
            // Just a simple heuristic check
            const audit = this.auditForPII(anonymizedRecord);
            if (audit.hasPII) {
                console.error(`[Anonymizer] AUDIT FAILED for Record ${r.id}:`, audit.violations);
                throw new Error('PII_AUDIT_FAILURE: Anonymized record contains prohibited data.');
            }
        }

        return anonymizedRecord;
    }

    /**
     * Helper to get full anonymized patient data for indexing
     */
    async getAnonymizedPatientData(patientId) {
        // Dynamic import to avoid circular dependency if models import this service
        const { Patient, Record } = require('../../models/sequelize'); // Adjust path as needed

        // 1. Fetch Raw Data
        const patient = await Patient.findByPk(patientId);
        if (!patient) {
            throw new Error(`Patient ${patientId} not found`);
        }

        const records = await Record.findAll({
            where: { patientId: patientId, isDeleted: false },
            order: [['date', 'ASC']]
        });

        // 2. Anonymize Patient
        const anonymizedPatient = this.anonymizePatient(patient);

        // 3. Anonymize Records (w/ Context)
        const anonymizedRecords = [];
        const failClosed = this.strictMode;

        for (const record of records) {
            try {
                const anonRecord = this.anonymizeRecord(record, patient);
                anonymizedRecords.push(anonRecord);
            } catch (err) {
                if (err.message.startsWith('PII_AUDIT_FAILURE')) {
                    if (failClosed) {
                        throw err;
                    }
                    console.error(`Skipping Record ${record.id} due to PII Audit Failure.`);
                    continue;
                }
                throw err;
            }
        }

        // 4. Construct Final Document
        return {
            patient_hash: anonymizedPatient.patient_hash, // Explicit top-level hash
            patient: anonymizedPatient,
            timeline: anonymizedRecords,
            meta: {
                total_records: records.length,
                anonymized_count: anonymizedRecords.length,
                skipped_count: records.length - anonymizedRecords.length,
                doc_path: `patient/${anonymizedPatient.patient_hash}/full_history`
            }
        };
    }
}

module.exports = new PatientAnonymizer();
