import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Determine if we're in production (Vercel deployment)
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
  maxUses: 7500, // Close and replace a connection after it has been used this many times
  // Enable SSL for production environments (cloud databases)
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('New client connected to the pool');
});

// Create drizzle client with our schema
export const db = drizzle(pool, { schema });

// Handle process termination
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

// Test database connection
export async function testConnection() {
  try {
    // For in-memory storage, just return true
    if (process.env.USE_IN_MEMORY_DB === 'true') {
      console.log('Using in-memory storage (explicitly configured)');
      return true;
    }

    // Otherwise, try connecting to the database
    if (!pool) {
      console.error('No PostgreSQL pool available');
      return false;
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT 1 as connected');
        console.log('Database connection successful:', result.rows[0]);

        // Check if targets table exists
        const checkTableResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'targets'
          );
        `);

        const tableExists = checkTableResult.rows[0].exists;

        if (!tableExists) {
          console.log('Targets table does not exist, creating it...');

          // Create the targets table
          await client.query(`
            CREATE TABLE targets (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL,
              target_type TEXT NOT NULL,
              period TEXT NOT NULL,
              start_date TIMESTAMP NOT NULL,
              end_date TIMESTAMP NOT NULL,
              target_value DOUBLE PRECISION NOT NULL,
              current_value DOUBLE PRECISION DEFAULT 0,
              created_at TIMESTAMP DEFAULT NOW()
            );
          `);

          console.log('Targets table created successfully');
        } else {
          console.log('Targets table already exists');
        }

        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    return false;
  }
}
