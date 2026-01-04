LGPD Anonymization Layer Implementation Plan
Goal Description
Implement a robust, failsafe, and auditable LGPD Anonymization Layer in Node.js. This service acts as a middleware to transform raw SQL data into anonymized JSON objects for Vector Store indexing. It prioritizes privacy (fail-closed), clinical utility (relative timelines), and future extensibility.

User Review Required
IMPORTANT

Security Key: Requires ANONYMIZER_KEY (min 32 chars) for HMAC-SHA256. Mismatched keys break index consistency. Fail-Closed: Service throws critical errors if configuration is missing or if PII is detected during audit (blocking indexing). Data Strategy: Using Relative Dates (Day +X) and Age Buckets (5y, 90+) to preserve clinical progression without identifying absolute timestamps.

Proposed Changes
Configuration
[MODIFY] 
backend/.env.example
Add ANONYMIZER_KEY (Secret for HMAC).
Add ANONYMIZER_STRICT_MODE (Boolean).
Add ANONYMIZER_AGE_BUCKET_SIZE (Default: 5).
[NEW] 
backend/src/config/anonymization.config.js
Safe Fields (Whitelist): Explicitly allowed fields (e.g., gender, blood_type).
Blacklist: Fields that trigger audit failure if detected (e.g., cpf, email).
Buckets Config: Global settings for age and date handling.
Backend Services
[NEW] 
backend/src/services/anonymizer/PatientAnonymizer.js
Core Class: PatientAnonymizer
Pseudonymization:
hashId(id): HMAC-SHA256.
Data Transformation:
bucketizeAge(date): 5-year buckets, handles "90+".
calculateRelativeDay(date, refDate): transforms dates to D+12, D-305.
Redaction Orchestration:
redactText(text, context): Calls Strategy. Injects patientName for dynamic self-leakage protection.
auditForPII(doc): Final fail-safe check against Regex patterns.
Workflow:
anonymizePatient(patient): Whitelist filtering + transformation.
anonymizeRecord(record, context): Redaction + Relative Date calculation.
[NEW] 
backend/src/services/anonymizer/RedactionStrategies.js
Strategy Pattern: Extensible class.
Process:
Normalization: Unicode/Case.
Dynamic Redaction: Remove specific Patient Name (Self-Leakage).
Pattern Redaction: Regex for CPF, CNS, Email, Phone, Address, Dates.
Entity Redaction: Basic heuristics for Names (Dr., Sr.), Addresses (Rua, Av).
Backend Controllers
[NEW] 
backend/src/controllers/AnonymizationController.js
getAnonymizedPatient(req, res)
Internal/Protected Route.
Fetches Patient + Relations (Records, etc.).
Orchestrates Anonymization.
Failsafe: If auditForPII fails, returns 500 error and logs violation (without sensitive data).
Returns Versioned JSON (Schema v1, Hash v1).
Integration
[MODIFY] 
backend/src/routes/index.js
Register GET /api/anonymization/patient/:id (Protected, Admin/System usage).
Verification Plan
Automated Tests
[NEW] 
backend/test/anonymizer.test.js
Unit:
HMAC consistency check.
Age Bucket (standard & 90+).
Relative Date calculation (positive/negative/zero).
Whitelist validation (unknown fields are dropped).
Text Redaction: CPF, Phone, Email, Patient Name in text.
Integration/Audit:
Feed "Toxic" data (text with PII). Verify auditForPII triggers hasPII: true.
Verify Controller returns 500 on audit failure.
Manual Verification
Env Setup: Set ANONYMIZER_KEY=test-secret.
Toxic Test: Create a temporary patient "Mario" with text "Mario has CPF 123.456...".
Execution: Call endpoint.
Expectation: Text becomes "[PATIENT_NAME] has [CPF_REDACTED]".
Timeline: Verify dates appear as "Day +0", "Day +5", etc.