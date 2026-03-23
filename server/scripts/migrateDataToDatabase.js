/**
 * Migration Script: Import existing JSON data to SQLite database
 * This script reads JSON files from data directories and imports them into the database
 */

const fs = require('fs').promises;
const path = require('path');
const { sequelize, testConnection, initializeDatabase } = require('../config/database');
const Crossroad = require('../models/Crossroad');
const Session = require('../models/Session');
const Recording = require('../models/Recording');

const DATA_DIR = path.join(__dirname, '../../data');
const CROSSROADS_DIR = path.join(DATA_DIR, 'crossroads');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
const RECORDINGS_DIR = path.join(DATA_DIR, 'recordings');

/**
 * Read all JSON files from a directory
 */
async function readJsonFiles(directory) {
  try {
    const files = await fs.readdir(directory);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const data = [];
    for (const file of jsonFiles) {
      const filePath = path.join(directory, file);
      const content = await fs.readFile(filePath, 'utf-8');
      data.push(JSON.parse(content));
    }
    
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Migrate crossroads from JSON files to database
 */
async function migrateCrossroads() {
  
  const crossroads = await readJsonFiles(CROSSROADS_DIR);
  let imported = 0;
  let skipped = 0;

  for (const crossroadData of crossroads) {
    try {
      // Check if crossroad already exists
      const existing = await Crossroad.findByPk(crossroadData.id);
      
      if (existing) {
        skipped++;
        continue;
      }

      // Create new crossroad
      await Crossroad.create({
        id: crossroadData.id,
        name: crossroadData.name || 'Imported Crossroad',
        description: crossroadData.description || '',
        location: crossroadData.location || { lat: 40.7128, lng: -74.0060 },
        mapProvider: crossroadData.mapProvider || 'openstreetmap',
        lanes: crossroadData.lanes || {},
        signals: crossroadData.signals || {}
      });

      imported++;
    } catch (error) {
      console.error(`  ❌ Error importing crossroad ${crossroadData.id}:`, error.message);
    }
  }

  return { imported, skipped, total: crossroads.length };
}

/**
 * Migrate sessions from JSON files to database
 */
async function migrateSessions() {
  
  const sessions = await readJsonFiles(SESSIONS_DIR);
  let imported = 0;
  let skipped = 0;

  for (const sessionData of sessions) {
    try {
      // Check if session already exists
      const existing = await Session.findByPk(sessionData.id);
      
      if (existing) {
        skipped++;
        continue;
      }

      // Verify crossroad exists
      const crossroad = await Crossroad.findByPk(sessionData.crossroadId || sessionData.crossroad?.id);
      if (!crossroad) {
        skipped++;
        continue;
      }

      // Create new session
      await Session.create({
        id: sessionData.id,
        name: sessionData.name || 'Imported Session',
        crossroadId: sessionData.crossroadId || sessionData.crossroad?.id,
        algorithm: sessionData.algorithm || 'fixed-time',
        configuration: sessionData.configuration || sessionData.config || {},
        status: sessionData.status || 'created',
        startTime: sessionData.startTime || null,
        endTime: sessionData.endTime || null,
        statistics: sessionData.statistics || null
      });

      imported++;
    } catch (error) {
      console.error(`  ❌ Error importing session ${sessionData.id}:`, error.message);
    }
  }

  return { imported, skipped, total: sessions.length };
}

/**
 * Migrate recordings from JSON files to database
 */
async function migrateRecordings() {
  
  const recordings = await readJsonFiles(RECORDINGS_DIR);
  let imported = 0;
  let skipped = 0;

  for (const recordingData of recordings) {
    try {
      // Check if recording already exists
      const existing = await Recording.findByPk(recordingData.id);
      
      if (existing) {
        skipped++;
        continue;
      }

      // Verify session exists
      const session = await Session.findByPk(recordingData.sessionId);
      if (!session) {
        skipped++;
        continue;
      }

      // Create new recording
      await Recording.create({
        id: recordingData.id,
        name: recordingData.name || 'Imported Recording',
        sessionId: recordingData.sessionId,
        duration: recordingData.duration || 0,
        frames: recordingData.frames || recordingData.events || [],
        statistics: recordingData.statistics || null,
        metadata: recordingData.metadata || {}
      });

      imported++;
    } catch (error) {
      console.error(`  ❌ Error importing recording ${recordingData.id}:`, error.message);
    }
  }

  return { imported, skipped, total: recordings.length };
}

/**
 * Main migration function
 */
async function runMigration() {

  try {
    // Test database connection
    await testConnection();

    // Initialize database (sync models)
    await initializeDatabase();

    // Run migrations in order (crossroads first, then sessions, then recordings)
    const crossroadStats = await migrateCrossroads();
    const sessionStats = await migrateSessions();
    const recordingStats = await migrateRecordings();

    // Summary

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
