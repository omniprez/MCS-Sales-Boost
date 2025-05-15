/**
 * Script to delete a deal and all its related records
 * 
 * Usage: node delete-deal.js <deal_id>
 */

const { Pool } = require('pg');
require('dotenv').config();

async function deleteDeal(dealId) {
  if (!dealId || isNaN(parseInt(dealId))) {
    console.error('Please provide a valid deal ID');
    process.exit(1);
  }

  dealId = parseInt(dealId);
  console.log(`Attempting to delete deal with ID: ${dealId}`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
  });

  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // 1. Check if the deal exists
    const dealCheck = await client.query('SELECT * FROM deals WHERE id = $1', [dealId]);
    if (dealCheck.rows.length === 0) {
      console.error(`Deal with ID ${dealId} not found`);
      await client.query('ROLLBACK');
      return false;
    }
    
    console.log(`Found deal: ${JSON.stringify(dealCheck.rows[0], null, 2)}`);
    
    // 2. Find all WIP records for this deal
    const wipRecords = await client.query('SELECT * FROM wip WHERE deal_id = $1', [dealId]);
    console.log(`Found ${wipRecords.rows.length} WIP records for deal ${dealId}`);
    
    // 3. For each WIP record, delete related records
    for (const wipRecord of wipRecords.rows) {
      const wipId = wipRecord.id;
      
      // 3.1 Delete revenue recognition records
      const revenueResult = await client.query('SELECT COUNT(*) FROM revenue_recognition WHERE wip_id = $1', [wipId]);
      const revenueCount = parseInt(revenueResult.rows[0].count);
      
      if (revenueCount > 0) {
        console.log(`Deleting ${revenueCount} revenue recognition records for WIP ID ${wipId}`);
        await client.query('DELETE FROM revenue_recognition WHERE wip_id = $1', [wipId]);
      }
      
      // 3.2 Delete WIP update records
      const wipUpdateResult = await client.query('SELECT COUNT(*) FROM wip_updates WHERE wip_id = $1', [wipId]);
      const wipUpdateCount = parseInt(wipUpdateResult.rows[0].count);
      
      if (wipUpdateCount > 0) {
        console.log(`Deleting ${wipUpdateCount} WIP update records for WIP ID ${wipId}`);
        await client.query('DELETE FROM wip_updates WHERE wip_id = $1', [wipId]);
      }
    }
    
    // 4. Delete all WIP records for this deal
    if (wipRecords.rows.length > 0) {
      console.log(`Deleting all WIP records for deal ${dealId}`);
      await client.query('DELETE FROM wip WHERE deal_id = $1', [dealId]);
    }
    
    // 5. Delete activities related to this deal
    const activitiesResult = await client.query('SELECT COUNT(*) FROM activities WHERE related_id = $1', [dealId]);
    const activitiesCount = parseInt(activitiesResult.rows[0].count);
    
    if (activitiesCount > 0) {
      console.log(`Deleting ${activitiesCount} activity records for deal ${dealId}`);
      await client.query('DELETE FROM activities WHERE related_id = $1', [dealId]);
    }
    
    // 6. Finally, delete the deal
    console.log(`Deleting deal ${dealId}`);
    await client.query('DELETE FROM deals WHERE id = $1', [dealId]);
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log(`Deal ${dealId} and all related records successfully deleted`);
    return true;
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error deleting deal:', error);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get deal ID from command line arguments
const dealId = process.argv[2];

// Execute the delete function
deleteDeal(dealId)
  .then(success => {
    if (success) {
      console.log('Deal deletion completed successfully');
      process.exit(0);
    } else {
      console.error('Deal deletion failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
