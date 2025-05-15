import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    
    try {
      // Drop existing tables
      await client.query(`
        DROP TABLE IF EXISTS deals CASCADE;
        DROP TABLE IF EXISTS customers CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS teams CASCADE;
      `);

      // Create teams table
      await client.query(`
        CREATE TABLE teams (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          region VARCHAR(255),
          type VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create users table
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          team_id INTEGER REFERENCES teams(id),
          is_channel_partner BOOLEAN DEFAULT FALSE,
          avatar VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create customers table
      await client.query(`
        CREATE TABLE customers (
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
        CREATE TABLE deals (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          value DECIMAL(10, 2) NOT NULL,
          category VARCHAR(255) NOT NULL,
          stage VARCHAR(50) NOT NULL,
          customer_id INTEGER REFERENCES customers(id) NOT NULL,
          user_id INTEGER REFERENCES users(id) NOT NULL,
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

      console.log('Database reset successful');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await pool.end();
  }
}

resetDatabase();