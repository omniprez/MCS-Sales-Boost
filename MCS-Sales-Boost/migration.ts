import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Connecting to database...');

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }

    // Create connection pool with connection string from environment variables
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Required for cloud databases
    });

    const db = drizzle(pool, { schema });

    console.log('Creating tables...');

    // Create tables using raw SQL
    // Teams table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        region TEXT,
        type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Teams table created');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        team_id INTEGER REFERENCES teams(id),
        is_channel_partner BOOLEAN DEFAULT FALSE,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Users table created');

    // Customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        industry TEXT,
        size TEXT,
        region TEXT,
        contact JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Customers table created');

    // Deals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id SERIAL PRIMARY KEY,
        title VARCHAR NOT NULL,
        value DOUBLE PRECISION,
        status VARCHAR NOT NULL,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Deals table created');

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Products table created');

    // Activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        related_id INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Activities table created');

    // Point transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS point_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        reference_id INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Point transactions table created');

    // Challenges table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        criteria JSONB NOT NULL,
        status TEXT NOT NULL,
        reward_points INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Challenges table created');

    // Challenge participants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS challenge_participants (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW(),
        status TEXT NOT NULL,
        progress JSONB
      )
    `);
    console.log('✓ Challenge participants table created');

    await pool.end();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
