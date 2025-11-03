/**
 * Drop conflicting indexes for appointments table
 */
const { Client } = require('pg');
require('dotenv').config({ path: process.cwd() + '/.env' });

async function main() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'health_guardian',
  };

  const client = new Client(config);
  try {
    await client.connect();
    const sqls = [
      'DROP INDEX IF EXISTS "appointments_slot_id";',
      'DROP INDEX IF EXISTS "appointments_patient_id";',
      'DROP INDEX IF EXISTS "appointments_status";'
    ];
    for (const sql of sqls) {
      await client.query(sql);
      console.log(`✅ Executed: ${sql}`);
    }
  } catch (err) {
    console.error('❌ Error dropping appointments indexes:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();