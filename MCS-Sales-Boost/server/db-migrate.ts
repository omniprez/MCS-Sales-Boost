import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigration() {
  // Only run if we're using a real database
  if (process.env.USE_IN_MEMORY_DB === 'true') {
    console.log('Using in-memory storage, skipping migration');
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL provided, cannot run migration');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Running database migration...');
    
    // Check if targets table exists
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'targets'
      );
    `);
    
    const tableExists = checkTableResult.rows[0].exists;
    
    if (tableExists) {
      console.log('Targets table already exists, skipping creation');
    } else {
      console.log('Creating targets table...');
      
      // Create the targets table
      await pool.query(`
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
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);
