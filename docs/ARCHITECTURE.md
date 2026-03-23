# System Architecture

## Overview

Traffic Light Simulation is a full-stack web application designed to simulate, visualize, and optimize traffic signal control algorithms. The system uses a client-server architecture with real-time bidirectional communication via WebSockets.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Designer   │  │  Simulation  │  │  Dashboard   │          │
│  │    Pages     │  │     Pages    │  │    Pages     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│  ┌──────────────────────────────────────────────────┐           │
│  │         React Components & State Management      │           │
│  └──────────────────────────────────────────────────┘           │
│         │                  │                  │                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  HTTP Client │  │  WebSocket   │  │  Map APIs    │          │
│  │  (REST API)  │  │    Client    │  │  (OSM/GMaps) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                       │              │
                       │              │
         HTTP/REST     │              │     WebSocket
                       │              │
┌─────────────────────────────────────────────────────────────────┐
│                        Server Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Express.js  │  │  WebSocket   │  │   Simulation │          │
│  │  REST API    │  │    Server    │  │    Engine    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│  ┌──────────────────────────────────────────────────┐           │
│  │              Service Layer                       │           │
│  │  ┌─────────────┐ ┌─────────────┐ ┌────────────┐│           │
│  │  │ Crossroad   │ │  Session    │ │ Recording  ││           │
│  │  │  Manager    │ │  Manager    │ │  Manager   ││           │
│  │  └─────────────┘ └─────────────┘ └────────────┘│           │
│  └──────────────────────────────────────────────────┘           │
│         │                  │                  │                  │
│  ┌──────────────────────────────────────────────────┐           │
│  │              Data Access Layer (ORM)             │           │
│  │                   Sequelize                      │           │
│  └──────────────────────────────────────────────────┘           │
│                           │                                      │
│  ┌──────────────────────────────────────────────────┐           │
│  │              SQLite Database                     │           │
│  │     data/traffic_simulation.db                   │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **UI Library**: Material-UI (MUI) 5.14.18
- **Routing**: React Router DOM 6.18.0
- **Canvas Rendering**: HTML5 Canvas API
- **Map Integration**: Leaflet.js (OpenStreetMap), Google Maps API
- **HTTP Client**: Axios 1.6.0
- **WebSocket Client**: Native WebSocket API
- **Build Tool**: Create React App (react-scripts 5.0.1)

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Express.js 4.18.2
- **WebSocket**: ws library 8.14.2
- **ORM**: Sequelize 6.33.0
- **Database**: SQLite3 5.1.6
- **Middleware**: 
  - CORS 2.8.5
  - body-parser 1.20.2
  - morgan (logging)
- **Development**: nodemon 3.1.11

### DevOps
- **Containerization**: Docker
- **CI/CD**: GitLab CI/CD
- **Container Registry**: GitLab Container Registry
- **Deployment**: Heroku, Docker Compose
- **Version Control**: Git

## System Components

### 1. Client Application

#### Pages
- **Dashboard** (`client/src/pages/Dashboard.js`)
  - Landing page with navigation
  - Quick access to all features
  - Session and recording lists

- **Crossroad Designer** (`client/src/pages/CrossroadDesigner.js`)
  - Visual crossroad layout editor
  - Lane configuration interface
  - Map integration controls
  - Save/load crossroad designs

- **Session Manager** (`client/src/pages/SessionManager.js`)
  - Session creation and configuration
  - Algorithm selection
  - Parameter tuning
  - Session list and management

- **Session Page** (`client/src/pages/SessionPage.js`)
  - Real-time simulation view
  - Traffic statistics
  - Signal state visualization
  - Simulation controls (start/pause/stop)

- **Recording Manager** (`client/src/pages/RecordingManager.js`)
  - Recording list
  - Playback controls
  - Export functionality

#### Components

**Designer Components**
- `CrossroadCanvas.js` - Canvas-based crossroad editor
- `VisualDesignerCanvas.js` - Enhanced visual design interface

**Simulation Components**
- `SimulationCanvas.js` - Real-time traffic visualization
- `TrafficSignals.js` - Signal state display
- `Statistics.js` - Traffic metrics dashboard

**Map Components**
- `MapView.js` - Map integration wrapper

**Layout Components**
- `Layout.js` - Application shell with navigation

### 2. Server Application

#### API Layer (`server/routes/`)

**Crossroad Routes** (`crossroadRoutes.js`)
- `GET /api/crossroads` - List all crossroads
- `GET /api/crossroads/:id` - Get crossroad details
- `POST /api/crossroads` - Create new crossroad
- `PUT /api/crossroads/:id` - Update crossroad
- `DELETE /api/crossroads/:id` - Delete crossroad

**Session Routes** (`sessionRoutes.js`)
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/sessions/:id/duplicate` - Duplicate session
- `POST /api/sessions/:id/start` - Start simulation
- `POST /api/sessions/:id/pause` - Pause simulation
- `POST /api/sessions/:id/stop` - Stop simulation

**Recording Routes** (`recordingRoutes.js`)
- `GET /api/recordings` - List all recordings
- `GET /api/recordings/:id` - Get recording details
- `POST /api/recordings` - Create new recording
- `DELETE /api/recordings/:id` - Delete recording

#### Service Layer (`server/services/`)

**CrossroadManager** (`CrossroadManager.js`)
- Manages crossroad lifecycle
- Validates crossroad data
- Enriches crossroad with coordinates

**SessionManager** (`SessionManager.js`)
- Manages simulation sessions
- Orchestrates simulation engine
- Tracks session state and statistics

**RecordingManager** (`RecordingManager.js`)
- Manages simulation recordings
- Stores and retrieves recording data
- Calculates recording statistics

#### Simulation Layer (`server/simulation/`)

**SimulationEngine** (`SimulationEngine.js`)
- Core simulation loop
- Vehicle lifecycle management
- Collision detection
- Traffic signal integration
- State broadcasting via WebSocket

**VehicleGenerator** (`VehicleGenerator.js`)
- Vehicle spawning logic
- Traffic pattern implementation
- Vehicle routing and movement

**TrafficSignalAlgorithms** (`algorithms/TrafficSignalAlgorithms.js`)
- Fixed-time signal control
- Algorithm factory pattern
- Extensible for future algorithms

#### WebSocket Layer (`server/websocket/`)

**WebSocketServer** (`WebSocketServer.js`)
- Real-time bidirectional communication
- Event broadcasting
- Client connection management
- Message routing

#### Data Layer (`server/models/`)

**Crossroad Model** (`Crossroad.js`)
- Crossroad schema definition
- Geographic location data
- Lane and signal configuration

**Session Model** (`Session.js`)
- Session metadata
- Algorithm configuration
- State tracking
- Statistics storage

**Recording Model** (`Recording.js`)
- Recording metadata
- Frame data storage
- Duration tracking

## Data Flow

### 1. Crossroad Design Flow
```
User Input → React Component → HTTP POST → Express Route → 
CrossroadManager → Sequelize → SQLite → Response → 
State Update → UI Refresh
```

### 2. Simulation Start Flow
```
User Click → HTTP POST /sessions/:id/start → SessionManager → 
SimulationEngine.start() → WebSocket Server → 
Client WebSocket → React State → Canvas Render
```

### 3. Real-time Simulation Flow
```
Simulation Tick (60 FPS) → VehicleGenerator → Vehicle Movement → 
Signal Algorithm → State Update → WebSocket Broadcast → 
All Connected Clients → Canvas Update
```

### 4. Recording Playback Flow
```
User Select Recording → HTTP GET /recordings/:id → RecordingManager → 
Retrieve Frames → Client Playback Engine → Canvas Render
```

## Communication Protocols

### REST API
- **Protocol**: HTTP/1.1
- **Format**: JSON
- **Authentication**: None (can be added)
- **CORS**: Enabled for all origins

### WebSocket
- **Protocol**: WebSocket (RFC 6455)
- **Port**: 8080 (configurable)
- **Message Format**: JSON
- **Events**:
  - `simulation:update` - Simulation state update
  - `simulation:start` - Simulation started
  - `simulation:pause` - Simulation paused
  - `simulation:stop` - Simulation stopped
  - `vehicle:spawn` - Vehicle created
  - `vehicle:move` - Vehicle position update
  - `vehicle:remove` - Vehicle removed
  - `signal:change` - Signal state changed

## Database Schema

### Crossroads Table
```sql
CREATE TABLE crossroads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,  -- JSON: {lat, lng, address}
  mapProvider TEXT DEFAULT 'osm',
  lanes TEXT NOT NULL,  -- JSON: lane configuration
  signals TEXT NOT NULL,  -- JSON: signal configuration
  createdAt DATETIME,
  updatedAt DATETIME
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  crossroadId TEXT,
  algorithm TEXT DEFAULT 'fixed-time',
  configuration TEXT,  -- JSON: algorithm parameters
  status TEXT DEFAULT 'created',
  startTime DATETIME,
  endTime DATETIME,
  statistics TEXT,  -- JSON: performance metrics
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (crossroadId) REFERENCES crossroads(id)
);
```

### Recordings Table
```sql
CREATE TABLE recordings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sessionId TEXT,
  duration INTEGER,
  frames TEXT,  -- JSON: simulation frames
  statistics TEXT,  -- JSON: recording statistics
  metadata TEXT,  -- JSON: additional data
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (sessionId) REFERENCES sessions(id)
);
```

## Security Considerations

### Current Implementation
- No authentication/authorization
- CORS enabled for all origins
- No rate limiting
- No input sanitization beyond basic validation

### Recommended Improvements
1. Add JWT-based authentication
2. Implement role-based access control (RBAC)
3. Add rate limiting middleware
4. Implement input validation and sanitization
5. Add HTTPS/WSS in production
6. Implement API key management
7. Add audit logging
8. Implement data encryption at rest

## Scalability Considerations

### Current Limitations
- Single server instance
- In-memory simulation state
- SQLite single-writer limitation
- No horizontal scaling support

### Scalability Improvements
1. **Multi-instance Support**
   - Redis for shared session state
   - Message queue (RabbitMQ/Kafka) for event distribution
   - Load balancer (nginx/HAProxy)

2. **Database Scaling**
   - Migrate to PostgreSQL/MySQL for multi-writer support
   - Implement read replicas
   - Connection pooling

3. **Simulation Scaling**
   - Distribute simulations across worker processes
   - Implement simulation clustering
   - Use WebWorkers for client-side computation offloading

4. **Caching**
   - Redis for API response caching
   - CDN for static assets
   - Browser caching headers

## Performance Optimization

### Current Performance
- Simulation: 60 FPS target
- API Response: < 100ms average
- WebSocket Latency: < 50ms
- Database Queries: < 20ms

### Optimization Strategies
1. **Frontend**
   - Lazy loading of routes
   - Code splitting
   - Canvas rendering optimization
   - Virtual scrolling for lists
   - Memoization of expensive computations

2. **Backend**
   - Connection pooling
   - Query optimization and indexing
   - Async/await proper usage
   - Memory leak prevention
   - Response compression

3. **Network**
   - HTTP/2 support
   - WebSocket message batching
   - Asset minification and compression
   - CDN integration

## Monitoring & Observability

### Recommended Tools
- **Application Monitoring**: New Relic, Datadog
- **Logging**: Winston, ELK Stack
- **Error Tracking**: Sentry
- **Performance**: Lighthouse, WebPageTest
- **Uptime**: UptimeRobot, Pingdom

### Key Metrics
- API response times
- WebSocket message latency
- Simulation FPS
- Database query performance
- Memory usage
- CPU utilization
- Active connections
- Error rates

## Deployment Architecture

### Development
```
localhost:3000 (React Dev Server)
localhost:3001 (Express API)
localhost:8080 (WebSocket)
```

### Production (Docker Compose)
```
nginx:80 → Express:3001 (Reverse Proxy)
Express:3001 (API + Static Files)
WebSocket:8080
SQLite:data/traffic_simulation.db
```

### Production (Heroku)
```
Heroku Router → Web Dyno (Express)
Express serves React build
WebSocket on same process
Heroku Postgres (if migrated from SQLite)
```

## Future Architecture Enhancements

1. **Microservices**
   - Separate simulation service
   - Separate recording service
   - API Gateway

2. **Event Sourcing**
   - Event store for simulation events
   - Replay capability
   - Audit trail

3. **Real-time Analytics**
   - Stream processing (Apache Flink/Kafka Streams)
   - Time-series database (InfluxDB)
   - Real-time dashboards

4. **Machine Learning Integration**
   - ML model serving (TensorFlow Serving)
   - Training pipeline
   - A/B testing framework

## References

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Sequelize ORM](https://sequelize.org/)
- [WebSocket Protocol RFC 6455](https://tools.ietf.org/html/rfc6455)
- [Material-UI](https://mui.com/)
