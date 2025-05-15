import pg from 'pg';
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
          is_channel_partner BOOLEAN DEFAULT FALSE,
          avatar VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create teams table
      await client.query(`
        CREATE TABLE IF NOT EXISTS teams (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          region VARCHAR(255),
          type VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create customers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          industry VARCHAR(255),
          size VARCHAR(50),
          region VARCHAR(255),
          contact JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create deals table
      await client.query(`
        CREATE TABLE IF NOT EXISTS deals (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          value DECIMAL(10, 2) NOT NULL,
          category VARCHAR(255) NOT NULL,
          stage VARCHAR(50) NOT NULL,
          customer_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          gp_percentage DECIMAL(5, 2),
          expected_close_date TIMESTAMP,
          closed_date TIMESTAMP,
          region VARCHAR(255),
          client_type VARCHAR(50),
          deal_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create activities table
      await client.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          type VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          related_id INTEGER,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Tables created successfully');
      
    } finally {
      // Release the client back to the pool
      client.release();
    }
    
    // Close the pool
    await pool.end();
    
    console.log('Database initialization completed successfully');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();


