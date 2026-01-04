/**
 * LGPD Anonymization Configuration
 * Defines rules for whitelisting, blacklisting, and data bucketing.
 */

module.exports = {
    // FIELDS ALLOWED TO PASS THROUGH (Whitlist)
    // Everything else is stripped from the final JSON.
    SAFE_FIELDS: [
        'id', 'gender', 'bloodType', 'race_color', // Demographics
        'weight', 'height', 'bmi', // Anthropometrics
        'allergies', 'chronicConditions', 'medications', // Clinical History (Structured)
        'type', 'title', 'specialty', // Record Metadata
        // 'tags' ? - Tags might contain PII if user-generated. Be careful.
        // We will handle tags separately or require them to be cleaned.
    ],

    // FIELDS THAT MUST NOT EXIST IN FINAL OUTPUT (Auditing)
    // Presence of these keys or values triggers Failsafe 500 Error.
    BLACKLIST_FIELDS: [
        'name', 'full_name', 'patient_name',
        'email', 'personal_email',
        'phone', 'cellphone', 'telephone', 'mobile',
        'cpf', 'rg', 'cns', 'cnh', 'passport',
        'address', 'street', 'city', 'state', 'zipCode', 'zip_code',
        'birthDate', 'dateOfBirth', // Must be converted to bucket
        'mother_name', 'father_name',
        'emergencyContactName', 'emergencyContactPhone'
    ],

    // BUCKETING RULES
    BUCKETING: {
        AGE_BUCKET_SIZE: parseInt(process.env.ANONYMIZER_AGE_BUCKET_SIZE || '5'), // 5-year groups
        DATE_GRANULARITY: 'relative', // 'relative' (Day +X) or 'quarter' (2023-Q1)
        MAX_AGE_CAP: 90 // Ages > 90 become "90+"
    }
};
