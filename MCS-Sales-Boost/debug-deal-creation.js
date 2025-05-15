import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function debugDealCreation() {
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
      
      // Create a test customer
      console.log('Creating test customer...');
      const customerResult = await client.query(`
        INSERT INTO customers (name, created_at)
        VALUES ('Test Customer', NOW())
        RETURNING id
      `);
      
      const customerId = customerResult.rows[0].id;
      console.log(`Created test customer with ID: ${customerId}`);
      
      // Get a test user
      console.log('Getting a test user...');
      const userResult = await client.query(`
        SELECT id FROM users LIMIT 1
      `);
      
      if (userResult.rows.length === 0) {
        console.error('No users found in the database');
        return;
      }
      
      const userId = userResult.rows[0].id;
      console.log(`Using user with ID: ${userId}`);
      
      // Try to create a deal with all required fields
      console.log('Attempting to create a test deal...');
      try {
        const dealResult = await client.query(`
          INSERT INTO deals (
            name, 
            value, 
            category, 
            stage, 
            customer_id, 
            user_id, 
            client_type, 
            mrc, 
            nrc, 
            tcv, 
            contract_length,
            created_at, 
            updated_at
          )
          VALUES (
            'Test Deal', 
            1000, 
            'wireless', 
            'prospecting', 
            $1, 
            $2, 
            'B2B', 
            100, 
            200, 
            1400, 
            12,
            NOW(), 
            NOW()
          )
          RETURNING id
        `, [customerId, userId]);
        
        const dealId = dealResult.rows[0].id;
        console.log(`Successfully created test deal with ID: ${dealId}`);
      } catch (dealError) {
        console.error('Error creating test deal:', dealError);
        
        // Check if the error is related to missing columns
        if (dealError.message.includes('column') && dealError.message.includes('does not exist')) {
          console.log('\nPossible schema issue detected. Checking deals table structure...');
          
          const columnsResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'deals'
            ORDER BY ordinal_position
          `);
          
          console.log('Deals table columns:');
          columnsResult.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
          });
          
          console.log('\nRequired columns for deal creation:');
          console.log('- name');
          console.log('- value');
          console.log('- category');
          console.log('- stage');
          console.log('- customer_id');
          console.log('- user_id');
          console.log('- client_type');
          console.log('- mrc');
          console.log('- nrc');
          console.log('- tcv');
          console.log('- contract_length');
          
          // Check for missing columns
          const requiredColumns = ['name', 'value', 'category', 'stage', 'customer_id', 'user_id', 'client_type', 'mrc', 'nrc', 'tcv', 'contract_length'];
          const existingColumns = columnsResult.rows.map(row => row.column_name);
          
          const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
          if (missingColumns.length > 0) {
            console.log('\nMissing columns:', missingColumns);
            console.log('These columns need to be added to the deals table.');
          } else {
            console.log('\nAll required columns exist in the deals table.');
          }
        }
      }
      
    } finally {
      client.release();
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Error debugging deal creation:', error);
    process.exit(1);
  }
}

// Run the debug function
debugDealCreation();
