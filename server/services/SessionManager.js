const Session = require('../models/Session');
const Crossroad = require('../models/Crossroad');

/**
 * SessionManager - Service layer for Session operations
 * Refactored to use Sequelize ORM instead of direct file system access
 */
class SessionManager {
  constructor() {
    // No longer needs file system setup
    // Database is initialized in server/index.js
  }

  /**
   * List all sessions
   * @returns {Promise<Array>} Array of session objects
   */
  async listSessions() {
    try {
      const sessions = await Session.findAll({
        order: [['createdAt', 'DESC']],
        // Optionally include associated crossroad data
        // include: [{ model: Crossroad, as: 'crossroad' }]
      });
      
      return sessions.map(s => s.toJSON());
    } catch (error) {
      console.error('Error listing sessions:', error);
      throw error;
    }
  }

  /**
   * Get a single session by ID
   * @param {string} id - Session UUID
   * @returns {Promise<Object|null>} Session object or null
   */
  async getSession(id) {
    try {
      const session = await Session.findByPk(id);
      return session ? session.toJSON() : null;
    } catch (error) {
      console.error('Error reading session:', error);
      throw error;
    }
  }

  /**
   * Create a new session
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Created session
   */
  async createSession(sessionData) {
    try {
      const name = sessionData.name || 'New Session';
      
      // Check for duplicate name
      const existingSession = await Session.findOne({ where: { name } });
      if (existingSession) {
        const error = new Error(`A session with the name "${name}" already exists. Please choose a different name.`);
        error.code = 'DUPLICATE_NAME';
        throw error;
      }
      
      const session = await Session.create({
        name,
        crossroadId: sessionData.crossroadId || sessionData.crossroad?.id || null,
        algorithm: sessionData.algorithm || 'fixed-time',
        configuration: sessionData.configuration || sessionData.config || {
          vehicleSpawnRate: 5,
          simulationSpeed: 1,
          duration: 300
        },
        status: 'created'
      });
      
      return session.toJSON();
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Update an existing session
   * @param {string} id - Session UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated session or null
   */
  async updateSession(id, updates) {
    try {
      const session = await Session.findByPk(id);
      if (!session) {
        return null;
      }

      // Check for duplicate name if name is being updated
      if (updates.name && updates.name !== session.name) {
        const existingSession = await Session.findOne({ where: { name: updates.name } });
        if (existingSession && existingSession.id !== id) {
          const error = new Error(`A session with the name "${updates.name}" already exists. Please choose a different name.`);
          error.code = 'DUPLICATE_NAME';
          throw error;
        }
      }

      // Update only allowed fields
      const allowedFields = ['name', 'algorithm', 'configuration', 'status', 'startTime', 'endTime', 'statistics'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      await session.update(updateData);
      return session.toJSON();
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Delete a session
   * @param {string} id - Session UUID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async deleteSession(id) {
    try {
      const session = await Session.findByPk(id);
      if (!session) {
        return false;
      }

      await session.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Duplicate an existing session
   * @param {string} id - Session UUID to duplicate
   * @returns {Promise<Object|null>} New session or null
   */
  async duplicateSession(id) {
    try {
      const session = await Session.findByPk(id);
      if (!session) {
        return null;
      }

      const sessionData = session.toJSON();
      const newSession = await Session.create({
        name: `${sessionData.name} (Copy)`,
        crossroadId: sessionData.crossroadId,
        algorithm: sessionData.algorithm,
        configuration: sessionData.configuration,
        status: 'created'
      });

      return newSession.toJSON();
    } catch (error) {
      console.error('Error duplicating session:', error);
      throw error;
    }
  }
}

module.exports = SessionManager;
