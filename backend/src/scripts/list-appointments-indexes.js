/**
 * List indexes for appointments table
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
    const res = await client.query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='appointments';`
    );
    console.log('Indexes on appointments:');
    for (const row of res.rows) {
      console.log(`- ${row.indexname}: ${row.indexdef}`);
    }
  } catch (err) {
    console.error('Error listing indexes:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();