/**
 * This script runs the SQL file to fix the foreign key constraints in the database.
 * It uses CommonJS modules to avoid ESM issues.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runFixConstraints() {
  // Create a new PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');

    // Create the wip table if it doesn't exist
    console.log('Creating wip table if it doesn\'t exist...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS wip (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT wip_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
      )
    `);

    // Create the installations table if it doesn't exist
    console.log('Creating installations table if it doesn\'t exist...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS installations (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        installation_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT installations_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
      )
    `);

    // Create the wip_updates table if it doesn't exist
    console.log('Creating wip_updates table if it doesn\'t exist...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS wip_updates (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT wip_updates_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
      )
    `);

    // Create the revenue_recognition table if it doesn't exist
    console.log('Creating revenue_recognition table if it doesn\'t exist...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS revenue_recognition (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        recognition_date DATE NOT NULL,
        financial_year VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT revenue_recognition_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error fixing database tables:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the function
runFixConstraints();
