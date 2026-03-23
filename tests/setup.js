// Test setup and utilities
const { Sequelize } = require('sequelize');

// Mock database connection for tests
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false
});

// Setup before all tests
beforeAll(async () => {
  // Sync database
  await sequelize.sync({ force: true });
});

// Cleanup after all tests
afterAll(async () => {
  await sequelize.close();
});

// Clear database between tests
afterEach(async () => {
  // Truncate all tables
  const models = Object.values(sequelize.models);
  for (const model of models) {
    await model.destroy({ where: {}, force: true });
  }
});

module.exports = { sequelize };
