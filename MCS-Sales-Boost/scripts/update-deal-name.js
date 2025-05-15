import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Pool } = pg;
dotenv.config();

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateDealName() {
  // Create a connection to the database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
  });

  try {
    // Get a client from the pool
    const client = await pool.connect();

    try {
      // First, list all deals to choose one to update
      const dealsResult = await client.query('SELECT id, name, value, category, stage FROM deals LIMIT 10');

      console.log('Available deals:');
      dealsResult.rows.forEach(deal => {
        console.log(`ID: ${deal.id}, Name: ${deal.name}, Value: ${deal.value}, Category: ${deal.category}, Stage: ${deal.stage}`);
      });

      if (dealsResult.rows.length === 0) {
        console.log('No deals found in the database.');
        return;
      }

      // Choose the first deal to update
      const dealToUpdate = dealsResult.rows[0];
      const dealId = dealToUpdate.id;
      const newName = `Updated Deal Name ${new Date().toISOString()}`;

      console.log(`\nUpdating deal ${dealId} name from "${dealToUpdate.name}" to "${newName}"`);

      // Execute a direct SQL query to update the name
      const updateResult = await client.query(
        'UPDATE deals SET name = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        [newName, new Date(), dealId]
      );

      if (updateResult.rows.length > 0) {
        console.log('Update successful!');
        console.log('Updated deal:', updateResult.rows[0]);
      } else {
        console.log('Update failed - no rows returned.');
      }

      // Verify the update
      const verifyResult = await client.query('SELECT id, name FROM deals WHERE id = $1', [dealId]);

      if (verifyResult.rows.length > 0) {
        console.log(`\nVerification: Deal ${dealId} name is now "${verifyResult.rows[0].name}"`);
      } else {
        console.log(`\nVerification failed: Could not find deal ${dealId}`);
      }

    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error updating deal name:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
updateDealName().catch(error => {
  console.error('Error in main function:', error);
  process.exit(1);
});
