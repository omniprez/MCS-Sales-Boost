import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function fixDealsTable() {
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
      
      // Add missing columns if needed
      console.log('\nChecking for missing columns...');
      
      // Check for value column
      if (!result.rows.some(row => row.column_name === 'value')) {
        console.log('Adding value column...');
        await client.query(`
          ALTER TABLE deals 
          ADD COLUMN value DECIMAL(10, 2) NOT NULL DEFAULT 0
        `);
        console.log('value column added successfully');
      }
      
      // Check for mrc column
      if (!result.rows.some(row => row.column_name === 'mrc')) {
        console.log('Adding mrc column...');
        await client.query(`
          ALTER TABLE deals 
          ADD COLUMN mrc DOUBLE PRECISION NOT NULL DEFAULT 0
        `);
        console.log('mrc column added successfully');
      }
      
      // Check for nrc column
      if (!result.rows.some(row => row.column_name === 'nrc')) {
        console.log('Adding nrc column...');
        await client.query(`
          ALTER TABLE deals 
          ADD COLUMN nrc DOUBLE PRECISION NOT NULL DEFAULT 0
        `);
        console.log('nrc column added successfully');
      }
      
      // Check for tcv column
      if (!result.rows.some(row => row.column_name === 'tcv')) {
        console.log('Adding tcv column...');
        await client.query(`
          ALTER TABLE deals 
          ADD COLUMN tcv DOUBLE PRECISION NOT NULL DEFAULT 0
        `);
        console.log('tcv column added successfully');
      }
      
      // Check for contract_length column
      if (!result.rows.some(row => row.column_name === 'contract_length')) {
        console.log('Adding contract_length column...');
        await client.query(`
          ALTER TABLE deals 
          ADD COLUMN contract_length INTEGER DEFAULT 12
        `);
        console.log('contract_length column added successfully');
      }
      
      console.log('\nDeals table has been fixed. All required columns are now present.');
      
    } finally {
      client.release();
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Error fixing deals table:', error);
    process.exit(1);
  }
}

// Run the fix function
fixDealsTable();
