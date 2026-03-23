const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Session Model
 * Represents a simulation session with configuration and state
 */
const Session = sequelize.define('Session', {
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
  crossroadId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'crossroads',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  algorithm: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'fixed-time',
    validate: {
      isIn: [['fixed-time', 'adaptive', 'coordinated']]
    }
  },
  configuration: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      vehicleSpawnRate: 5,
      simulationSpeed: 1,
      duration: 300
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'created',
    validate: {
      isIn: [['created', 'running', 'paused', 'completed', 'stopped']]
    }
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statistics: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'sessions',
  indexes: [
    {
      name: 'idx_session_crossroad',
      fields: ['crossroadId']
    },
    {
      name: 'idx_session_status',
      fields: ['status']
    },
    {
      name: 'idx_session_created',
      fields: ['createdAt']
    }
  ]
});

// Define associations
Session.associate = (models) => {
  Session.belongsTo(models.Crossroad, {
    foreignKey: 'crossroadId',
    as: 'crossroad'
  });
};

module.exports = Session;
