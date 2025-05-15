/**
 * This script runs the SQL file to fix the foreign key constraints in the database.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runFixConstraints() {
  // Create a new PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'fix-constraints.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL
    console.log('Executing SQL to fix constraints...');
    await client.query(sql);
    console.log('SQL executed successfully');

    console.log('Database constraints fixed successfully');
  } catch (error) {
    console.error('Error fixing database constraints:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the function
runFixConstraints();
