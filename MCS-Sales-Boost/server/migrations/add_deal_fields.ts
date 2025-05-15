import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

async function addDealFields() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Add mrc column
    try {
      console.log('Adding mrc column to deals table...');
      await client.query(`
        ALTER TABLE deals 
        ADD COLUMN IF NOT EXISTS mrc DOUBLE PRECISION NOT NULL DEFAULT 0
      `);
      console.log('mrc column added successfully');
    } catch (error: any) {
      console.error('Error adding mrc column:', error?.message || 'Unknown error');
    }

    // Add nrc column
    try {
      console.log('Adding nrc column to deals table...');
      await client.query(`
        ALTER TABLE deals 
        ADD COLUMN IF NOT EXISTS nrc DOUBLE PRECISION NOT NULL DEFAULT 0
      `);
      console.log('nrc column added successfully');
    } catch (error: any) {
      console.error('Error adding nrc column:', error?.message || 'Unknown error');
    }

    // Add tcv column
    try {
      console.log('Adding tcv column to deals table...');
      await client.query(`
        ALTER TABLE deals 
        ADD COLUMN IF NOT EXISTS tcv DOUBLE PRECISION NOT NULL DEFAULT 0
      `);
      console.log('tcv column added successfully');
    } catch (error: any) {
      console.error('Error adding tcv column:', error?.message || 'Unknown error');
    }

    // Verify the columns were added
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'deals' 
      AND column_name IN ('mrc', 'nrc', 'tcv')
    `);

    console.log('New columns in deals table:', result.rows.map(row => row.column_name));

  } catch (error: any) {
    console.error('Database error:', error?.message || 'Unknown error');
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the migration
addDealFields().catch((error: any) => {
  console.error('Migration failed:', error?.message || 'Unknown error');
  process.exit(1);
}); 