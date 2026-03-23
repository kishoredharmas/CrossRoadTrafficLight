const Crossroad = require('../models/Crossroad');

/**
 * CrossroadManager - Service layer for Crossroad operations
 * Refactored to use Sequelize ORM instead of direct file system access
 */
class CrossroadManager {
  constructor() {
    // No longer needs file system setup
    // Database is initialized in server/index.js
  }

  /**
   * List all crossroads
   * @returns {Promise<Array>} Array of crossroad objects
   */
  async listCrossroads() {
    try {
      const crossroads = await Crossroad.findAll({
        order: [['createdAt', 'DESC']]
      });
      
      // Convert Sequelize instances to plain objects
      return crossroads.map(c => c.toJSON());
    } catch (error) {
      console.error('Error listing crossroads:', error);
      throw error;
    }
  }

  /**
   * Get a single crossroad by ID
   * @param {string} id - Crossroad UUID
   * @returns {Promise<Object|null>} Crossroad object or null
   */
  async getCrossroad(id) {
    try {
      const crossroad = await Crossroad.findByPk(id);
      return crossroad ? crossroad.toJSON() : null;
    } catch (error) {
      console.error('Error reading crossroad:', error);
      throw error;
    }
  }

  /**
   * Create a new crossroad
   * @param {Object} crossroadData - Crossroad data
   * @returns {Promise<Object>} Created crossroad
   */
  async createCrossroad(crossroadData) {
    try {
      const name = crossroadData.name || 'New Crossroad';
      
      // Check for duplicate name
      const existingCrossroad = await Crossroad.findOne({ where: { name } });
      if (existingCrossroad) {
        const error = new Error(`A crossroad with the name "${name}" already exists. Please choose a different name.`);
        error.code = 'DUPLICATE_NAME';
        throw error;
      }
      
      const crossroad = await Crossroad.create({
        name,
        description: crossroadData.description || '',
        location: crossroadData.location || { lat: 40.7128, lng: -74.0060 },
        mapProvider: crossroadData.mapProvider || 'openstreetmap',
        lanes: crossroadData.lanes || this.getDefaultLanes(),
        signals: crossroadData.signals || this.getDefaultSignals()
      });
      
      return crossroad.toJSON();
    } catch (error) {
      console.error('Error creating crossroad:', error);
      throw error;
    }
  }

  /**
   * Update an existing crossroad
   * @param {string} id - Crossroad UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated crossroad or null
   */
  async updateCrossroad(id, updates) {
    try {
      const crossroad = await Crossroad.findByPk(id);
      if (!crossroad) {
        return null;
      }

      // Check for duplicate name if name is being updated
      if (updates.name && updates.name !== crossroad.name) {
        const existingCrossroad = await Crossroad.findOne({ where: { name: updates.name } });
        if (existingCrossroad && existingCrossroad.id !== id) {
          const error = new Error(`A crossroad with the name "${updates.name}" already exists. Please choose a different name.`);
          error.code = 'DUPLICATE_NAME';
          throw error;
        }
      }

      // Update only allowed fields
      const allowedFields = ['name', 'description', 'location', 'mapProvider', 'lanes', 'signals'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      await crossroad.update(updateData);
      return crossroad.toJSON();
    } catch (error) {
      console.error('Error updating crossroad:', error);
      throw error;
    }
  }

  /**
   * Delete a crossroad
   * @param {string} id - Crossroad UUID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async deleteCrossroad(id) {
    try {
      const crossroad = await Crossroad.findByPk(id);
      if (!crossroad) {
        return false;
      }

      await crossroad.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting crossroad:', error);
      throw error;
    }
  }

  getDefaultLanes() {
    return {
      north: {
        incoming: [
          { id: 'N1', type: 'straight', direction: 'north', length: 200, pairId: null },
          { id: 'N2', type: 'left', direction: 'north', length: 200, pairId: null },
          { id: 'N3', type: 'right', direction: 'north', length: 200, pairId: null }
        ],
        outgoing: [
          { id: 'N4', type: 'straight', direction: 'north', length: 200, pairId: null }
        ]
      },
      south: {
        incoming: [
          { id: 'S1', type: 'straight', direction: 'south', length: 200, pairId: null },
          { id: 'S2', type: 'left', direction: 'south', length: 200, pairId: null },
          { id: 'S3', type: 'right', direction: 'south', length: 200, pairId: null }
        ],
        outgoing: [
          { id: 'S4', type: 'straight', direction: 'south', length: 200, pairId: null }
        ]
      },
      east: {
        incoming: [
          { id: 'E1', type: 'straight', direction: 'east', length: 200, pairId: null },
          { id: 'E2', type: 'left', direction: 'east', length: 200, pairId: null },
          { id: 'E3', type: 'right', direction: 'east', length: 200, pairId: null }
        ],
        outgoing: [
          { id: 'E4', type: 'straight', direction: 'east', length: 200, pairId: null }
        ]
      },
      west: {
        incoming: [
          { id: 'W1', type: 'straight', direction: 'west', length: 200, pairId: null },
          { id: 'W2', type: 'left', direction: 'west', length: 200, pairId: null },
          { id: 'W3', type: 'right', direction: 'west', length: 200, pairId: null }
        ],
        outgoing: [
          { id: 'W4', type: 'straight', direction: 'west', length: 200, pairId: null }
        ]
      }
    };
  }

  getDefaultSignals() {
    return {
      north: [
        { id: 'SIG_N1', state: 'red', timeInState: 0, direction: 'north', laneId: 'N1' },
        { id: 'SIG_N2', state: 'red', timeInState: 0, direction: 'north', laneId: 'N2' },
        { id: 'SIG_N3', state: 'red', timeInState: 0, direction: 'north', laneId: 'N3' }
      ],
      south: [
        { id: 'SIG_S1', state: 'red', timeInState: 0, direction: 'south', laneId: 'S1' },
        { id: 'SIG_S2', state: 'red', timeInState: 0, direction: 'south', laneId: 'S2' },
        { id: 'SIG_S3', state: 'red', timeInState: 0, direction: 'south', laneId: 'S3' }
      ],
      east: [
        { id: 'SIG_E1', state: 'green', timeInState: 0, direction: 'east', laneId: 'E1' },
        { id: 'SIG_E2', state: 'green', timeInState: 0, direction: 'east', laneId: 'E2' },
        { id: 'SIG_E3', state: 'green', timeInState: 0, direction: 'east', laneId: 'E3' }
      ],
      west: [
        { id: 'SIG_W1', state: 'green', timeInState: 0, direction: 'west', laneId: 'W1' },
        { id: 'SIG_W2', state: 'green', timeInState: 0, direction: 'west', laneId: 'W2' },
        { id: 'SIG_W3', state: 'green', timeInState: 0, direction: 'west', laneId: 'W3' }
      ]
    };
  }
}

module.exports = CrossroadManager;
