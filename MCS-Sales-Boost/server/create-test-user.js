// Script to create a test user
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createTestUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check if user exists
    const checkResult = await pool.query(
      'SELECT id, username FROM users WHERE username = $1',
      ['AbishekJ']
    );

    const hashedPassword = await bcrypt.hash('password', 10);

    if (checkResult.rows.length > 0) {
      // Update existing user
      const userId = checkResult.rows[0].id;
      console.log(`Updating existing user with ID ${userId}`);
      
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );
      
      console.log('User password updated successfully');
    } else {
      // Create new user
      const result = await pool.query(
        `INSERT INTO users (username, password, name, email, role) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['AbishekJ', hashedPassword, 'Abishek J', 'abishek@example.com', 'sales_rep']
      );
      
      console.log(`User created with ID: ${result.rows[0].id}`);
    }

    // Verify the user exists
    const verifyResult = await pool.query(
      'SELECT id, username, name, role FROM users WHERE username = $1',
      ['AbishekJ']
    );
    
    console.log('User in database:', verifyResult.rows[0]);
  } catch (error) {
    console.error('Error creating/updating test user:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();
