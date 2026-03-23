const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Recording Model
 * Stores recorded simulation data for playback and analysis
 */
const Recording = sequelize.define('Recording', {
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
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'sessions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  frames: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  statistics: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'recordings',
  indexes: [
    {
      name: 'idx_recording_session',
      fields: ['sessionId']
    },
    {
      name: 'idx_recording_created',
      fields: ['createdAt']
    }
  ]
});

// Define associations
Recording.associate = (models) => {
  Recording.belongsTo(models.Session, {
    foreignKey: 'sessionId',
    as: 'session'
  });
};

module.exports = Recording;
