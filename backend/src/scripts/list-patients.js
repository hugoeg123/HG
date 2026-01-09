const { Sequelize } = require('sequelize');
const config = require('../config/sequelize-config');

const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {
    host: config.development.host,
    dialect: config.development.dialect,
    logging: false
});

async function listPatients() {
    try {
        await sequelize.authenticate();
        console.log('--- Patients List ---');
        const [patients] = await sequelize.query('SELECT id, name, "createdAt" FROM "Patients" ORDER BY "createdAt" DESC LIMIT 10'); // Check table name casing! Usually Patients or patients

        if (patients.length === 0) {
            // Try lowercase table name if uppercase fails or returns empty unexpectedly (though sequelize usually handles this)
            const [patientsLow] = await sequelize.query('SELECT id, name, created_at FROM patients ORDER BY created_at DESC LIMIT 10');
            console.table(patientsLow);
        } else {
            console.table(patients);
        }

    } catch (err) {
        // Fallback for table name issues
        try {
            const [patientsLow] = await sequelize.query('SELECT id, name, created_at FROM patients ORDER BY created_at DESC LIMIT 10');
            console.table(patientsLow);
        } catch (err2) {
            console.error('List Patients Error:', err2.message);
        }
    } finally {
        await sequelize.close();
    }
}

listPatients();
