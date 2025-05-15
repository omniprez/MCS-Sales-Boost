import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

async function createDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if the database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'salesspark'"
    );

    if (result.rowCount === 0) {
      console.log('Creating salesspark database...');
      await client.query('CREATE DATABASE salesspark');
      console.log('salesspark database created successfully');
    } else {
      console.log('salesspark database already exists');
    }
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the initialization
createDatabase()
  .then(() => {
    console.log('Database initialization completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });

