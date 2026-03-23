# Contributing Guide

## Welcome

Thank you for considering contributing to the Traffic Light Simulation project! This document provides guidelines and instructions for contributing.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Project Structure](#project-structure)
9. [Development Tools](#development-tools)
10. [Common Tasks](#common-tasks)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the project
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information

---

## Getting Started

### Prerequisites

1. **Node.js 18.x** or higher
2. **npm 9.x** or higher
3. **Git**
4. Code editor (VS Code recommended)

### Initial Setup

```bash
# 1. Fork the repository on GitLab

# 2. Clone your fork
git clone https://your-gitlab-url/your-username/trafficlightsimulation.git
cd trafficlightsimulation

# 3. Add upstream remote
git remote add upstream https://assets.engine.capgemini.com/KISSELVA/trafficlightsimulation.git

# 4. Install dependencies
npm install
cd client && npm install && cd ..

# 5. Create environment file
cp .env.example .env

# 6. Start development server
npm run dev:full
```

### Verify Setup

```bash
# Check if application is running
curl http://localhost:3001/api/health

# Should return: {"status":"ok",...}
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write code following [Coding Standards](#coding-standards)
- Add tests for new features
- Update documentation if needed
- Test your changes locally

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add vehicle speed control feature"
```

See [Commit Guidelines](#commit-guidelines) for commit message format.

### 4. Push Changes

```bash
# Push to your fork
git push origin feature/your-feature-name
```

### 5. Create Merge Request

1. Go to GitLab repository
2. Click "Create merge request"
3. Fill in description
4. Link related issues
5. Request review

---

## Coding Standards

### JavaScript Style Guide

#### General Principles

- **Clean Code**: Write self-documenting code
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **SOLID**: Follow SOLID principles where applicable

#### Formatting

```javascript
// Use 2 spaces for indentation
function example() {
  const value = 'hello';
  return value;
}

// Use single quotes
const message = 'Hello World';

// Use template literals for string concatenation
const greeting = `Hello, ${name}!`;

// Use semicolons
const x = 5;

// Use arrow functions for callbacks
array.map(item => item.id);

// Use const by default, let when reassignment needed
const immutable = 'value';
let mutable = 0;
```

#### Naming Conventions

```javascript
// camelCase for variables and functions
const userName = 'John';
function getUserData() {}

// PascalCase for classes and React components
class VehicleManager {}
function SimulationCanvas() {}

// UPPER_CASE for constants
const MAX_VEHICLES = 100;
const API_BASE_URL = 'http://localhost:3001';

// Descriptive names
// Bad
const d = new Date();
const fn = () => {};

// Good
const currentDate = new Date();
const fetchUserData = () => {};
```

#### Functions

```javascript
// Keep functions small and focused
// Bad
function processUser(user) {
  // 100 lines of code
}

// Good
function validateUser(user) {
  // validation logic
}

function saveUser(user) {
  // save logic
}

function notifyUser(user) {
  // notification logic
}

// Use early returns
// Bad
function validateInput(input) {
  if (input) {
    if (input.length > 0) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

// Good
function validateInput(input) {
  if (!input) return false;
  if (input.length === 0) return false;
  return true;
}
```

#### Comments

```javascript
// Use comments to explain "why", not "what"
// Bad
// Set x to 5
const x = 5;

// Good
// Initialize with default timeout value (5 seconds)
const timeoutDuration = 5;

// Use JSDoc for function documentation
/**
 * Calculates average speed of vehicles in a lane
 * @param {Array<Vehicle>} vehicles - Array of vehicle objects
 * @param {string} laneId - Lane identifier
 * @returns {number} Average speed in km/h
 */
function calculateAverageSpeed(vehicles, laneId) {
  // implementation
}
```

### React Component Guidelines

#### Functional Components

```javascript
// Use functional components with hooks
import React, { useState, useEffect } from 'react';

function VehicleList({ vehicles, onSelect }) {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    // Effect logic
  }, [vehicles]);

  return (
    <div>
      {vehicles.map(vehicle => (
        <VehicleItem
          key={vehicle.id}
          vehicle={vehicle}
          onClick={() => onSelect(vehicle.id)}
        />
      ))}
    </div>
  );
}

export default VehicleList;
```

#### Component Organization

```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// 2. Component
function MyComponent({ prop1, prop2 }) {
  // 2a. State
  const [state1, setState1] = useState(null);
  
  // 2b. Hooks
  const navigate = useNavigate();
  
  // 2c. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 2d. Handlers
  const handleClick = () => {
    // ...
  };
  
  // 2e. Render
  return (
    <Box>
      <Button onClick={handleClick}>Click</Button>
    </Box>
  );
}

// 3. Export
export default MyComponent;
```

### Backend Guidelines

#### Express Routes

```javascript
// Use router
const express = require('express');
const router = express.Router();

// Async/await with error handling
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await sessionManager.listSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Input validation
router.post('/sessions', async (req, res) => {
  const { name, crossroadId, algorithm } = req.body;
  
  if (!name || !crossroadId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const session = await sessionManager.createSession(req.body);
    res.status(201).json(session);
  } catch (error) {
    console.error('Failed to create session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

#### Service Layer

```javascript
class SessionManager {
  /**
   * Creates a new simulation session
   * @param {Object} data - Session data
   * @returns {Promise<Session>}
   */
  async createSession(data) {
    // Validate input
    this.validateSessionData(data);
    
    // Create session
    const session = await Session.create(data);
    
    // Return result
    return session.toJSON();
  }
  
  /**
   * Validates session data
   * @private
   * @param {Object} data - Session data
   * @throws {Error} If validation fails
   */
  validateSessionData(data) {
    if (!data.name) {
      throw new Error('Session name is required');
    }
    // More validation...
  }
}
```

---

## Testing Guidelines

### Unit Tests

#### Structure

```javascript
// tests/unit/services/SessionManager.test.js
const SessionManager = require('../../../server/services/SessionManager');

describe('SessionManager', () => {
  let sessionManager;
  
  beforeEach(() => {
    sessionManager = new SessionManager();
  });
  
  describe('createSession', () => {
    it('should create a session with valid data', async () => {
      const data = {
        name: 'Test Session',
        crossroadId: 'abc-123',
        algorithm: 'fixed-time'
      };
      
      const session = await sessionManager.createSession(data);
      
      expect(session).toBeDefined();
      expect(session.name).toBe('Test Session');
    });
    
    it('should throw error with invalid data', async () => {
      const data = { name: '' };
      
      await expect(sessionManager.createSession(data))
        .rejects.toThrow('Session name is required');
    });
  });
});
```

### Integration Tests

```javascript
// tests/integration/api/sessions.test.js
const request = require('supertest');
const app = require('../../../server/index');

describe('Sessions API', () => {
  describe('GET /api/sessions', () => {
    it('should return list of sessions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  describe('POST /api/sessions', () => {
    it('should create new session', async () => {
      const data = {
        name: 'Test Session',
        crossroadId: 'abc-123'
      };
      
      const response = await request(app)
        .post('/api/sessions')
        .send(data)
        .expect(201);
      
      expect(response.body.name).toBe('Test Session');
    });
  });
});
```

### Component Tests

```javascript
// tests/components/VehicleList.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import VehicleList from '../../../client/src/components/VehicleList';

describe('VehicleList', () => {
  const mockVehicles = [
    { id: '1', type: 'car', speed: 50 },
    { id: '2', type: 'truck', speed: 40 }
  ];
  
  it('renders vehicle list', () => {
    render(<VehicleList vehicles={mockVehicles} />);
    
    expect(screen.getByText(/car/i)).toBeInTheDocument();
    expect(screen.getByText(/truck/i)).toBeInTheDocument();
  });
  
  it('calls onSelect when vehicle clicked', () => {
    const onSelect = jest.fn();
    render(<VehicleList vehicles={mockVehicles} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText(/car/i));
    
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- SessionManager.test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, configs)
- **ci**: CI/CD changes

### Examples

```bash
# Simple feature
git commit -m "feat: add vehicle speed control"

# Bug fix with scope
git commit -m "fix(simulation): correct collision detection logic"

# With body and footer
git commit -m "feat(api): add session duplication endpoint

Allows users to duplicate existing sessions with all configurations.
Useful for A/B testing different algorithm parameters.

Closes #123"
```

### Best Practices

- Use imperative mood ("add" not "added")
- Keep subject line under 50 characters
- Capitalize first letter
- No period at the end of subject
- Separate subject from body with blank line
- Explain "what" and "why" in body, not "how"
- Reference issues/MRs in footer

---

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log/debug statements
- [ ] Commit messages follow guidelines
- [ ] Branch is up-to-date with main

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
Describe testing performed

## Screenshots (if applicable)
Add screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass
```

### Review Process

1. Automated checks must pass
2. At least one approval required
3. Address review comments
4. Maintain discussion etiquette
5. Squash commits if requested

---

## Project Structure

```
trafficlightsimulation/
├── client/                  # React frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── App.js          # Root component
│   │   └── index.js        # Entry point
│   └── package.json
├── server/                 # Express backend
│   ├── config/            # Configuration
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── simulation/        # Simulation engine
│   ├── websocket/         # WebSocket server
│   └── index.js           # Server entry point
├── data/                   # Database and files
├── docs/                   # Documentation
├── tests/                  # Test files
├── .env.example           # Environment template
├── .gitignore
├── .gitlab-ci.yml         # CI/CD configuration
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "eamodio.gitlens",
    "ms-vscode.vscode-node-debug2",
    "christian-kohler.npm-intellisense",
    "wix.vscode-import-cost"
  ]
}
```

### ESLint Configuration

```json
{
  "extends": ["react-app", "eslint:recommended"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "warn",
    "prefer-const": "error"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Create route handler**:
```javascript
// server/routes/sessionRoutes.js
router.post('/sessions/:id/reset', async (req, res) => {
  // Implementation
});
```

2. **Add service method**:
```javascript
// server/services/SessionManager.js
async resetSession(id) {
  // Implementation
}
```

3. **Update tests**:
```javascript
// tests/integration/sessions.test.js
describe('POST /api/sessions/:id/reset', () => {
  it('should reset session', async () => {
    // Test implementation
  });
});
```

4. **Update API documentation**:
```markdown
<!-- API.md -->
## Reset Session
POST /api/sessions/:id/reset
```

### Adding a New React Component

1. **Create component file**:
```javascript
// client/src/components/NewComponent.js
import React from 'react';

function NewComponent({ prop1 }) {
  return <div>{prop1}</div>;
}

export default NewComponent;
```

2. **Add tests**:
```javascript
// tests/components/NewComponent.test.js
import { render } from '@testing-library/react';
import NewComponent from '../NewComponent';

describe('NewComponent', () => {
  it('renders correctly', () => {
    // Test implementation
  });
});
```

3. **Update documentation**:
```markdown
<!-- docs/COMPONENTS.md -->
#### NewComponent
Purpose: ...
```

### Adding a Database Migration

```javascript
// server/migrations/20260210_add_column.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sessions', 'newColumn', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  
  down: async (queryInterface) => {
    await queryInterface.removeColumn('sessions', 'newColumn');
  }
};
```

---

## Questions?

- Check existing documentation
- Search closed issues
- Ask in team chat
- Create discussion issue

---

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort! 🎉
