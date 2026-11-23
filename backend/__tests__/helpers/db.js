/**
 * Helper functions for database-related tests
 */

const { pool } = require('../../src/config/database');

/**
 * Check if database is available
 * @returns {Promise<boolean>}
 */
async function isDatabaseAvailable() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Skip test if database is not available
 * Use this in beforeAll or beforeEach hooks
 */
async function skipIfNoDatabase() {
  const available = await isDatabaseAvailable();
  if (!available) {
    console.warn('⚠️  Database not available, skipping database-dependent tests');
    return true;
  }
  return false;
}

module.exports = {
  isDatabaseAvailable,
  skipIfNoDatabase
};

