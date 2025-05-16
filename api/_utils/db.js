// Database connection utility
const { Pool } = require('pg');

// Shared database connection pool
let pool = null;

/**
 * Get or create database connection pool
 * @returns {Promise<Pool|null>} Database connection pool or null on error
 */
const getPool = async () => {
  if (pool) {
    return pool;
  }

  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not defined in environment variables');
      return null;
    }

    // Create new connection pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Test the connection
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('Database connection successful');
    } finally {
      client.release();
    }
    
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    pool = null;
    return null;
  }
};

/**
 * Execute a database query
 * @param {string} query SQL query to execute
 * @param {Array} params Query parameters
 * @param {boolean} returnSingleRow Whether to return single row or all rows
 * @returns {Promise<Object|Array|null>} Query result or null on error
 */
const query = async (query, params = [], returnSingleRow = false) => {
  try {
    const pool = await getPool();
    if (!pool) {
      throw new Error('Database connection failed');
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      if (returnSingleRow) {
        return result.rows[0] || null;
      }
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  getPool,
  query
}; 