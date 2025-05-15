import pg from 'pg';
import dotenv from 'dotenv';

console.log('Starting NaN fix script...');
dotenv.config();
console.log('Environment loaded');

async function fixNaNValues() {
  const { Pool } = pg;

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();

    try {
      console.log('Connected to PostgreSQL');

      // 1. Fix any NaN or NULL values in numeric columns
      console.log('Fixing NaN/NULL values in numeric columns...');

      // Fix mrc column
      await client.query(`
        UPDATE deals
        SET mrc = 0
        WHERE mrc IS NULL OR mrc != mrc
      `);

      // Fix nrc column
      await client.query(`
        UPDATE deals
        SET nrc = 0
        WHERE nrc IS NULL OR nrc != nrc
      `);

      // Fix tcv column
      await client.query(`
        UPDATE deals
        SET tcv = mrc * COALESCE(contract_length, 12) + COALESCE(nrc, 0)
        WHERE tcv IS NULL OR tcv != tcv
      `);

      // Fix value column
      await client.query(`
        UPDATE deals
        SET value = tcv
        WHERE value IS NULL OR value != value
      `);

      // Fix contract_length column
      await client.query(`
        UPDATE deals
        SET contract_length = 12
        WHERE contract_length IS NULL
      `);

      console.log('All numeric columns fixed successfully!');

      // Check if there are any remaining NaN values
      const result = await client.query(`
        SELECT id, name, mrc, nrc, tcv, value, contract_length
        FROM deals
        WHERE
          mrc IS NULL OR mrc != mrc OR
          nrc IS NULL OR nrc != nrc OR
          tcv IS NULL OR tcv != tcv OR
          value IS NULL OR value != value
      `);

      if (result.rows.length > 0) {
        console.log('Warning: There are still some deals with NaN values:');
        console.log(result.rows);
      } else {
        console.log('All NaN values have been fixed!');
      }

    } finally {
      client.release();
    }

    await pool.end();

  } catch (error) {
    console.error('Error fixing NaN values:', error);
    process.exit(1);
  }
}

// Run the fix
fixNaNValues();
