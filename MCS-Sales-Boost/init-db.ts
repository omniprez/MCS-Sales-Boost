import pg from 'pg';
import * as schema from './shared/schema.js';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create a PostgreSQL pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Get a client from the pool
    const client = await pool.connect();
    
    try {
      console.log('Connected to PostgreSQL');
      
      // Create tables
      console.log('Creating tables...');
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          team_id INTEGER,
          avatar VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Tables created successfully');
      
    } finally {
      client.release();
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();

