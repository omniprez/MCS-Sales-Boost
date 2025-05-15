import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function fixValueColumn() {
  const { Pool } = pg;
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    
    try {
      console.log('Connected to PostgreSQL');
      
      // 1. First, update any existing NULL values in the value column
      console.log('Updating NULL values in the value column...');
      await client.query(`
        UPDATE deals 
        SET value = COALESCE(tcv, mrc * COALESCE(contract_length, 12) + COALESCE(nrc, 0), 1) 
        WHERE value IS NULL
      `);
      
      // 2. Set a default value for the value column
      console.log('Setting default value for the value column...');
      await client.query(`
        ALTER TABLE deals 
        ALTER COLUMN value SET DEFAULT 0
      `);
      
      // 3. Make sure the value column is not nullable
      console.log('Making value column NOT NULL...');
      await client.query(`
        ALTER TABLE deals 
        ALTER COLUMN value SET NOT NULL
      `);
      
      console.log('Value column fixed successfully!');
      
    } finally {
      client.release();
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Error fixing value column:', error);
    process.exit(1);
  }
}

// Run the fix
fixValueColumn();
