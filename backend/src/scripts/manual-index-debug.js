const vectorIndexer = require('../services/rag/VectorIndexer');
const patientAnonymizer = require('../services/anonymizer/PatientAnonymizer');
const { Sequelize } = require('sequelize');
const config = require('../config/sequelize-config'); // Adjust if needed

// Hardcoded patient ID from screenshot (verify exact UUID pattern)
const PATIENT_ID = 'e18407bb-bb69-45b4-a8ae-ee228d72f0b1';

// Init DB connection (needed if models rely on global sequelize instance or if we need to ensure DB is up)
// However, models/index.js usually initializes itself.
// We just need to ensure the process keeps running.

const fs = require('fs');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('manual_index_log.txt', msg + '\n');
};

async function manualIndex() {
    try {
        log(`Starting manual indexing for ${PATIENT_ID}...`);

        // 1. Get Anonymized Data
        log('Fetching anonymized data...');
        const anonymizedData = await patientAnonymizer.getAnonymizedPatientData(PATIENT_ID);
        log(`Anonymized Hash: ${anonymizedData.patient_hash}`);
        log(`Records Found: ${anonymizedData.meta.total_records}`);

        if (anonymizedData.meta.total_records === 0) {
            log('WARNING: This patient has NO records to index.');
            return;
        }

        // 2. Index
        log('Sending to VectorIndexer...');
        const result = await vectorIndexer.indexPatient(anonymizedData);
        log(`Indexing Result: ${JSON.stringify(result)}`);

    } catch (error) {
        log(`MANUAL INDEXING FAILED: ${error.message}`);
        if (error.stack) log(error.stack);
    }
}

// Simple wrapper to run async
manualIndex().then(() => {
    log('Done.');
    process.exit(0);
});
