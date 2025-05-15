import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Add contract_length column to deals table
    try {
      console.log('Adding contract_length column to deals table...');
      await client.query(`
        ALTER TABLE deals 
        ADD COLUMN IF NOT EXISTS contract_length INTEGER
      `);
      console.log('contract_length column added successfully');
    } catch (error) {
      console.error('Error adding contract_length column:', error.message);
    }
    
    // Add closed_date column to deals table
    try {
      console.log('Adding closed_date column to deals table...');
      await client.query(`
        ALTER TABLE deals 
        ADD COLUMN IF NOT EXISTS closed_date TIMESTAMP
      `);
      console.log('closed_date column added successfully');
    } catch (error) {
      console.error('Error adding closed_date column:', error.message);
    }
    
    // Create wip table
    try {
      console.log('Creating wip table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS wip (
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
    
    // Create wip_updates table
    try {
      console.log('Creating wip_updates table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS wip_updates (
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
    
    // Create revenue_recognition table
    try {
      console.log('Creating revenue_recognition table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS revenue_recognition (
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
    
    console.log('Database fix completed');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await client.end();
  }
}

fixDatabase();
