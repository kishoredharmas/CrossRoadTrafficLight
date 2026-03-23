const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
// For production, you can easily switch to PostgreSQL by changing the configuration
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../data/traffic_simulation.db'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    underscored: false // Use camelCase instead of snake_case
  }
});

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
  }
};

// Initialize database (sync models)
const initializeDatabase = async () => {
  try {
    // Import models
    require('../models/Crossroad');
    require('../models/Session');
    require('../models/Recording');
    
    // Sync all models with database
    // Create tables if they don't exist, but don't alter existing ones
    await sequelize.sync();
  } catch (error) {
    console.error('✗ Error synchronizing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase
};
