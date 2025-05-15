const { Client } = require('pg');
require('dotenv').config();

async function fixDatabase() {
  // Create a new PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Postgres2025!@localhost:5432/salesspark'
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');

    // Add the contract_length column to the deals table
    try {
      console.log('Adding contract_length column to deals table...');
      await client.query('ALTER TABLE deals ADD COLUMN IF NOT EXISTS contract_length INTEGER');
      console.log('contract_length column added successfully');
    } catch (error) {
      console.error('Error adding contract_length column:', error.message);
    }

    // Add the closed_date column to the deals table
    try {
      console.log('Adding closed_date column to deals table...');
      await client.query('ALTER TABLE deals ADD COLUMN IF NOT EXISTS closed_date TIMESTAMP');
      console.log('closed_date column added successfully');
    } catch (error) {
      console.error('Error adding closed_date column:', error.message);
    }

    // Verify the columns were added
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'deals'
      AND column_name IN ('contract_length', 'closed_date')
    `);

    console.log('Columns in deals table:', result.rows.map(row => row.column_name));

    // Fix foreign key constraints to add ON DELETE CASCADE
    console.log('\n=== Fixing Foreign Key Constraints ===\n');

    try {
      // Start a transaction for constraint modifications
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

        try {
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
        } catch (constraintError) {
          console.error(`Error processing constraint ${constraint_name}:`, constraintError.message);
        }
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

        try {
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
        } catch (constraintError) {
          console.error(`Error processing constraint ${constraint_name}:`, constraintError.message);
        }
      }

      // Commit the transaction
      await client.query('COMMIT');
      console.log('Foreign key constraints fixed successfully');

    } catch (constraintsError) {
      // Rollback the transaction in case of error
      await client.query('ROLLBACK');
      console.error('Error fixing foreign key constraints:', constraintsError.message);
    }

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the function
fixDatabase();
