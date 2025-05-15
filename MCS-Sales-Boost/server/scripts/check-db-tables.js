/**
 * This script checks the status of database tables.
 * It lists all tables in the database and their row counts.
 */

import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
});

async function checkDbTables() {
  const client = await pool.connect();

  try {
    console.log('Checking database tables...');

    // Get all tables in the public schema
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map(row => row.table_name);

    console.log(`Found ${tables.length} tables in the database:`);

    // Get row count for each table
    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) FROM "${table}";`);
      const count = countResult.rows[0].count;
      console.log(`- ${table}: ${count} rows`);
    }



  } catch (error) {
    console.error('Error checking database tables:', error);
    throw error;
  } finally {
    // Release client
    client.release();

    // Close pool
    pool.end();
  }
}

// Run the check
checkDbTables()
  .then(() => {
    console.log('\nScript completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
