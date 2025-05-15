import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function addMissingColumns() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connected to PostgreSQL');
    
    // Check if contract_length column exists in deals table
    const contractLengthResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'deals' AND column_name = 'contract_length'
    `);
    
    if (contractLengthResult.rowCount === 0) {
      console.log('Adding contract_length column to deals table...');
      await pool.query(`
        ALTER TABLE deals 
        ADD COLUMN contract_length INTEGER
      `);
      console.log('contract_length column added successfully');
    } else {
      console.log('contract_length column already exists');
    }
    
    // Check if closed_date column exists in deals table
    const closedDateResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'deals' AND column_name = 'closed_date'
    `);
    
    if (closedDateResult.rowCount === 0) {
      console.log('Adding closed_date column to deals table...');
      await pool.query(`
        ALTER TABLE deals 
        ADD COLUMN closed_date TIMESTAMP
      `);
      console.log('closed_date column added successfully');
    } else {
      console.log('closed_date column already exists');
    }
    
    // Create WIP tables
    console.log('Creating WIP tables...');
    
    // Check if wip table exists
    const wipTableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'wip'
    `);
    
    if (wipTableResult.rowCount === 0) {
      console.log('Creating wip table...');
      await pool.query(`
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
    } else {
      console.log('wip table already exists');
    }
    
    // Check if wip_updates table exists
    const wipUpdatesTableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'wip_updates'
    `);
    
    if (wipUpdatesTableResult.rowCount === 0) {
      console.log('Creating wip_updates table...');
      await pool.query(`
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
    } else {
      console.log('wip_updates table already exists');
    }
    
    // Check if revenue_recognition table exists
    const revenueTableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'revenue_recognition'
    `);
    
    if (revenueTableResult.rowCount === 0) {
      console.log('Creating revenue_recognition table...');
      await pool.query(`
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
    } else {
      console.log('revenue_recognition table already exists');
    }
    
    console.log('All missing columns and tables have been added successfully');
  } catch (error) {
    console.error('Error adding missing columns:', error);
  } finally {
    await pool.end();
  }
}

addMissingColumns();
