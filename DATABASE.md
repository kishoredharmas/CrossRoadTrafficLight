# Database Integration Guide

## Overview

The Traffic Light Simulation application now uses **SQLite** database for persistent storage instead of JSON files. This provides better data integrity, query performance, and scalability.

## Database Configuration

### Location
- **Database File**: `data/traffic_simulation.db`
- **Configuration**: `server/config/database.js`

### Technology Stack
- **ORM**: Sequelize v6
- **Database**: SQLite3 (easily switchable to PostgreSQL/MySQL)
- **Node.js Driver**: sqlite3

## Data Models

### 1. Crossroad Model
Represents traffic intersection designs with lanes and signals.

**Schema**:
```javascript
{
  id: UUID (Primary Key)
  name: String (Required)
  description: Text
  location: JSON { lat, lng }
  mapProvider: String (openstreetmap/google/mapbox)
  lanes: JSON (lane configuration)
  signals: JSON (signal configuration)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 2. Session Model
Represents simulation sessions with configuration and state.

**Schema**:
```javascript
{
  id: UUID (Primary Key)
  name: String (Required)
  crossroadId: UUID (Foreign Key -> Crossroad)
  algorithm: String (fixed-time/adaptive/coordinated)
  configuration: JSON { vehicleSpawnRate, simulationSpeed, duration }
  status: String (created/running/completed/paused)
  startTime: DateTime
  endTime: DateTime
  statistics: JSON
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 3. Recording Model
Stores recorded simulation data for playback and analysis.

**Schema**:
```javascript
{
  id: UUID (Primary Key)
  name: String (Required)
  sessionId: UUID (Foreign Key -> Session)
  duration: Integer (seconds)
  frames: JSON (array of simulation frames)
  statistics: JSON
  metadata: JSON
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Service Layer

### CrossroadManager
- **listCrossroads()** - Get all crossroads (ordered by creation date)
- **getCrossroad(id)** - Get single crossroad by ID
- **createCrossroad(data)** - Create new crossroad design
- **updateCrossroad(id, updates)** - Update existing crossroad
- **deleteCrossroad(id)** - Delete crossroad

### SessionManager
- **listSessions()** - Get all sessions
- **getSession(id)** - Get single session by ID
- **createSession(data)** - Create new simulation session
- **updateSession(id, updates)** - Update session (status, statistics, etc.)
- **deleteSession(id)** - Delete session
- **duplicateSession(id)** - Create copy of existing session

### RecordingManager
- **listRecordings()** - Get all recordings (without frame data for performance)
- **getRecording(id)** - Get single recording with full frame data
- **saveRecording(data)** - Save new recording
- **deleteRecording(id)** - Delete recording
- **createPlaybackSession(recordingId)** - Create playback session from recording

## Migration from JSON Files

### Automatic Migration Script
A migration script is provided to import existing JSON data into the database.

**Run Migration**:
```bash
npm run migrate
```

The script:
1. Reads all JSON files from `data/crossroads/`, `data/sessions/`, and `data/recordings/`
2. Validates data and checks for duplicates
3. Imports data maintaining relationships (crossroads → sessions → recordings)
4. Provides detailed import summary

**Migration Output**:
```
🚀 Starting data migration to database...
============================================================
✓ Database connection established successfully
✓ Database models synchronized

📍 Migrating crossroads...
  ✅ Imported crossroad: New Crossroad
  Total: 2 imported, 0 skipped

🎮 Migrating sessions...
  Total: 0 imported, 0 skipped

🎬 Migrating recordings...
  Total: 0 imported, 0 skipped

============================================================
📊 Migration Summary:
  Crossroads: 2/2 imported
  Sessions:   0/0 imported
  Recordings: 0/0 imported
============================================================
✅ Migration completed successfully!
```

## API Endpoints

All existing REST API endpoints remain unchanged. They now use the database instead of file system.

### Crossroad Endpoints
- `GET /api/crossroads` - List all crossroads
- `GET /api/crossroads/:id` - Get crossroad by ID
- `POST /api/crossroads` - Create new crossroad
- `PUT /api/crossroads/:id` - Update crossroad
- `DELETE /api/crossroads/:id` - Delete crossroad

### Session Endpoints
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/sessions/:id/duplicate` - Duplicate session

### Recording Endpoints
- `GET /api/recordings` - List all recordings (summary)
- `GET /api/recordings/:id` - Get recording with full data
- `POST /api/recordings` - Save new recording
- `DELETE /api/recordings/:id` - Delete recording

## Database Initialization

The database is automatically initialized when the server starts:

**In `server/index.js`**:
```javascript
const startServer = async () => {
  // Test database connection
  await testConnection();
  
  // Initialize database (sync models)
  await initializeDatabase();
  
  // Start HTTP server
  const server = app.listen(PORT, ...);
};
```

### Schema Synchronization
- Uses `sequelize.sync()` to create tables if they don't exist
- Does not alter existing tables to prevent data conflicts
- Safe for development and production
- For schema changes, use proper migrations or recreate the database

## Benefits of Database Integration

### 1. **Data Integrity**
- Foreign key constraints ensure valid relationships
- Validation at model level
- ACID transactions

### 2. **Performance**
- Indexed queries for fast lookups
- Efficient joins for related data
- Optimized for large datasets

### 3. **Scalability**
- Easy to switch from SQLite to PostgreSQL/MySQL
- Support for clustering and replication
- Better concurrent access handling

### 4. **Query Capabilities**
- Complex filtering and sorting
- Aggregations and statistics
- Full-text search capabilities

### 5. **Maintenance**
- Automatic migrations
- Schema versioning
- Backup and restore tools

## Development Workflow

### 1. Starting the Server
```bash
npm run dev
```
Database is automatically initialized on startup.

### 2. Creating New Data
Use the web interface or API endpoints. Data is automatically persisted to SQLite.

### 3. Viewing Database
Use any SQLite browser tool:
```bash
sqlite3 data/traffic_simulation.db
```

Example queries:
```sql
-- List all crossroads
SELECT id, name, createdAt FROM Crossroads;

-- List sessions with crossroad names
SELECT s.name, c.name as crossroad 
FROM Sessions s 
JOIN Crossroads c ON s.crossroadId = c.id;

-- Count recordings per session
SELECT sessionId, COUNT(*) as recording_count 
FROM Recordings 
GROUP BY sessionId;
```

## Backup and Restore

### Backup
```bash
# Copy database file
cp data/traffic_simulation.db data/backups/backup_$(date +%Y%m%d).db

# Or use SQLite backup command
sqlite3 data/traffic_simulation.db ".backup data/backups/backup.db"
```

### Restore
```bash
# Replace current database with backup
cp data/backups/backup_20240203.db data/traffic_simulation.db

# Or restore from SQL dump
sqlite3 data/traffic_simulation.db < backup.sql
```

## Switching to PostgreSQL

For production deployments, you can easily switch to PostgreSQL:

**1. Update `server/config/database.js`**:
```javascript
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'traffic_simulation',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  logging: false
});
```

**2. Install PostgreSQL driver**:
```bash
npm install pg pg-hstore
```

**3. Update `.env`**:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=traffic_simulation
DB_USER=postgres
DB_PASSWORD=your_password
```

## Troubleshooting

### Database Connection Errors
- Check if `data/` directory exists
- Verify file permissions
- Check for locked database (close other connections)

### Migration Issues
- Ensure JSON files are valid
- Check foreign key constraints
- Review migration logs for specific errors

### Schema Changes
- Stop the server before manual schema changes
- Use migrations for production
- Test schema changes in development first

## Files Overview

```
server/
├── config/
│   └── database.js           # Database configuration
├── models/
│   ├── Crossroad.js          # Crossroad model definition
│   ├── Session.js            # Session model definition
│   └── Recording.js          # Recording model definition
├── services/
│   ├── CrossroadManager.js   # Crossroad business logic
│   ├── SessionManager.js     # Session business logic
│   └── RecordingManager.js   # Recording business logic
├── routes/
│   ├── crossroadRoutes.js    # Crossroad API routes
│   ├── sessionRoutes.js      # Session API routes
│   └── recordingRoutes.js    # Recording API routes
└── scripts/
    └── migrateDataToDatabase.js  # Migration script

data/
├── traffic_simulation.db     # SQLite database file
├── crossroads/              # Legacy JSON files (can be archived)
├── sessions/                # Legacy JSON files (can be archived)
└── recordings/              # Legacy JSON files (can be archived)
```

## Next Steps

1. ✅ Database is configured and initialized
2. ✅ Existing data has been migrated
3. ✅ All API endpoints use database
4. 📝 Consider archiving old JSON files
5. 📝 Set up automated backups
6. 📝 Add database monitoring
7. 📝 Implement data retention policies

## Support

For issues or questions:
- Check server logs in the terminal
- Review API responses for error details
- Examine database file with SQLite browser
- Run migration script again if data is missing
