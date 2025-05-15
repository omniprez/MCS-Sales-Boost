import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

async function addContractLengthColumn() {
  try {
    console.log('Adding contract_length column to deals table...');

    // Create a PostgreSQL pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    console.log('Attempting to connect to PostgreSQL with URL:', process.env.DATABASE_URL);

    // Get a client from the pool
    const client = await pool.connect();

    try {
      // Check if the column already exists
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'contract_length'
      `;

      const columnExists = await client.query(checkColumnQuery);

      if (columnExists.rows.length > 0) {
        console.log('contract_length column already exists in deals table');
        return;
      }

      // Add the contract_length column
      const alterTableQuery = `
        ALTER TABLE deals
        ADD COLUMN contract_length INTEGER DEFAULT 12
      `;

      await client.query(alterTableQuery);
      console.log('Successfully added contract_length column to deals table');

    } finally {
      // Release the client back to the pool
      client.release();

      // Close the pool
      await pool.end();
    }

  } catch (error) {
    console.error('Error adding contract_length column:', error);
    throw error;
  }
}

// Run the migration
addContractLengthColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
