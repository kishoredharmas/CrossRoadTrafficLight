/**
 * Database Test Script
 * Tests CRUD operations for all models
 */

const { sequelize, testConnection, initializeDatabase } = require('../config/database');
const Crossroad = require('../models/Crossroad');
const Session = require('../models/Session');
const Recording = require('../models/Recording');

/**
 * Test Crossroad CRUD operations
 */
async function testCrossroads() {
  
  try {
    // Count existing crossroads
    const count = await Crossroad.count();

    // List all crossroads
    const crossroads = await Crossroad.findAll({
      attributes: ['id', 'name', 'createdAt'],
      limit: 5
    });
    
    if (crossroads.length > 0) {
    }

    return true;
  } catch (error) {
    console.error('  ✗ Crossroad test failed:', error.message);
    return false;
  }
}

/**
 * Test Session CRUD operations
 */
async function testSessions() {
  
  try {
    // Count existing sessions
    const count = await Session.count();

    // List all sessions
    const sessions = await Session.findAll({
      attributes: ['id', 'name', 'status', 'createdAt'],
      limit: 5
    });
    
    if (sessions.length > 0) {
    }

    return true;
  } catch (error) {
    console.error('  ✗ Session test failed:', error.message);
    return false;
  }
}

/**
 * Test Recording CRUD operations
 */
async function testRecordings() {
  
  try {
    // Count existing recordings
    const count = await Recording.count();

    // List all recordings
    const recordings = await Recording.findAll({
      attributes: ['id', 'name', 'duration', 'createdAt'],
      limit: 5
    });
    
    if (recordings.length > 0) {
    }

    return true;
  } catch (error) {
    console.error('  ✗ Recording test failed:', error.message);
    return false;
  }
}

/**
 * Test database relationships
 */
async function testRelationships() {
  
  try {
    // Find a session with its crossroad
    const session = await Session.findOne({
      attributes: ['id', 'name', 'crossroadId'],
      limit: 1
    });

    if (session) {
      const crossroad = await Crossroad.findByPk(session.crossroadId);
      if (crossroad) {
      } else {
      }
    } else {
    }

    // Find a recording with its session
    const recording = await Recording.findOne({
      attributes: ['id', 'name', 'sessionId'],
      limit: 1
    });

    if (recording) {
      const recordingSession = await Session.findByPk(recording.sessionId);
      if (recordingSession) {
      } else {
      }
    } else {
    }

    return true;
  } catch (error) {
    console.error('  ✗ Relationship test failed:', error.message);
    return false;
  }
}

/**
 * Test database statistics
 */
async function showStatistics() {
  
  try {
    const crossroadCount = await Crossroad.count();
    const sessionCount = await Session.count();
    const recordingCount = await Recording.count();
    
    
    // Get database size
    const dbPath = require('path').join(__dirname, '../../data/traffic_simulation.db');
    const fs = require('fs');
    
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
    }
    
    return true;
  } catch (error) {
    console.error('  ✗ Statistics failed:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {

  try {
    // Test database connection
    await testConnection();

    // Initialize database
    await initializeDatabase();

    // Run all tests
    const results = {
      crossroads: await testCrossroads(),
      sessions: await testSessions(),
      recordings: await testRecordings(),
      relationships: await testRelationships(),
      statistics: await showStatistics()
    };

    // Summary
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.values(results).length;
    
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
