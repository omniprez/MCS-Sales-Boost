import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function updateDealName() {
  // Get deal ID and new name from command line arguments
  const args = process.argv.slice(2);
  const dealId = args[0];
  const newName = args[1];
  
  if (!dealId || !newName) {
    console.error('Usage: node direct-update-deal.js DEAL_ID NEW_NAME');
    process.exit(1);
  }
  
  console.log(`Updating deal ${dealId} name to "${newName}"`);
  
  // Create a connection to the database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
  });

  try {
    // Get a client from the pool
    const client = await pool.connect();
    
    try {
      // First check if the deal exists
      console.log('Checking if deal exists...');
      const checkResult = await client.query('SELECT * FROM deals WHERE id = $1', [dealId]);
      
      if (checkResult.rows.length === 0) {
        console.error(`Deal with ID ${dealId} not found`);
        return;
      }
      
      console.log(`Found deal ${dealId} in database:`, checkResult.rows[0]);
      console.log(`Current name: "${checkResult.rows[0].name}"`);
      
      // Execute the update
      console.log('Executing update...');
      const result = await client.query(
        'UPDATE deals SET name = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        [newName, new Date(), dealId]
      );
      
      if (result.rows.length > 0) {
        console.log('Update successful!');
        console.log('Updated deal:', result.rows[0]);
        console.log(`New name: "${result.rows[0].name}"`);
      } else {
        console.log('Update failed - no rows returned');
      }
      
      // Verify the update
      console.log('Verifying update...');
      const verifyResult = await client.query('SELECT id, name FROM deals WHERE id = $1', [dealId]);
      
      if (verifyResult.rows.length > 0) {
        console.log(`Verification: Deal ${dealId} name is now "${verifyResult.rows[0].name}"`);
      } else {
        console.log(`Verification failed: Could not find deal ${dealId}`);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating deal name:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
updateDealName().catch(error => {
  console.error('Error in main function:', error);
  process.exit(1);
});
