# Component Documentation

## Overview

This document provides detailed documentation for all major components in the Traffic Light Simulation application.

---

## Frontend Components

### Pages

#### Dashboard (`client/src/pages/Dashboard.js`)

**Purpose**: Main landing page and navigation hub

**Features**:
- Quick access to all application features
- Session list with status indicators
- Recording list
- Navigation to designer and managers

**Props**: None (route component)

**State**:
- `sessions`: Array of recent sessions
- `recordings`: Array of recent recordings
- `loading`: Boolean for data loading state

**Key Functions**:
- `loadData()`: Fetches sessions and recordings
- `navigateTo(path)`: Programmatic navigation

---

#### CrossroadDesigner (`client/src/pages/CrossroadDesigner.js`)

**Purpose**: Visual editor for creating and modifying crossroad layouts

**Features**:
- Canvas-based crossroad editor
- Lane addition/removal/configuration
- Signal placement and configuration
- Map integration (OSM/Google Maps)
- Save/load crossroad designs

**Props**: None (route component)

**State**:
- `crossroad`: Current crossroad being edited
- `selectedDirection`: Currently selected direction (N/S/E/W)
- `lanes`: Lane configuration for all directions
- `signals`: Signal configuration
- `mapProvider`: Selected map provider
- `location`: Geographic coordinates

**Key Functions**:
- `addLane(direction, type)`: Adds lane to direction
- `removeLane(laneId)`: Removes specified lane
- `updateLane(laneId, updates)`: Updates lane properties
- `saveCrossroad()`: Saves crossroad to database
- `loadCrossroad(id)`: Loads existing crossroad

**Usage**:
```javascript
// Navigate to designer
<Link to="/designer" />

// With existing crossroad
<Link to="/designer?id=abc-123" />
```

---

#### SessionManager (`client/src/pages/SessionManager.js`)

**Purpose**: Manage simulation sessions and configurations

**Features**:
- Create new sessions
- Select crossroad
- Choose traffic signal algorithm
- Configure algorithm parameters
- Duplicate existing sessions
- Delete sessions

**Props**: None (route component)

**State**:
- `sessions`: Array of all sessions
- `crossroads`: Available crossroads
- `selectedSession`: Currently selected session
- `algorithmConfig`: Algorithm parameters

**Key Functions**:
- `createSession(data)`: Creates new session
- `duplicateSession(id)`: Clones existing session
- `deleteSession(id)`: Removes session
- `startSession(id)`: Initiates simulation

---

#### SessionPage (`client/src/pages/SessionPage.js`)

**Purpose**: Real-time simulation view and control

**Features**:
- Live traffic simulation visualization
- Real-time statistics
- Traffic signal state display
- Simulation controls (start/pause/stop/reset)
- Recording controls
- Speed control

**Props**: None (uses URL params)

**State**:
- `session`: Current session data
- `crossroad`: Associated crossroad
- `simulationState`: Current simulation state
- `vehicles`: Active vehicles
- `signals`: Signal states
- `statistics`: Traffic metrics
- `isRecording`: Recording state

**WebSocket Events**:
- Listens: `simulation:update`, `vehicle:spawn`, `vehicle:move`, `signal:change`
- Emits: `start`, `pause`, `stop`, `reset`

**Key Functions**:
- `startSimulation()`: Starts simulation
- `pauseSimulation()`: Pauses simulation
- `stopSimulation()`: Stops and resets
- `startRecording()`: Begins recording
- `stopRecording()`: Saves recording
- `drawVehicles()`: Renders vehicles on canvas
- `updateStatistics()`: Updates traffic metrics

**Canvas Rendering**:
```javascript
// 60 FPS rendering loop
useEffect(() => {
  const animate = () => {
    drawCrossroad();
    drawVehicles();
    drawSignals();
    requestAnimationFrame(animate);
  };
  animate();
}, []);
```

---

#### RecordingManager (`client/src/pages/RecordingManager.js`)

**Purpose**: Manage and playback simulation recordings

**Features**:
- List all recordings
- Playback controls
- Recording metadata display
- Delete recordings
- Export functionality

**Props**: None (route component)

**State**:
- `recordings`: Array of recordings
- `selectedRecording`: Currently selected recording
- `playbackState`: Playback position and status

**Key Functions**:
- `loadRecording(id)`: Loads recording data
- `playRecording()`: Starts playback
- `pausePlayback()`: Pauses playback
- `deleteRecording(id)`: Removes recording

---

### Layout Components

#### Layout (`client/src/components/Layout/Layout.js`)

**Purpose**: Application shell with navigation and common UI elements

**Features**:
- Top navigation bar
- Sidebar menu
- Content area
- Responsive design

**Props**:
- `children`: ReactNode - Page content

**Usage**:
```javascript
<Layout>
  <Dashboard />
</Layout>
```

---

### Designer Components

#### CrossroadCanvas (`client/src/components/Designer/CrossroadCanvas.js`)

**Purpose**: Canvas-based crossroad drawing and interaction

**Features**:
- Renders crossroad layout
- Lane visualization
- Signal placement
- Mouse interaction (click, drag)
- Zoom and pan

**Props**:
- `crossroad`: Object - Crossroad data
- `onLaneClick`: Function - Lane click handler
- `onSignalClick`: Function - Signal click handler
- `readOnly`: Boolean - Disable editing

**Canvas Layers**:
1. Background (grid)
2. Intersection
3. Lanes
4. Signals
5. Labels

**Key Functions**:
- `drawIntersection()`: Draws central intersection
- `drawLane(lane)`: Renders individual lane
- `drawSignal(signal)`: Renders traffic signal
- `getMousePosition(event)`: Converts mouse coords to canvas coords

---

#### VisualDesignerCanvas (`client/src/components/Designer/VisualDesignerCanvas.js`)

**Purpose**: Enhanced visual interface for crossroad design

**Features**:
- Drag-and-drop lane creation
- Visual lane type indicators
- Interactive signal positioning
- Real-time preview

**Props**:
- `lanes`: Object - Lane configuration by direction
- `signals`: Array - Signal positions
- `onUpdate`: Function - Update callback
- `mapProvider`: String - Map provider for background

---

### Simulation Components

#### SimulationCanvas (`client/src/components/Simulation/SimulationCanvas.js`)

**Purpose**: Real-time traffic simulation visualization

**Features**:
- Vehicle rendering with types
- Smooth animation (60 FPS)
- Collision visualization
- Lane marking
- Signal state indicators

**Props**:
- `vehicles`: Array - Active vehicles
- `crossroad`: Object - Crossroad layout
- `signals`: Array - Current signal states
- `width`: Number - Canvas width
- `height`: Number - Canvas height

**Vehicle Rendering**:
```javascript
drawVehicle(vehicle) {
  const { x, y, type, speed, angle } = vehicle;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  // Different colors by type
  const colors = {
    car: '#3498db',
    truck: '#e74c3c',
    bus: '#f39c12',
    motorcycle: '#9b59b6'
  };
  
  ctx.fillStyle = colors[type];
  ctx.fillRect(-width/2, -height/2, width, height);
  ctx.restore();
}
```

---

#### TrafficSignals (`client/src/components/Simulation/TrafficSignals.js`)

**Purpose**: Display current state of all traffic signals

**Features**:
- Real-time signal state display
- Color-coded indicators (red/yellow/green)
- Direction labels
- Countdown timers

**Props**:
- `signals`: Array - Signal objects with states
- `compact`: Boolean - Compact display mode

**Signal States**:
- `red`: Stop
- `yellow`: Caution
- `green`: Go
- `flashing-red`: Stop and proceed when safe
- `flashing-yellow`: Proceed with caution

---

#### Statistics (`client/src/components/Simulation/Statistics.js`)

**Purpose**: Real-time traffic statistics dashboard

**Features**:
- Vehicle counts
- Average speeds
- Wait times
- Throughput metrics
- Queue lengths
- Collision count

**Props**:
- `statistics`: Object - Current simulation statistics
- `updateInterval`: Number - Refresh rate (ms)

**Metrics Displayed**:
```javascript
{
  totalVehicles: 0,
  activeVehicles: 0,
  completedVehicles: 0,
  averageSpeed: 0,
  averageWaitTime: 0,
  throughput: 0,  // vehicles per minute
  queues: {
    north: 0,
    south: 0,
    east: 0,
    west: 0
  },
  collisions: 0
}
```

---

### Map Components

#### MapView (`client/src/components/Map/MapView.js`)

**Purpose**: Map integration for geographic context

**Features**:
- OpenStreetMap integration (default)
- Google Maps support
- Marker placement
- Location selection
- Zoom controls

**Props**:
- `location`: Object - {lat, lng}
- `provider`: String - 'osm' or 'google'
- `onLocationChange`: Function - Location update callback
- `zoom`: Number - Initial zoom level
- `markers`: Array - Map markers

**Usage**:
```javascript
<MapView
  location={{lat: 40.7128, lng: -74.0060}}
  provider="osm"
  onLocationChange={(newLocation) => {
    setCrossroadLocation(newLocation);
  }}
  zoom={15}
/>
```

---

## Backend Components

### Services

#### CrossroadManager (`server/services/CrossroadManager.js`)

**Purpose**: Business logic for crossroad operations

**Methods**:

**`listCrossroads()`**
- Returns all crossroads ordered by creation date
- Returns: Promise<Array<Crossroad>>

**`getCrossroad(id)`**
- Retrieves single crossroad by ID
- Params: id (String) - Crossroad UUID
- Returns: Promise<Crossroad|null>

**`createCrossroad(data)`**
- Creates new crossroad
- Params: data (Object) - Crossroad properties
- Validates: name, lanes, signals
- Returns: Promise<Crossroad>

**`updateCrossroad(id, updates)`**
- Updates existing crossroad
- Params: 
  - id (String) - Crossroad UUID
  - updates (Object) - Properties to update
- Returns: Promise<Crossroad>

**`deleteCrossroad(id)`**
- Deletes crossroad and associated sessions
- Params: id (String) - Crossroad UUID
- Returns: Promise<Boolean>

**`enrichCrossroadWithCoordinates(crossroad)`**
- Adds coordinate data to lanes for rendering
- Params: crossroad (Object)
- Returns: Object - Enriched crossroad

---

#### SessionManager (`server/services/SessionManager.js`)

**Purpose**: Manage simulation sessions and orchestrate simulation engine

**Methods**:

**`listSessions()`**
- Returns all sessions with crossroad data
- Returns: Promise<Array<Session>>

**`getSession(id)`**
- Retrieves single session with related crossroad
- Params: id (String) - Session UUID
- Returns: Promise<Session|null>

**`createSession(data)`**
- Creates new session
- Params: data (Object) - Session properties
- Validates: name, crossroadId, algorithm
- Returns: Promise<Session>

**`updateSession(id, updates)`**
- Updates session properties
- Params:
  - id (String) - Session UUID
  - updates (Object) - Properties to update
- Returns: Promise<Session>

**`deleteSession(id)`**
- Deletes session and associated recordings
- Params: id (String) - Session UUID
- Returns: Promise<Boolean>

**`duplicateSession(id)`**
- Creates copy of existing session
- Params: id (String) - Session UUID to duplicate
- Returns: Promise<Session>

**`startSimulation(sessionId, wsServer)`**
- Initializes and starts simulation
- Params:
  - sessionId (String) - Session UUID
  - wsServer (WebSocketServer) - WS server instance
- Returns: Promise<SimulationEngine>

**`stopSimulation(sessionId)`**
- Stops and cleans up simulation
- Params: sessionId (String) - Session UUID
- Returns: Promise<void>

---

#### RecordingManager (`server/services/RecordingManager.js`)

**Purpose**: Manage simulation recordings

**Methods**:

**`listRecordings()`**
- Returns all recordings
- Returns: Promise<Array<Recording>>

**`getRecording(id)`**
- Retrieves single recording
- Params: id (String) - Recording UUID
- Returns: Promise<Recording|null>

**`createRecording(data)`**
- Creates new recording
- Params: data (Object) - Recording properties
- Returns: Promise<Recording>

**`deleteRecording(id)`**
- Deletes recording
- Params: id (String) - Recording UUID
- Returns: Promise<Boolean>

**`addFrame(recordingId, frame)`**
- Appends frame to recording
- Params:
  - recordingId (String) - Recording UUID
  - frame (Object) - Simulation frame data
- Returns: Promise<void>

---

### Simulation

#### SimulationEngine (`server/simulation/SimulationEngine.js`)

**Purpose**: Core simulation logic and state management

**Constructor**:
```javascript
new SimulationEngine(session, crossroad, wsServer)
```
- session: Session object
- crossroad: Crossroad object
- wsServer: WebSocketServer instance

**Properties**:
- `vehicles`: Map<id, Vehicle> - Active vehicles
- `signals`: Array<Signal> - Traffic signals
- `statistics`: Object - Current metrics
- `isRunning`: Boolean - Simulation state
- `tickRate`: Number - FPS (default: 60)

**Methods**:

**`start()`**
- Starts simulation loop
- Initializes traffic signals
- Begins vehicle generation

**`pause()`**
- Pauses simulation (preserves state)

**`stop()`**
- Stops simulation and resets state

**`tick()`**
- Single simulation step
- Updates vehicles
- Updates signals
- Checks collisions
- Broadcasts state

**`addVehicle(vehicle)`**
- Adds vehicle to simulation
- Params: vehicle (Object)
- Broadcasts: `vehicle:spawn`

**`removeVehicle(id)`**
- Removes vehicle from simulation
- Params: id (String) - Vehicle ID
- Broadcasts: `vehicle:remove`

**`updateSignals()`**
- Updates signal states based on algorithm
- Broadcasts: `signal:change`

**`calculateStatistics()`**
- Computes current metrics
- Returns: Object - Statistics

---

#### VehicleGenerator (`server/simulation/VehicleGenerator.js`)

**Purpose**: Generate vehicles based on traffic patterns

**Constructor**:
```javascript
new VehicleGenerator(crossroad, pattern, spawnRate)
```
- crossroad: Crossroad object
- pattern: String - 'uniform', 'rush-hour', 'random'
- spawnRate: Number - Vehicles per minute

**Methods**:

**`start()`**
- Begins vehicle generation

**`stop()`**
- Stops generation

**`generateVehicle()`**
- Creates random vehicle
- Returns: Object - Vehicle data

**`selectSpawnLane()`**
- Chooses lane for new vehicle
- Based on pattern and current traffic
- Returns: Lane object

**`calculateVehicleRoute(vehicle)`**
- Determines vehicle path through crossroad
- Params: vehicle (Object)
- Returns: Array<Point> - Route waypoints

---

#### TrafficSignalAlgorithms (`server/simulation/algorithms/TrafficSignalAlgorithms.js`)

**Purpose**: Traffic signal control algorithms

**Available Algorithms**:

**FixedTimeAlgorithm**
- Classic predetermined cycle timing
- Configurable phase durations
- Green/yellow/red timing

**Configuration**:
```javascript
{
  cycleDuration: 120,  // seconds
  phases: [
    { direction: 'north-south', green: 45, yellow: 3 },
    { direction: 'east-west', green: 45, yellow: 3 }
  ]
}
```

**Methods**:
- `update(signals, traffic)`: Updates signal states
- `getNextPhase()`: Determines next phase
- `getRemainingTime(signal)`: Gets countdown

---

### WebSocket

#### WebSocketServer (`server/websocket/WebSocketServer.js`)

**Purpose**: Real-time bidirectional communication

**Constructor**:
```javascript
new WebSocketServer(port)
```

**Methods**:

**`start()`**
- Starts WebSocket server
- Sets up connection handlers

**`stop()`**
- Closes all connections
- Shuts down server

**`broadcast(event, data)`**
- Sends message to all connected clients
- Params:
  - event (String) - Event name
  - data (Object) - Event data

**`send(clientId, event, data)`**
- Sends message to specific client
- Params:
  - clientId (String) - Client ID
  - event (String) - Event name
  - data (Object) - Event data

**Events**:
- `connection`: New client connected
- `message`: Message received from client
- `close`: Client disconnected
- `error`: Error occurred

---

## Models

### Crossroad (`server/models/Crossroad.js`)

**Schema**:
```javascript
{
  id: UUID,
  name: STRING (required),
  description: TEXT,
  location: JSON,  // {lat, lng, address}
  mapProvider: STRING,  // 'osm' | 'google'
  lanes: JSON,  // Lane configuration
  signals: JSON,  // Signal configuration
  createdAt: DATE,
  updatedAt: DATE
}
```

**Associations**:
- Has many Sessions

---

### Session (`server/models/Session.js`)

**Schema**:
```javascript
{
  id: UUID,
  name: STRING (required),
  crossroadId: UUID (foreign key),
  algorithm: STRING,  // 'fixed-time'
  configuration: JSON,  // Algorithm parameters
  status: STRING,  // 'created' | 'running' | 'paused' | 'completed' | 'stopped'
  startTime: DATE,
  endTime: DATE,
  statistics: JSON,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Associations**:
- Belongs to Crossroad
- Has many Recordings

---

### Recording (`server/models/Recording.js`)

**Schema**:
```javascript
{
  id: UUID,
  name: STRING (required),
  sessionId: UUID (foreign key),
  duration: INTEGER,  // seconds
  frames: JSON,  // Array of simulation frames
  statistics: JSON,
  metadata: JSON,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Associations**:
- Belongs to Session

---

## Testing Components

### Unit Testing
Recommended framework: Jest + React Testing Library

**Example Test**:
```javascript
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

test('renders dashboard with navigation', () => {
  render(<Dashboard />);
  expect(screen.getByText(/Crossroad Designer/i)).toBeInTheDocument();
});
```

### Integration Testing
Recommended: Cypress

**Example Test**:
```javascript
describe('Session Management', () => {
  it('creates a new session', () => {
    cy.visit('/sessions');
    cy.get('[data-testid="create-session"]').click();
    cy.get('input[name="name"]').type('Test Session');
    cy.get('button[type="submit"]').click();
    cy.contains('Test Session').should('exist');
  });
});
```

---

## Performance Considerations

### Component Optimization

**Use React.memo for expensive components**:
```javascript
export default React.memo(SimulationCanvas, (prevProps, nextProps) => {
  return prevProps.vehicles.length === nextProps.vehicles.length;
});
```

**Use useMemo for expensive computations**:
```javascript
const sortedVehicles = useMemo(() => {
  return vehicles.sort((a, b) => a.speed - b.speed);
}, [vehicles]);
```

**Use useCallback for event handlers**:
```javascript
const handleClick = useCallback((id) => {
  selectVehicle(id);
}, [selectVehicle]);
```

---

## Common Patterns

### Error Handling
```javascript
try {
  const response = await api.get('/sessions');
  setSessions(response.data);
} catch (error) {
  console.error('Failed to load sessions:', error);
  setError(error.message);
}
```

### Loading States
```javascript
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().finally(() => setLoading(false));
}, []);

if (loading) return <Spinner />;
```

### WebSocket Connection
```javascript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080');
  
  ws.onmessage = (event) => {
    const { type, data } = JSON.parse(event.data);
    handleMessage(type, data);
  };
  
  return () => ws.close();
}, []);
```

---

## References

- [React Component Documentation](https://react.dev/reference/react/Component)
- [Express.js Routing](https://expressjs.com/en/guide/routing.html)
- [Sequelize Models](https://sequelize.org/docs/v6/core-concepts/model-basics/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
