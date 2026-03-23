/**
 * Script to alter Session table to make crossroadId nullable
 * Run this once to update the database schema
 */

const { sequelize } = require('../config/database');

async function alterSessionTable() {
  try {
    
    // Connect to database
    await sequelize.authenticate();
    
    // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
    // First, let's check the current schema
    const queryInterface = sequelize.getQueryInterface();
    
    // Get current sessions data
    const [sessions] = await sequelize.query('SELECT * FROM sessions');
    
    // Drop the sessions table
    await queryInterface.dropTable('sessions');
    
    // Recreate the table with new schema
    require('../models/Session');
    await sequelize.sync();
    
    // Restore data
    if (sessions.length > 0) {
      const Session = require('../models/Session');
      for (const sessionData of sessions) {
        await Session.create(sessionData);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error altering table:', error);
    process.exit(1);
  }
}

alterSessionTable();
