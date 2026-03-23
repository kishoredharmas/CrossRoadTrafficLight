# Traffic Light Simulation - Unit Tests

This directory contains comprehensive unit tests for the Traffic Light Simulation project.

## Test Structure

```
tests/
├── services/           # Tests for service layer
│   ├── SessionManager.test.js
│   ├── CrossroadManager.test.js
│   └── RecordingManager.test.js
├── simulation/         # Tests for simulation engine
│   ├── VehicleGenerator.test.js
│   └── TrafficSignalAlgorithms.test.js
├── routes/            # Tests for API routes
│   └── sessionRoutes.test.js
└── setup.js           # Test configuration and utilities
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run specific test file
```bash
npm test SessionManager.test.js
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should create"
```

## Coverage Goals

The project aims for:
- **70%** branch coverage
- **70%** function coverage
- **70%** line coverage
- **70%** statement coverage

## Test Categories

### Service Tests
Tests for business logic layer including:
- SessionManager: Session CRUD operations
- CrossroadManager: Crossroad design validation
- RecordingManager: Recording storage and retrieval

### Simulation Tests
Tests for simulation engine including:
- VehicleGenerator: Vehicle spawning and behavior
- TrafficSignalAlgorithms: Signal control logic

### Route Tests
Tests for REST API endpoints including:
- Session endpoints
- Crossroad endpoints
- Recording endpoints

## Writing New Tests

### Service Test Template
```javascript
const ServiceClass = require('../../server/services/ServiceClass');
const { sequelize } = require('../../server/config/database');

describe('ServiceClass', () => {
  let service;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(() => {
    service = new ServiceClass();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should do something', async () => {
    // Test implementation
  });
});
```

### Route Test Template
```javascript
const request = require('supertest');
const express = require('express');
const routes = require('../../server/routes/someRoutes');

describe('Some Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/resource', routes);
  });

  it('should handle GET request', async () => {
    const response = await request(app).get('/api/resource');
    expect(response.status).toBe(200);
  });
});
```

## CI/CD Integration

Tests are automatically run in GitLab CI:
- On every push
- On merge requests
- Coverage reports are generated and published
- JUnit reports for test visualization

## Dependencies

- **Jest**: Test framework
- **Supertest**: HTTP assertion library
- **jest-junit**: JUnit report generation
