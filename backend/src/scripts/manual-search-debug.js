const clinicalRetriever = require('../services/rag/ClinicalRetriever');
const patientAnonymizer = require('../services/anonymizer/PatientAnonymizer');
const fs = require('fs');

// Same patient ID from manual-index-debug.js
const PATIENT_ID = 'e18407bb-bb69-45b4-a8ae-ee228d72f0b1';
const QUERY = 'dor';

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('manual_search_log.txt', msg + '\n');
};

async function testSearch() {
    try {
        log(`Searching for "${QUERY}"...`);

        const hash = patientAnonymizer.hashId(PATIENT_ID);
        log(`Patient Hash: ${hash}`);

        // 1. Search Logic
        const results = await clinicalRetriever.search(QUERY, { patient_hash: hash }, 5);

        log(`Found ${results.length} results.`);
        results.forEach(r => {
            log(`[${Number(r.rrf_score || 0).toFixed(4)}] ${r.doc_path}: ${r.content.substring(0, 50)}...`);
        });

    } catch (error) {
        log(`SEARCH FAILED: ${error.message}`);
        if (error.stack) log(error.stack);
    }
}

testSearch().then(() => process.exit(0));
