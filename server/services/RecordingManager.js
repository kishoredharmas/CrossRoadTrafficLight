const Recording = require('../models/Recording');
const Session = require('../models/Session');

/**
 * RecordingManager - Service layer for Recording operations
 * Refactored to use Sequelize ORM instead of direct file system access
 */
class RecordingManager {
  constructor() {
    // No longer needs file system setup
    // Database is initialized in server/index.js
  }

  /**
   * List all recordings (summary view without full frames data)
   * @returns {Promise<Array>} Array of recording summary objects
   */
  async listRecordings() {
    try {
      const recordings = await Recording.findAll({
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'sessionId', 'duration', 'createdAt', 'updatedAt']
      });
      
      return recordings.map(r => r.toJSON());
    } catch (error) {
      console.error('Error listing recordings:', error);
      throw error;
    }
  }

  /**
   * Get a single recording by ID (includes full frames data)
   * @param {string} id - Recording UUID
   * @returns {Promise<Object|null>} Recording object or null
   */
  async getRecording(id) {
    try {
      const recording = await Recording.findByPk(id);
      return recording ? recording.toJSON() : null;
    } catch (error) {
      console.error('Error reading recording:', error);
      throw error;
    }
  }

  /**
   * Save a new recording
   * @param {Object} recordingData - Recording data
   * @returns {Promise<Object>} Created recording
   */
  async saveRecording(recordingData) {
    try {
      const recording = await Recording.create({
        name: recordingData.name || 'Unnamed Recording',
        sessionId: recordingData.sessionId,
        duration: recordingData.duration || 0,
        frames: recordingData.frames || recordingData.events || [],
        statistics: recordingData.statistics || null,
        metadata: recordingData.metadata || {
          crossroad: recordingData.crossroad,
          config: recordingData.config,
          algorithm: recordingData.algorithm,
          startTime: recordingData.startTime,
          endTime: recordingData.endTime
        }
      });
      
      return recording.toJSON();
    } catch (error) {
      console.error('Error saving recording:', error);
      throw error;
    }
  }

  /**
   * Delete a recording
   * @param {string} id - Recording UUID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async deleteRecording(id) {
    try {
      const recording = await Recording.findByPk(id);
      if (!recording) {
        return false;
      }

      await recording.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  /**
   * Create a playback session from a recording
   * @param {string} recordingId - Recording UUID
   * @returns {Promise<Object|null>} Playback session data or null
   */
  async createPlaybackSession(recordingId) {
    try {
      const recording = await Recording.findByPk(recordingId);
      if (!recording) {
        return null;
      }

      const recordingData = recording.toJSON();
      const { v4: uuidv4 } = require('uuid');

      // Create a playback session with the recording data
      return {
        id: uuidv4(),
        type: 'playback',
        recordingId: recordingData.id,
        name: `Playback: ${recordingData.name}`,
        metadata: recordingData.metadata,
        frames: recordingData.frames,
        currentFrameIndex: 0,
        isPlaying: false
      };
    } catch (error) {
      console.error('Error creating playback session:', error);
      throw error;
    }
  }
}

module.exports = RecordingManager;
