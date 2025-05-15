import { db } from './server/db';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixSchema() {
  if (!db) {
    console.error('Database connection not available');
    process.exit(1);
  }

  try {
    console.log('Adding missing columns to deals table...');
    
    // Add contract_length column
    await db.execute(sql`
      ALTER TABLE deals 
      ADD COLUMN IF NOT EXISTS contract_length INTEGER
    `);
    console.log('contract_length column added (if it didn\'t exist)');
    
    // Add closed_date column
    await db.execute(sql`
      ALTER TABLE deals 
      ADD COLUMN IF NOT EXISTS closed_date TIMESTAMP
    `);
    console.log('closed_date column added (if it didn\'t exist)');
    
    // Create WIP tables
    console.log('Creating WIP tables...');
    
    // Create wip table
    await db.execute(sql`
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
    console.log('wip table created (if it didn\'t exist)');
    
    // Create wip_updates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS wip_updates (
        id SERIAL PRIMARY KEY,
        wip_id INTEGER NOT NULL REFERENCES wip(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        projected_delivery_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('wip_updates table created (if it didn\'t exist)');
    
    // Create revenue_recognition table
    await db.execute(sql`
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
    console.log('revenue_recognition table created (if it didn\'t exist)');
    
    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Error updating schema:', error);
  }
}

fixSchema();
