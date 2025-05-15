const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabaseSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
  });

  try {
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Check the deals table schema
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'deals'
        ORDER BY ordinal_position;
      `);
      
      console.log('Deals table schema:');
      console.table(result.rows);
      
      // Check for any constraints on the name column
      const constraintResult = await client.query(`
        SELECT con.conname as constraint_name,
               con.contype as constraint_type,
               pg_get_constraintdef(con.oid) as constraint_definition
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'deals'
        AND nsp.nspname = 'public';
      `);
      
      console.log('\nDeals table constraints:');
      console.table(constraintResult.rows);
      
      // Check for any triggers on the deals table
      const triggerResult = await client.query(`
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'deals';
      `);
      
      console.log('\nDeals table triggers:');
      if (triggerResult.rows.length > 0) {
        console.table(triggerResult.rows);
      } else {
        console.log('No triggers found');
      }
      
      // Check for any indexes on the deals table
      const indexResult = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'deals';
      `);
      
      console.log('\nDeals table indexes:');
      console.table(indexResult.rows);
      
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error checking database schema:', err);
  } finally {
    await pool.end();
  }
}

checkDatabaseSchema();
