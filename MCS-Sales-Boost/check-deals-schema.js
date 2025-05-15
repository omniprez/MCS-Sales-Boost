import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

async function checkDealsSchema() {
  try {
    console.log('Connecting to database...');
    
    // Create connection pool with connection string from environment variables
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Required for cloud databases
    });

    console.log('Checking deals table schema...');
    
    // Query to get the column information for the deals table
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'deals'
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(query);
    
    console.log('Deals table schema:');
    console.table(result.rows);
    
    await pool.end();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkDealsSchema();
