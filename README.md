# Traffic Light Simulation

A comprehensive web application for designing, simulating, and optimizing traffic signal algorithms with real-time visualization and map integration.

## � Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in 5 minutes
- **[Architecture](docs/ARCHITECTURE.md)** - System design, tech stack, and data flow
- **[API Reference](API.md)** - Complete REST API documentation
- **[Components](docs/COMPONENTS.md)** - Detailed component API and usage
- **[Deployment](docs/DEPLOYMENT.md)** - Docker, Heroku, and production deployment
- **[Contributing](docs/CONTRIBUTING.md)** - Development guidelines and coding standards
- **[Database](DATABASE.md)** - Database schema and migration guide
- **[Crossroad Designer](CROSSROAD_DESIGNER_FEATURES.md)** - Designer feature documentation
## 📊 Architecture Diagrams

Visual representations of the system architecture are available in [docs/diagrams/](docs/diagrams/):

- **architecture.puml** → System architecture (Client, Server, Simulation, Data layers)
- **dataflow.puml** → Data flow scenarios (Design, Simulation, Recording)
- **components.puml** → Component relationships and dependencies
- **database.puml** → Database schema and relationships
- **deployment.puml** → Deployment architecture (Dev, Docker, Heroku, Production)
- **sequence.puml** → Simulation lifecycle sequence diagram

All diagrams are available in PNG and SVG formats. To generate diagrams from PlantUML source files:

```bash
cd docs/diagrams
./generate-diagrams.sh      # Generate PNG (default)
./generate-diagrams.sh svg  # Generate SVG
```

**Prerequisites**: Install PlantUML (`brew install plantuml` on macOS, `apt install plantuml` on Ubuntu) or use Docker:
```bash
docker run --rm -v $(pwd):/diagrams plantuml/plantuml:latest -tpng /diagrams/*.puml -o /diagrams
```

You can also use the [PlantUML Online Editor](http://www.plantuml.com/plantuml/uml/) without installing anything.
## �🚦 Features

### 1. **Crossroad Designer**
- Create custom crossroad layouts with multiple lanes
- Configure incoming and outgoing traffic lanes for each direction (North, South, East, West)
- Integrate with real-time maps (OpenStreetMap or Google Maps)
- Set geographic coordinates for realistic location-based simulations

### 2. **Traffic Simulation**
- Real-time visualization of traffic flow and vehicle movement
- Support for multiple vehicle types (cars, trucks, buses, motorcycles)
- Configurable traffic patterns (uniform, rush-hour, custom)
- Live traffic signal state display
- Vehicle spawn rate and speed configuration

### 3. **Traffic Signal Algorithms**
Multiple intelligent traffic control algorithms:
- **Fixed-Time**: Classic predetermined cycle timing
- **Adaptive**: Dynamic adjustment based on traffic density
- **Actuated**: Vehicle-presence detection based control
- **Coordinated**: Green wave coordination for arterial roads
- **ML-Based**: Machine learning optimization (framework ready)

Each algorithm has configurable parameters for fine-tuning performance.

### 4. **Session Management**
- Create, save, load, and modify simulation sessions
- Preserve crossroad designs with algorithm configurations
- Duplicate sessions for A/B testing
- Session history and metadata tracking

### 5. **Recording & Playback**
- Record complete simulation sessions with all events
- Save recordings with metadata
- Playback recordings for analysis
- Export recording data for external analysis

### 6. **Decoupled Architecture**
- WebSocket-based real-time communication
- Multiple UI clients can connect to a single simulation
- Server-side simulation engine for consistent state
- Responsive and scalable architecture

### 7. **Real-Time Maps**
- OpenStreetMap integration (default)
- Google Maps support
- Place crossroads on actual geographic locations
- Visual correlation between simulation and real-world locations

### 8. **Database Persistence**
- SQLite database for reliable data storage
- Automatic schema synchronization
- Data migration from JSON files
- Easily switchable to PostgreSQL/MySQL for production
- See [DATABASE.md](DATABASE.md) for detailed information

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  React Frontend │◄────────┤  Express Server │
│                 │         │                 │
│  - UI Components│  HTTP   │  - REST API     │
│  - Map View     │◄────────┤  - Session Mgmt │
│  - Visualization│         │  - Crossroad DB │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ WebSocket                 │
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ WebSocket Client│◄────────┤  WebSocket Srv  │
│                 │         │                 │
│  - Real-time    │         │  - Simulation   │
│    Updates      │         │    Engine       │
└─────────────────┘         │  - Algorithms   │
                            │  - Recording    │
                            └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- (Optional) Docker and Docker Compose

### Installation

1. **Clone the repository**
```bash
git clone https://assets.engine.capgemini.com/KISSELVA/trafficlightsimulation.git
cd trafficlightsimulation
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Initialize database**
```bash
# Migrate existing data to database (if you have JSON files)
npm run migrate
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configurations
```

5. **Start the application**

Development mode (with hot reload):
```bash
npm run dev:full
```

Production mode:
```bash
npm run build
npm start
```

### Using Docker

```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:8080

## 📁 Project Structure

```
trafficlightsimulation/
├── server/                    # Backend Node.js/Express server
│   ├── index.js              # Main server entry point
│   ├── routes/               # REST API routes
│   │   ├── sessionRoutes.js
│   │   ├── recordingRoutes.js
│   │   └── crossroadRoutes.js
│   ├── services/             # Business logic
│   │   ├── SessionManager.js
│   │   ├── RecordingManager.js
│   │   └── CrossroadManager.js
│   ├── simulation/           # Simulation engine
│   │   ├── SimulationEngine.js
│   │   ├── VehicleGenerator.js
│   │   └── algorithms/
│   │       └── TrafficSignalAlgorithms.js
│   └── websocket/            # WebSocket server
│       └── WebSocketServer.js
├── client/                   # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── Layout/
│   │   │   ├── Simulation/
│   │   │   └── Map/
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── SessionPage.js
│   │   │   ├── SessionManager.js
│   │   │   ├── RecordingManager.js
│   │   │   └── CrossroadDesigner.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── data/                     # Data storage
│   ├── traffic_simulation.db # SQLite database
│   ├── sessions/             # Legacy session files
│   ├── recordings/           # Legacy recording files
│   └── crossroads/           # Legacy crossroad files
├── package.json
├── docker-compose.yml
├── Dockerfile
├── DATABASE.md               # Database integration guide
└── README.md
```

## 🎮 Usage Guide

### Creating a Session

1. Navigate to Dashboard
2. Click "New Session" button
3. Enter session name and description
4. Configure crossroad design or use default
5. Select traffic signal algorithm
6. Start simulation

### Designing a Crossroad

1. Go to "Crossroad Designer"
2. Set basic information (name, description)
3. Set geographic location (latitude, longitude)
4. Choose map provider
5. Configure lanes for each direction
6. Save design

### Running a Simulation

1. Open a session
2. Configure algorithm parameters
3. Click "Start" to begin simulation
4. Monitor traffic signals and vehicle flow
5. Adjust parameters in real-time
6. Use "Record" to save the session

### Playing Back a Recording

1. Go to "Recordings"
2. Select a recording
3. Click "Play"
4. Watch the simulation replay

## 🔧 API Documentation

### REST API Endpoints

#### Sessions
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/sessions/:id/duplicate` - Duplicate session

#### Recordings
- `GET /api/recordings` - List all recordings
- `GET /api/recordings/:id` - Get recording by ID
- `POST /api/recordings` - Save recording
- `DELETE /api/recordings/:id` - Delete recording
- `POST /api/recordings/:id/replay` - Create playback session

#### Crossroads
- `GET /api/crossroads` - List all crossroads
- `GET /api/crossroads/:id` - Get crossroad by ID
- `POST /api/crossroads` - Create crossroad
- `PUT /api/crossroads/:id` - Update crossroad
- `DELETE /api/crossroads/:id` - Delete crossroad

### WebSocket Messages

#### Client → Server
```javascript
// Join simulation session
{ type: 'join_session', sessionId: 'xxx' }

// Control simulation
{ type: 'start_simulation', sessionId: 'xxx' }
{ type: 'pause_simulation', sessionId: 'xxx' }
{ type: 'stop_simulation', sessionId: 'xxx' }

// Change algorithm
{
  type: 'change_algorithm',
  sessionId: 'xxx',
  algorithm: 'adaptive',
  params: { minGreenTime: 15, maxGreenTime: 60 }
}

// Update configuration
{
  type: 'update_config',
  sessionId: 'xxx',
  config: { vehicleSpawnRate: 0.5 }
}
```

#### Server → Client
```javascript
// Connection established
{ type: 'connected', clientId: 'xxx', timestamp: 123 }

// Session joined
{
  type: 'session_joined',
  sessionId: 'xxx',
  state: { /* current state */ }
}

// Simulation updates
{ type: 'simulation_state', state: { /* state */ } }
{ type: 'vehicle_update', vehicles: [ /* vehicles */ ] }
{ type: 'signal_update', signals: { /* signals */ } }
```

## 🧪 Traffic Signal Algorithms

### Fixed-Time Algorithm
```javascript
{
  type: 'fixed-time',
  params: {
    cycleTime: 60,      // Total cycle duration (seconds)
    greenTime: 25,      // Green light duration (seconds)
    yellowTime: 3,      // Yellow light duration (seconds)
    allRedTime: 2       // All-red clearance time (seconds)
  }
}
```

### Adaptive Algorithm
```javascript
{
  type: 'adaptive',
  params: {
    minGreenTime: 15,   // Minimum green duration
    maxGreenTime: 60,   // Maximum green duration
    adaptationRate: 0.5 // Adaptation sensitivity
  }
}
```

### Actuated Algorithm
```javascript
{
  type: 'actuated',
  params: {
    minGreenTime: 10,   // Minimum green duration
    maxGreenTime: 45,   // Maximum green duration
    extensionTime: 3,   // Extension per vehicle detection
    maxExtensions: 10   // Maximum extensions allowed
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙋 Support

For issues, questions, or suggestions, please create an issue in the GitLab repository.

## 🗺️ Roadmap

- [ ] Enhanced ML-based algorithm implementation
- [ ] Multi-intersection coordination
- [ ] Traffic flow analytics and reports
- [ ] Import real traffic data
- [ ] 3D visualization
- [ ] Mobile application
- [ ] Cloud deployment configuration
- [ ] Performance optimization for large-scale simulations

---

**Made with ❤️ for traffic engineers, urban planners, and simulation enthusiasts.**
