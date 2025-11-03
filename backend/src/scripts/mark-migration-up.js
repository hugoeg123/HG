/**
 * Helper: Mark specific Sequelize migrations as applied (UP)
 *
 * Connector:
 * - Uses Sequelize (database-pg.js) to insert into "SequelizeMeta"
 * - Helps bypass conflicts when schema already exists but migration status is DOWN
 *
 * Hook:
 * - Run before `npm run db:migrate` to skip problematic migrations already reflected in DB
 *
 * Usage:
 *   node src/scripts/mark-migration-up.js 20251018000000-create-agenda-tables.js
 *   node src/scripts/mark-migration-up.js <mig1> <mig2> ...
 */

const { sequelize } = require('../config/database-pg');

async function markUp(migrationNames) {
  if (!migrationNames || migrationNames.length === 0) {
    console.error('❌ Provide at least one migration filename to mark as UP.');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Ensure SequelizeMeta table exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) PRIMARY KEY
      );
    `);

    for (const name of migrationNames) {
      // Insert only if not already present
      const [rows] = await sequelize.query(
        'SELECT name FROM "SequelizeMeta" WHERE name = :name',
        { replacements: { name } }
      );

      if (rows.length > 0) {
        console.log(`ℹ️ Already marked UP: ${name}`);
        continue;
      }

      await sequelize.query(
        'INSERT INTO "SequelizeMeta" (name) VALUES (:name)',
        { replacements: { name } }
      );
      console.log(`✅ Marked as UP: ${name}`);
    }

    console.log('🎉 Done.');
  } catch (err) {
    console.error('❌ Error marking migrations:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

const args = process.argv.slice(2);
markUp(args);