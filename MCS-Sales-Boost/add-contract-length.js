const { Client } = require('pg');
require('dotenv').config();

console.log('Starting script...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Exists (not showing for security)' : 'Not found');

async function addContractLength() {
  console.log('Creating database client...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Add contract_length column to deals table
    try {
      console.log('Adding contract_length column to deals table...');
      await client.query(`
        ALTER TABLE deals
        ADD COLUMN contract_length INTEGER
      `);
      console.log('contract_length column added successfully');
    } catch (error) {
      console.error('Error adding contract_length column:', error.message);
    }

    // Verify the column was added
    console.log('Verifying column was added...');
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'deals'
      AND column_name = 'contract_length'
    `);

    console.log('contract_length column exists:', result.rows.length > 0);

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    console.log('Closing database connection...');
    await client.end();
    console.log('Database connection closed');
  }
}

console.log('Calling addContractLength function...');
addContractLength().then(() => {
  console.log('Script completed');
}).catch(err => {
  console.error('Script failed:', err);
});
