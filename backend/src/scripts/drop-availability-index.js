/**
 * Drop index helper for development
 *
 * Connector:
 * - Uses PostgreSQL via `pg` to drop a conflicting index
 * - Intended to unblock Sequelize migrations in dev
 *
 * Hook:
 * - Run before `npm run db:migrate` when migration fails with existing index
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
      'DROP INDEX IF EXISTS "availability_slots_medico_id";',
      'DROP INDEX IF EXISTS "availability_slots_medico_id_start_time";',
      'DROP INDEX IF EXISTS "availability_slots_start_time";',
      'DROP INDEX IF EXISTS "availability_slots_status";',
      'DROP INDEX IF EXISTS "availability_slots_modality";',
      'DROP INDEX IF EXISTS "availability_slots_medico_start_idx";'
    ];
    for (const sql of sqls) {
      await client.query(sql);
      console.log(`✅ Executed: ${sql}`);
    }
  } catch (err) {
    console.error('❌ Error dropping index:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();