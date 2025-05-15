import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

async function insertDeal() {
  try {
    console.log('Connecting to database...');
    
    // Create connection pool with connection string from environment variables
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Required for cloud databases
    });

    console.log('Inserting a sample deal...');
    
    // Insert a sample deal
    const query = `
      INSERT INTO deals (title, value, status, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    
    const values = ['TechCorp Network Upgrade', 150000.00, 'proposal', 1];
    
    const result = await pool.query(query, values);
    
    console.log('Deal inserted with ID:', result.rows[0].id);
    
    await pool.end();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error inserting deal:', error);
    process.exit(1);
  }
}

insertDeal();
