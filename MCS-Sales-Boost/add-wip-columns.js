const { Client } = require('pg');
require('dotenv').config();

async function addWipColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if contract_length column exists
    const contractLengthExists = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'deals'
      AND column_name = 'contract_length'
    `);

    // Add contract_length column to deals table if it doesn't exist
    if (contractLengthExists.rows.length === 0) {
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
    } else {
      console.log('contract_length column already exists');
    }

    // Check if closed_date column exists
    const closedDateExists = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'deals'
      AND column_name = 'closed_date'
    `);

    // Add closed_date column to deals table if it doesn't exist
    if (closedDateExists.rows.length === 0) {
      try {
        console.log('Adding closed_date column to deals table...');
        await client.query(`
          ALTER TABLE deals
          ADD COLUMN closed_date TIMESTAMP
        `);
        console.log('closed_date column added successfully');
      } catch (error) {
        console.error('Error adding closed_date column:', error.message);
      }
    } else {
      console.log('closed_date column already exists');
    }

    // Check if wip table exists
    const wipTableExists = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'wip'
    `);

    // Create wip table if it doesn't exist
    if (wipTableExists.rows.length === 0) {
      try {
        console.log('Creating wip table...');
        await client.query(`
          CREATE TABLE wip (
            id SERIAL PRIMARY KEY,
            deal_id INTEGER NOT NULL REFERENCES deals(id),
            projected_delivery_date TIMESTAMP,
            actual_delivery_date TIMESTAMP,
            billing_start_date TIMESTAMP,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('wip table created successfully');
      } catch (error) {
        console.error('Error creating wip table:', error.message);
      }
    } else {
      console.log('wip table already exists');
    }

    // Check if wip_updates table exists
    const wipUpdatesTableExists = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'wip_updates'
    `);

    // Create wip_updates table if it doesn't exist
    if (wipUpdatesTableExists.rows.length === 0) {
      try {
        console.log('Creating wip_updates table...');
        await client.query(`
          CREATE TABLE wip_updates (
            id SERIAL PRIMARY KEY,
            wip_id INTEGER NOT NULL REFERENCES wip(id),
            user_id INTEGER NOT NULL REFERENCES users(id),
            projected_delivery_date TIMESTAMP,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('wip_updates table created successfully');
      } catch (error) {
        console.error('Error creating wip_updates table:', error.message);
      }
    } else {
      console.log('wip_updates table already exists');
    }

    // Check if revenue_recognition table exists
    const revenueRecognitionTableExists = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'revenue_recognition'
    `);

    // Create revenue_recognition table if it doesn't exist
    if (revenueRecognitionTableExists.rows.length === 0) {
      try {
        console.log('Creating revenue_recognition table...');
        await client.query(`
          CREATE TABLE revenue_recognition (
            id SERIAL PRIMARY KEY,
            wip_id INTEGER NOT NULL REFERENCES wip(id),
            month VARCHAR(7) NOT NULL,
            amount FLOAT NOT NULL,
            recognized BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('revenue_recognition table created successfully');
      } catch (error) {
        console.error('Error creating revenue_recognition table:', error.message);
      }
    } else {
      console.log('revenue_recognition table already exists');
    }

    // Verify the columns and tables were added
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'deals'
      AND column_name IN ('contract_length', 'closed_date')
    `);

    console.log('Columns in deals table:', result.rows.map(row => row.column_name));

    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('wip', 'wip_updates', 'revenue_recognition')
    `);

    console.log('WIP-related tables:', tableResult.rows.map(row => row.table_name));

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

addWipColumns();
