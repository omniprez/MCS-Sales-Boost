import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

async function vercelDeploy() {
  console.log('Running Vercel deployment script...');
  
  // Check if we have a database URL
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL provided, cannot run deployment script');
    process.exit(1);
  }

  try {
    // Test database connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Required for some cloud databases
    });

    console.log('Testing database connection...');
    const client = await pool.connect();
    
    // Check if the database has been initialized
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    const result = await client.query(tableCheckQuery);
    const tablesExist = result.rows[0].exists;
    
    if (!tablesExist) {
      console.log('Database tables do not exist. Running migrations...');
      // Import and run migrations
      const { default: runMigration } = await import('../migration.ts');
      await runMigration();
      
      console.log('Creating admin user...');
      // Import and run user initialization
      const { initializeDemoUsers } = await import('../server/init-demo-users.ts');
      await initializeDemoUsers();
    } else {
      console.log('Database tables already exist. Skipping migrations.');
    }
    
    client.release();
    await pool.end();
    
    console.log('Vercel deployment script completed successfully.');
  } catch (error) {
    console.error('Error during Vercel deployment:', error);
    process.exit(1);
  }
}

vercelDeploy();
