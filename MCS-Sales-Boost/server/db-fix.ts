/**
 * This script fixes the foreign key constraints in the database
 * to add ON DELETE CASCADE to all constraints related to the deals table.
 * This ensures that when a deal is deleted, all related records are automatically deleted.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixDatabaseConstraints() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark',
  });

  const client = await pool.connect();
  
  try {
    console.log('Starting database constraint fix...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // 1. Get all foreign key constraints that reference the deals table
    const constraintsQuery = await client.query(`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name, 
             ccu.table_name AS foreign_table_name,
             ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (ccu.table_name = 'deals');
    `);
    
    console.log(`Found ${constraintsQuery.rows.length} foreign key constraints referencing deals table`);
    
    // 2. For each constraint, drop it and recreate with ON DELETE CASCADE
    for (const constraint of constraintsQuery.rows) {
      const { constraint_name, table_name, column_name, foreign_table_name, foreign_column_name } = constraint;
      
      console.log(`Processing constraint: ${constraint_name} on table ${table_name}`);
      
      // Drop the existing constraint
      await client.query(`
        ALTER TABLE "${table_name}" 
        DROP CONSTRAINT IF EXISTS "${constraint_name}";
      `);
      
      console.log(`Dropped constraint: ${constraint_name}`);
      
      // Recreate the constraint with ON DELETE CASCADE
      await client.query(`
        ALTER TABLE "${table_name}" 
        ADD CONSTRAINT "${constraint_name}" 
        FOREIGN KEY ("${column_name}") 
        REFERENCES "${foreign_table_name}"("${foreign_column_name}") 
        ON DELETE CASCADE;
      `);
      
      console.log(`Recreated constraint: ${constraint_name} with ON DELETE CASCADE`);
    }
    
    // 3. Also check for constraints from wip to other tables
    const wipConstraintsQuery = await client.query(`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name, 
             ccu.table_name AS foreign_table_name,
             ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (ccu.table_name = 'wip');
    `);
    
    console.log(`Found ${wipConstraintsQuery.rows.length} foreign key constraints referencing wip table`);
    
    // 4. For each wip constraint, drop it and recreate with ON DELETE CASCADE
    for (const constraint of wipConstraintsQuery.rows) {
      const { constraint_name, table_name, column_name, foreign_table_name, foreign_column_name } = constraint;
      
      console.log(`Processing constraint: ${constraint_name} on table ${table_name}`);
      
      // Drop the existing constraint
      await client.query(`
        ALTER TABLE "${table_name}" 
        DROP CONSTRAINT IF EXISTS "${constraint_name}";
      `);
      
      console.log(`Dropped constraint: ${constraint_name}`);
      
      // Recreate the constraint with ON DELETE CASCADE
      await client.query(`
        ALTER TABLE "${table_name}" 
        ADD CONSTRAINT "${constraint_name}" 
        FOREIGN KEY ("${column_name}") 
        REFERENCES "${foreign_table_name}"("${foreign_column_name}") 
        ON DELETE CASCADE;
      `);
      
      console.log(`Recreated constraint: ${constraint_name} with ON DELETE CASCADE`);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Database constraint fix completed successfully');
    return true;
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error fixing database constraints:', error);
    return false;
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixDatabaseConstraints()
    .then(success => {
      if (success) {
        console.log('Database constraints fixed successfully');
        process.exit(0);
      } else {
        console.error('Failed to fix database constraints');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { fixDatabaseConstraints };
