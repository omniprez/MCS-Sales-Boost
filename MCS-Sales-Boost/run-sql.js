const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSqlFile() {
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
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'add-column.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL file...');
    await client.query(sqlContent);
    
    console.log('SQL file executed successfully');
    
    // Verify the column was added
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'deals' AND column_name = 'contract_length'
    `);
    
    if (result.rows.length > 0) {
      console.log('contract_length column exists in deals table');
    } else {
      console.error('contract_length column was not added to deals table');
    }
    
  } catch (error) {
    console.error('Error executing SQL file:', error);
  } finally {
    await client.end();
  }
}

runSqlFile();
