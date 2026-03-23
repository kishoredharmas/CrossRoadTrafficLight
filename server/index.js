require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const { testConnection, initializeDatabase } = require('./config/database');
const WebSocketServer = require('./websocket/WebSocketServer');
const sessionRoutes = require('./routes/sessionRoutes');
const recordingRoutes = require('./routes/recordingRoutes');
const crossroadRoutes = require('./routes/crossroadRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/crossroads', crossroadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from React build (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Initialize database and start servers
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize database (sync models)
    await initializeDatabase();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
    });

    // Start WebSocket server
    const wsServer = new WebSocketServer(WS_PORT);
    wsServer.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
      server.close(() => {
        wsServer.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      server.close(() => {
        wsServer.close();
        process.exit(0);
      });
    });

    process.on('SIGHUP', () => {
      server.close(() => {
        wsServer.close();
        process.exit(0);
      });
    });

    // Cleanup on uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      server.close(() => {
        wsServer.close();
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;
