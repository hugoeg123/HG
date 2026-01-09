const { Sequelize } = require('sequelize');
const config = require('../config/sequelize-config');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false
});

async function check() {
    try {
        const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'patient_documents';
    `);

        if (results.length > 0) {
            console.log('✅ Table patient_documents EXISTS.');

            const [columns] = await sequelize.query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'patient_documents';
      `);
            console.log('Columns:', columns.map(c => `${c.column_name} (${c.udt_name})`));

            const hasVector = columns.some(c => c.column_name === 'embedding'); // udt_name might be 'vector' or 'user-defined'
            console.log('Has Embedding Column:', hasVector);
        } else {
            console.log('❌ Table patient_documents DOES NOT EXIST.');
        }
    } catch (error) {
        console.error('Error checking DB:', error);
    } finally {
        await sequelize.close();
    }
}

check();
