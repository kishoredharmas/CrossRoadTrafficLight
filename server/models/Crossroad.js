const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Crossroad Model
 * Represents a traffic intersection design with lanes and signals
 */
const Crossroad = sequelize.define('Crossroad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  location: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: { lat: 40.7128, lng: -74.0060 },
    validate: {
      isValidLocation(value) {
        if (!value.lat || !value.lng) {
          throw new Error('Location must have lat and lng properties');
        }
      }
    }
  },
  mapProvider: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'openstreetmap',
    validate: {
      isIn: [['openstreetmap', 'google', 'mapbox']]
    }
  },
  lanes: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      north: { incoming: [], outgoing: [] },
      south: { incoming: [], outgoing: [] },
      east: { incoming: [], outgoing: [] },
      west: { incoming: [], outgoing: [] }
    },
    validate: {
      isValidLanes(value) {
        const requiredDirections = ['north', 'south', 'east', 'west'];
        for (const dir of requiredDirections) {
          if (!value[dir] || !value[dir].incoming || !value[dir].outgoing) {
            throw new Error(`Invalid lanes structure: missing ${dir} direction`);
          }
        }
      }
    }
  },
  signals: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  }
}, {
  tableName: 'crossroads',
  indexes: [
    {
      name: 'idx_crossroad_name',
      fields: ['name']
    },
    {
      name: 'idx_crossroad_created',
      fields: ['createdAt']
    }
  ]
});

module.exports = Crossroad;
