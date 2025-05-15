import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function checkSchema() {
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
      
      // Check deals table columns
      const result = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'deals'
        ORDER BY ordinal_position
      `);
      
      console.log('Deals table columns:');
      result.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
      
    } finally {
      client.release();
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

// Run the check
checkSchema();
