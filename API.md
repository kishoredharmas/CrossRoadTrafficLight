# API Reference

## REST API Endpoints

### Base URL
```
http://localhost:3001/api
```

---

## Sessions

### List All Sessions
```http
GET /sessions
```

**Response**
```json
[
  {
    "id": "uuid",
    "name": "Session Name",
    "description": "Description",
    "crossroad": { ... },
    "algorithm": {
      "type": "fixed-time",
      "params": { ... }
    },
    "config": { ... },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Session
```http
GET /sessions/:id
```

### Create Session
```http
POST /sessions
Content-Type: application/json

{
  "name": "New Session",
  "description": "Optional description",
  "crossroad": { ... },
  "algorithm": {
    "type": "fixed-time",
    "params": { "cycleTime": 60, "greenTime": 25 }
  },
  "config": {
    "vehicleSpawnRate": 0.3,
    "vehicleSpeed": 50
  }
}
```

### Update Session
```http
PUT /sessions/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "algorithm": { ... }
}
```

### Delete Session
```http
DELETE /sessions/:id
```

### Duplicate Session
```http
POST /sessions/:id/duplicate
```

---

## Recordings

### List All Recordings
```http
GET /recordings
```

**Response**
```json
[
  {
    "id": "uuid",
    "name": "Recording Name",
    "sessionId": "uuid",
    "startTime": 1234567890,
    "endTime": 1234567900,
    "duration": 10000,
    "eventCount": 100,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Recording
```http
GET /recordings/:id
```

**Response**
```json
{
  "id": "uuid",
  "name": "Recording Name",
  "sessionId": "uuid",
  "startTime": 1234567890,
  "endTime": 1234567900,
  "duration": 10000,
  "events": [
    {
      "time": 0.1,
      "signals": { ... },
      "vehicleCount": 5,
      "vehicles": [ ... ]
    }
  ],
  "crossroad": { ... },
  "config": { ... },
  "algorithm": { ... }
}
```

### Save Recording
```http
POST /recordings
Content-Type: application/json

{
  "name": "My Recording",
  "sessionId": "uuid",
  "startTime": 1234567890,
  "endTime": 1234567900,
  "events": [ ... ],
  "crossroad": { ... },
  "config": { ... },
  "algorithm": { ... }
}
```

### Delete Recording
```http
DELETE /recordings/:id
```

### Create Playback Session
```http
POST /recordings/:id/replay
```

---

## Crossroads

### List All Crossroads
```http
GET /crossroads
```

### Get Crossroad
```http
GET /crossroads/:id
```

### Create Crossroad
```http
POST /crossroads
Content-Type: application/json

{
  "name": "Custom Crossroad",
  "description": "Description",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "mapProvider": "openstreetmap",
  "lanes": {
    "north": {
      "incoming": [
        {
          "id": "N1",
          "type": "straight",
          "direction": "north",
          "length": 200
        }
      ],
      "outgoing": [ ... ]
    },
    "south": { ... },
    "east": { ... },
    "west": { ... }
  },
  "signals": {
    "north": {
      "id": "SIG_N",
      "state": "red",
      "timeInState": 0,
      "direction": "north"
    },
    "south": { ... },
    "east": { ... },
    "west": { ... }
  }
}
```

### Update Crossroad
```http
PUT /crossroads/:id
```

### Delete Crossroad
```http
DELETE /crossroads/:id
```

---

## WebSocket API

### Connection
```
ws://localhost:8080
```

### Client Messages

#### Join Session
```json
{
  "type": "join_session",
  "sessionId": "uuid"
}
```

#### Leave Session
```json
{
  "type": "leave_session"
}
```

#### Start Simulation
```json
{
  "type": "start_simulation",
  "sessionId": "uuid"
}
```

#### Pause Simulation
```json
{
  "type": "pause_simulation",
  "sessionId": "uuid"
}
```

#### Stop Simulation
```json
{
  "type": "stop_simulation",
  "sessionId": "uuid"
}
```

#### Update Configuration
```json
{
  "type": "update_config",
  "sessionId": "uuid",
  "config": {
    "vehicleSpawnRate": 0.5,
    "vehicleSpeed": 60,
    "trafficPattern": "rush-hour"
  }
}
```

#### Change Algorithm
```json
{
  "type": "change_algorithm",
  "sessionId": "uuid",
  "algorithm": "adaptive",
  "params": {
    "minGreenTime": 15,
    "maxGreenTime": 60,
    "adaptationRate": 0.5
  }
}
```

### Server Messages

#### Connected
```json
{
  "type": "connected",
  "clientId": "uuid",
  "timestamp": 1234567890
}
```

#### Session Joined
```json
{
  "type": "session_joined",
  "sessionId": "uuid",
  "state": {
    "isRunning": false,
    "isPaused": false,
    "simulationTime": 0,
    "crossroad": { ... },
    "config": { ... },
    "algorithm": { ... },
    "vehicleCount": 0
  },
  "timestamp": 1234567890
}
```

#### Simulation State Update
```json
{
  "type": "simulation_state",
  "state": {
    "sessionId": "uuid",
    "isRunning": true,
    "isPaused": false,
    "simulationTime": 45.6,
    "vehicleCount": 12
  },
  "timestamp": 1234567890
}
```

#### Vehicle Update
```json
{
  "type": "vehicle_update",
  "vehicles": [
    {
      "id": "uuid",
      "type": "car",
      "lane": { ... },
      "direction": "north",
      "position": 150.5,
      "speed": 13.9,
      "createdAt": 1234567890
    }
  ],
  "timestamp": 1234567890
}
```

#### Signal Update
```json
{
  "type": "signal_update",
  "signals": {
    "north": {
      "id": "SIG_N",
      "state": "red",
      "timeInState": 15.3,
      "direction": "north"
    },
    "south": { ... },
    "east": { ... },
    "west": { ... }
  },
  "timestamp": 1234567890
}
```

#### Error
```json
{
  "type": "error",
  "message": "Error description"
}
```

---

## Data Models

### Session
```typescript
{
  id: string;
  name: string;
  description?: string;
  crossroad?: Crossroad;
  algorithm: {
    type: AlgorithmType;
    params: Record<string, any>;
  };
  config: {
    vehicleSpawnRate: number;
    vehicleSpeed: number;
    trafficPattern: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Recording
```typescript
{
  id: string;
  name: string;
  sessionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  events: RecordingEvent[];
  crossroad: Crossroad;
  config: Config;
  algorithm: Algorithm;
  createdAt: string;
}
```

### Crossroad
```typescript
{
  id: string;
  name: string;
  description?: string;
  location?: {
    lat: number;
    lng: number;
  };
  mapProvider: 'openstreetmap' | 'google';
  lanes: {
    [direction: string]: {
      incoming: Lane[];
      outgoing: Lane[];
    };
  };
  signals: {
    [direction: string]: Signal;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

### Vehicle
```typescript
{
  id: string;
  type: 'car' | 'truck' | 'bus' | 'motorcycle';
  lane: Lane;
  direction: 'north' | 'south' | 'east' | 'west';
  position: number;
  speed: number;
  desiredSpeed: number;
  acceleration: number;
  createdAt: number;
}
```

### Signal
```typescript
{
  id: string;
  state: 'red' | 'yellow' | 'green';
  timeInState: number;
  direction: 'north' | 'south' | 'east' | 'west';
}
```

---

## Algorithm Types

### fixed-time
Fixed cycle timing

**Parameters:**
- `cycleTime`: number (seconds) - Total cycle duration
- `greenTime`: number (seconds) - Green light duration
- `yellowTime`: number (seconds) - Yellow light duration
- `allRedTime`: number (seconds) - All-red clearance time

### adaptive
Adaptive timing based on traffic density

**Parameters:**
- `minGreenTime`: number (seconds) - Minimum green duration
- `maxGreenTime`: number (seconds) - Maximum green duration
- `yellowTime`: number (seconds) - Yellow light duration
- `allRedTime`: number (seconds) - All-red clearance time
- `adaptationRate`: number (0-1) - Adaptation sensitivity

### actuated
Vehicle-actuated control

**Parameters:**
- `minGreenTime`: number (seconds) - Minimum green duration
- `maxGreenTime`: number (seconds) - Maximum green duration
- `extensionTime`: number (seconds) - Extension per vehicle
- `maxExtensions`: number - Maximum extensions allowed
- `yellowTime`: number (seconds) - Yellow light duration
- `allRedTime`: number (seconds) - All-red clearance time

### coordinated
Green wave coordination

**Parameters:**
- `cycleTime`: number (seconds) - Coordinated cycle time
- `offset`: number (seconds) - Offset from master controller
- `bandwidth`: number (0-1) - Progression bandwidth
- `greenTime`: number (seconds) - Green light duration
- `yellowTime`: number (seconds) - Yellow light duration

### ml-based
Machine learning based optimization

**Parameters:**
- `minGreenTime`: number (seconds)
- `maxGreenTime`: number (seconds)
- `learningRate`: number (0-1)
- Additional parameters TBD

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server error |
| 400 | Bad Request | Invalid request data |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing for production use.

---

## Authentication

Currently no authentication is required. Consider implementing for production use.
