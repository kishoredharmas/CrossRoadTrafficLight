# Database Quick Reference

## 🗄️ Database Information

- **Type**: SQLite
- **Location**: `data/traffic_simulation.db`
- **ORM**: Sequelize v6
- **Auto-sync**: Yes (on server start)

## 📋 Data Models

### Crossroad
- Stores traffic intersection designs
- Fields: id, name, description, location, mapProvider, lanes, signals
- Relationship: has many Sessions

### Session
- Stores simulation configurations
- Fields: id, name, crossroadId, algorithm, configuration, status, statistics
- Relationship: belongs to Crossroad, has many Recordings

### Recording
- Stores simulation playback data
- Fields: id, name, sessionId, duration, frames, statistics, metadata
- Relationship: belongs to Session

## 🚀 Commands

```bash
# Start application (auto-initializes database)
npm start
npm run dev

# Migrate existing JSON files to database
npm run migrate

# Test database operations
npm run test:db

# View all crossroads via API
curl http://localhost:3001/api/crossroads

# View all sessions via API
curl http://localhost:3001/api/sessions

# View all recordings via API
curl http://localhost:3001/api/recordings
```

## 🔧 Common Operations

### Create a Crossroad
```bash
curl -X POST http://localhost:3001/api/crossroads \
  -H "Content-Type: application/json" \
  -d '{"name": "My Crossroad", "location": {"lat": 40.7128, "lng": -74.0060}}'
```

### Create a Session
```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"name": "My Session", "crossroadId": "UUID", "algorithm": "adaptive"}'
```

### Create a Recording
```bash
curl -X POST http://localhost:3001/api/recordings \
  -H "Content-Type: application/json" \
  -d '{"name": "My Recording", "sessionId": "UUID", "frames": [], "duration": 120}'
```

## 📊 Service APIs

### CrossroadManager
- `listCrossroads()` - Get all
- `getCrossroad(id)` - Get one
- `createCrossroad(data)` - Create
- `updateCrossroad(id, updates)` - Update
- `deleteCrossroad(id)` - Delete

### SessionManager
- `listSessions()` - Get all
- `getSession(id)` - Get one
- `createSession(data)` - Create
- `updateSession(id, updates)` - Update
- `deleteSession(id)` - Delete
- `duplicateSession(id)` - Duplicate

### RecordingManager
- `listRecordings()` - Get all (no frames)
- `getRecording(id)` - Get one (with frames)
- `saveRecording(data)` - Create
- `deleteRecording(id)` - Delete
- `createPlaybackSession(recordingId)` - Create playback

## 🔍 Querying the Database

### Using Node.js
```javascript
const Crossroad = require('./server/models/Crossroad');

// Find all
const crossroads = await Crossroad.findAll();

// Find by ID
const crossroad = await Crossroad.findByPk(id);

// Create
const newCrossroad = await Crossroad.create({ name: "Test", ... });

// Update
await crossroad.update({ name: "New Name" });

// Delete
await crossroad.destroy();
```

## 🔗 Relationships

```
Crossroad (1) ──→ (N) Session (1) ──→ (N) Recording

• Session requires valid Crossroad (foreign key)
• Recording requires valid Session (foreign key)
• Deleting Crossroad will affect related Sessions
• Deleting Session will affect related Recordings
```

## 📝 Schema Details

### Crossroad
```javascript
{
  id: UUID (PK),
  name: String (required),
  description: Text,
  location: JSON { lat, lng },
  mapProvider: String,
  lanes: JSON,
  signals: JSON,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Session
```javascript
{
  id: UUID (PK),
  name: String (required),
  crossroadId: UUID (FK),
  algorithm: String,
  configuration: JSON,
  status: String,
  startTime: DateTime,
  endTime: DateTime,
  statistics: JSON,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Recording
```javascript
{
  id: UUID (PK),
  name: String (required),
  sessionId: UUID (FK),
  duration: Integer,
  frames: JSON (array),
  statistics: JSON,
  metadata: JSON,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## 🛠️ Troubleshooting

**Problem**: Database not found
- Solution: Start the server to auto-create it

**Problem**: Foreign key constraint error
- Solution: Ensure referenced ID exists (crossroadId, sessionId)

**Problem**: Migration failed
- Solution: Check JSON file format and run again

**Problem**: Duplicate key error
- Solution: Data already exists, check existing records

## 📚 Documentation

- Full guide: [DATABASE.md](DATABASE.md)
- Implementation details: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- Main README: [README.md](README.md)

## ✅ Verification

```bash
# Check database exists
ls -lh data/traffic_simulation.db

# Test database
npm run test:db

# Check API
curl http://localhost:3001/api/health
curl http://localhost:3001/api/crossroads
```

---

**Status**: ✅ Fully Operational
**Last Updated**: February 3, 2026
