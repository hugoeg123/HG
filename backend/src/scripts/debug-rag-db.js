const { Sequelize } = require('sequelize');
const config = require('../config/sequelize-config');

// Adjust config based on environment which might be simpler in this script
const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {
    host: config.development.host,
    dialect: config.development.dialect,
    logging: false
});

async function debugDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection successful.');

        // 1. Count Total Documents
        const [results] = await sequelize.query('SELECT COUNT(*) FROM patient_documents');
        console.log('Total Documents in DB:', results[0].count);

        if (results[0].count > 0) {
            // 2. Sample a Document
            const [sample] = await sequelize.query('SELECT id, patient_hash, doc_path, content, embedding FROM patient_documents LIMIT 1');
            console.log('\n--- Sample Document ---');
            console.log('ID:', sample[0].id);
            console.log('Patient Hash:', sample[0].patient_hash);
            console.log('Doc Path:', sample[0].doc_path);
            console.log('Content Snippet:', sample[0].content.substring(0, 50) + '...');
            console.log('Embedding Present?', !!sample[0].embedding);
            if (sample[0].embedding) {
                // Check format (string or array?)
                // pgvector returns string usually like "[0.1, ...]"
                console.log('Embedding Format:', typeof sample[0].embedding);
                console.log('Embedding Snippet:', sample[0].embedding.toString().substring(0, 20) + '...');
            }
        } else {
            console.log('Use dashboard to index a patient first.');
        }

    } catch (err) {
        console.error('Database Debug Error:', err);
    } finally {
        await sequelize.close();
    }
}

debugDatabase();
