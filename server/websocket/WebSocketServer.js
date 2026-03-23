const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const SimulationEngine = require('../simulation/SimulationEngine');
const SessionManager = require('../services/SessionManager');
const CrossroadManager = require('../services/CrossroadManager');

class WebSocketServer {
  constructor(port) {
    this.port = port;
    this.wss = null;
    this.clients = new Map(); // clientId -> { ws, sessionId, subscriptions }
    this.sessions = new Map(); // sessionId -> SimulationEngine
    this.sessionManager = new SessionManager();
    this.crossroadManager = new CrossroadManager();
  }

  // Enrich crossroad lanes with coordinate data for simulation
  enrichCrossroadWithCoordinates(crossroad) {
    const CANVAS_CENTER_X = 700;
    const CANVAS_CENTER_Y = 500;
    const LANE_WIDTH = 40;
    const LANE_LENGTH_SCALED = 250; // pixels
    
    // Calculate intersection size
    const maxLanes = Math.max(
      (crossroad.lanes.north?.incoming?.length || 0) + (crossroad.lanes.north?.outgoing?.length || 0),
      (crossroad.lanes.south?.incoming?.length || 0) + (crossroad.lanes.south?.outgoing?.length || 0),
      (crossroad.lanes.east?.incoming?.length || 0) + (crossroad.lanes.east?.outgoing?.length || 0),
      (crossroad.lanes.west?.incoming?.length || 0) + (crossroad.lanes.west?.outgoing?.length || 0)
    );
    const intersectionSize = Math.max(60, maxLanes * LANE_WIDTH / 2);

    const enrichedLanes = JSON.parse(JSON.stringify(crossroad.lanes));

    ['north', 'south', 'east', 'west'].forEach(direction => {
      const incomingLanes = enrichedLanes[direction]?.incoming || [];
      const outgoingLanes = enrichedLanes[direction]?.outgoing || [];
      
      // Sort incoming lanes: right, straight, left (visual order)
      const rightLanes = incomingLanes.filter(l => l.type === 'right');
      const straightLanes = incomingLanes.filter(l => l.type === 'straight');
      const leftLanes = incomingLanes.filter(l => l.type === 'left');
      const sortedIncoming = [...rightLanes, ...straightLanes, ...leftLanes];
      
      const incomingCount = incomingLanes.length;
      const outgoingCount = outgoingLanes.length;
      const totalLanes = incomingCount + outgoingCount;
      const offset = totalLanes * LANE_WIDTH / 2;

      // Enrich incoming lanes with coordinates
      sortedIncoming.forEach((lane, index) => {
        const originalLane = incomingLanes.find(l => l.id === lane.id);
        if (!originalLane) return;

        let startCoords, endCoords;

        switch (direction) {
          case 'north':
            // North: incoming lanes spawn at top, end at intersection
            startCoords = {
              x: CANVAS_CENTER_X - offset + (index * LANE_WIDTH) + LANE_WIDTH / 2,
              y: CANVAS_CENTER_Y - intersectionSize / 2 - LANE_LENGTH_SCALED
            };
            endCoords = {
              x: CANVAS_CENTER_X - offset + (index * LANE_WIDTH) + LANE_WIDTH / 2,
              y: CANVAS_CENTER_Y - intersectionSize / 2
            };
            break;
          case 'south':
            // South: incoming lanes spawn at bottom, end at intersection
            startCoords = {
              x: CANVAS_CENTER_X + offset - (index * LANE_WIDTH) - LANE_WIDTH / 2,
              y: CANVAS_CENTER_Y + intersectionSize / 2 + LANE_LENGTH_SCALED
            };
            endCoords = {
              x: CANVAS_CENTER_X + offset - (index * LANE_WIDTH) - LANE_WIDTH / 2,
              y: CANVAS_CENTER_Y + intersectionSize / 2
            };
            break;
          case 'east':
            // East: incoming lanes spawn at right, end at intersection
            startCoords = {
              x: CANVAS_CENTER_X + intersectionSize / 2 + LANE_LENGTH_SCALED,
              y: CANVAS_CENTER_Y - offset + (index * LANE_WIDTH) + LANE_WIDTH / 2
            };
            endCoords = {
              x: CANVAS_CENTER_X + intersectionSize / 2,
              y: CANVAS_CENTER_Y - offset + (index * LANE_WIDTH) + LANE_WIDTH / 2
            };
            break;
          case 'west':
            // West: incoming lanes spawn at left, end at intersection
            startCoords = {
              x: CANVAS_CENTER_X - intersectionSize / 2 - LANE_LENGTH_SCALED,
              y: CANVAS_CENTER_Y + offset - (index * LANE_WIDTH) - LANE_WIDTH / 2
            };
            endCoords = {
              x: CANVAS_CENTER_X - intersectionSize / 2,
              y: CANVAS_CENTER_Y + offset - (index * LANE_WIDTH) - LANE_WIDTH / 2
            };
            break;
        }

        originalLane.startCoords = startCoords;
        originalLane.endCoords = endCoords;
      });

      // Enrich outgoing lanes with coordinates
      outgoingLanes.forEach((lane, index) => {
        let startCoords, endCoords;

        switch (direction) {
          case 'north':
            // North: outgoing lanes start at intersection, extend upward
            startCoords = {
              x: CANVAS_CENTER_X - offset + (incomingCount * LANE_WIDTH) + (index * LANE_WIDTH) + LANE_WIDTH / 2,
              y: CANVAS_CENTER_Y - intersectionSize / 2
            };
            endCoords = {
              x: CANVAS_CENTER_X - offset + (incomingCount * LANE_WIDTH) + (index * LANE_WIDTH) + LANE_WIDTH / 2,
              y: CANVAS_CENTER_Y - intersectionSize / 2 - LANE_LENGTH_SCALED
            };
            break;
          case 'south':
            // South: outgoing lanes start at intersection, extend downward
            startCoords = {
              x: CANVAS_CENTER_X + offset - (incomingCount * LANE_WIDTH) - (index * LANE_WIDTH) - LANE_WIDTH / 2,
              y: CANVAS_CENTER_Y + intersectionSize / 2
            };
            endCoords = {
              x: CANVAS_CENTER_X + offset - (incomingCount * LANE_WIDTH) - (index * LANE_WIDTH) - LANE_WIDTH / 2,
              y: CANVAS_CENTER_Y + intersectionSize / 2 + LANE_LENGTH_SCALED
            };
            break;
          case 'east':
            // East: outgoing lanes start at intersection, extend rightward
            startCoords = {
              x: CANVAS_CENTER_X + intersectionSize / 2,
              y: CANVAS_CENTER_Y - offset + (incomingCount * LANE_WIDTH) + (index * LANE_WIDTH) + LANE_WIDTH / 2
            };
            endCoords = {
              x: CANVAS_CENTER_X + intersectionSize / 2 + LANE_LENGTH_SCALED,
              y: CANVAS_CENTER_Y - offset + (incomingCount * LANE_WIDTH) + (index * LANE_WIDTH) + LANE_WIDTH / 2
            };
            break;
          case 'west':
            // West: outgoing lanes start at intersection, extend leftward
            startCoords = {
              x: CANVAS_CENTER_X - intersectionSize / 2,
              y: CANVAS_CENTER_Y + offset - (incomingCount * LANE_WIDTH) - (index * LANE_WIDTH) - LANE_WIDTH / 2
            };
            endCoords = {
              x: CANVAS_CENTER_X - intersectionSize / 2 - LANE_LENGTH_SCALED,
              y: CANVAS_CENTER_Y + offset - (incomingCount * LANE_WIDTH) - (index * LANE_WIDTH) - LANE_WIDTH / 2
            };
            break;
        }

        lane.startCoords = startCoords;
        lane.endCoords = endCoords;
      });
    });

    return {
      ...crossroad,
      lanes: enrichedLanes
    };
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    this.wss.on('connection', (ws) => {
      const clientId = uuidv4();

      this.clients.set(clientId, {
        ws,
        sessionId: null,
        subscriptions: new Set()
      });

      ws.on('message', (message) => {
        this.handleMessage(clientId, message);
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error) => {
      });

      // Send connection acknowledgment
      this.sendToClient(clientId, {
        type: 'connected',
        clientId,
        timestamp: Date.now()
      });
    });
  }

  handleMessage(clientId, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join_session':
          this.handleJoinSession(clientId, data.sessionId);
          break;
        
        case 'leave_session':
          this.handleLeaveSession(clientId);
          break;
        
        case 'start_simulation':
          this.handleStartSimulation(clientId, data.sessionId, data.trafficInflow);
          break;
        
        case 'pause_simulation':
          this.handlePauseSimulation(clientId, data.sessionId);
          break;
        
        case 'stop_simulation':
          this.handleStopSimulation(clientId, data.sessionId);
          break;
        
        case 'update_config':
          this.handleUpdateConfig(clientId, data.sessionId, data.config);
          break;
        
        case 'change_algorithm':
          this.handleChangeAlgorithm(clientId, data.sessionId, data.algorithm, data.params);
          break;
        
        case 'update_traffic_inflow':
          this.handleUpdateTrafficInflow(clientId, data.sessionId, data.trafficInflow);
          break;
        
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendToClient(clientId, {
        type: 'error',
        message: error.message
      });
    }
  }

  async handleJoinSession(clientId, sessionId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave previous session if any
    if (client.sessionId) {
      this.handleLeaveSession(clientId);
    }

    // Create or get session
    if (!this.sessions.has(sessionId)) {
      const engine = new SimulationEngine(sessionId);
      
      // Load session data from database
      try {
        const sessionData = await this.sessionManager.getSession(sessionId);
        if (sessionData) {
          // Load crossroad if specified
          if (sessionData.crossroadId) {
            const crossroadData = await this.crossroadManager.getCrossroad(sessionData.crossroadId);
            if (crossroadData) {
              
              // Enrich crossroad with coordinate data for simulation
              const enrichedCrossroad = this.enrichCrossroadWithCoordinates(crossroadData);
              
              engine.updateCrossroad({
                id: enrichedCrossroad.id,
                name: enrichedCrossroad.name,
                lanes: enrichedCrossroad.lanes,
                signals: enrichedCrossroad.signals
              });
            }
          }
          
          // Set algorithm from session
          if (sessionData.algorithm) {
            engine.setAlgorithm(sessionData.algorithm, sessionData.configuration || {});
          }
        }
      } catch (error) {
        // Failed to load session data, continue with empty engine
      }
      
      this.sessions.set(sessionId, engine);
      
      // Set up simulation event listeners
      engine.on('state_update', (state) => {
        this.broadcastToSession(sessionId, {
          type: 'simulation_state',
          state,
          timestamp: Date.now()
        });
      });

      engine.on('vehicle_update', (vehicles) => {
        this.broadcastToSession(sessionId, {
          type: 'vehicle_update',
          vehicles,
          timestamp: Date.now()
        });
      });

      engine.on('signal_update', (signals) => {
        this.broadcastToSession(sessionId, {
          type: 'signal_update',
          signals,
          timestamp: Date.now()
        });
      });

      engine.on('simulation_reset', (data) => {
        this.broadcastToSession(sessionId, {
          type: 'simulation_reset',
          vehicles: data.vehicles,
          signals: data.signals,
          timestamp: Date.now()
        });
      });
    }

    // Update client's session
    client.sessionId = sessionId;
    
    // Send current session state
    const engine = this.sessions.get(sessionId);
    this.sendToClient(clientId, {
      type: 'session_joined',
      sessionId,
      state: engine.getState(),
      timestamp: Date.now()
    });
  }

  handleLeaveSession(clientId) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;

    const sessionId = client.sessionId;
    client.sessionId = null;

    // Check if session has any remaining clients
    const hasClients = Array.from(this.clients.values()).some(
      c => c.sessionId === sessionId
    );

    // Clean up session if no clients remain
    if (!hasClients) {
      const engine = this.sessions.get(sessionId);
      if (engine) {
        engine.stop();
        engine.removeAllListeners();
        this.sessions.delete(sessionId);
      }
    }

    this.sendToClient(clientId, {
      type: 'session_left',
      timestamp: Date.now()
    });
  }

  handleStartSimulation(clientId, sessionId, trafficInflow = {}) {
    const engine = this.sessions.get(sessionId);
    if (engine) {
      // Configure traffic inflow levels if provided
      if (trafficInflow && Object.keys(trafficInflow).length > 0) {
        engine.setTrafficInflow(trafficInflow);
      }
      
      engine.start();
      this.broadcastToSession(sessionId, {
        type: 'simulation_started',
        state: engine.getState(),
        timestamp: Date.now()
      });
    }
  }

  handlePauseSimulation(clientId, sessionId) {
    const engine = this.sessions.get(sessionId);
    if (engine) {
      if (engine.isPaused) {
        engine.resume();
        this.broadcastToSession(sessionId, {
          type: 'simulation_resumed',
          state: engine.getState(),
          timestamp: Date.now()
        });
      } else {
        engine.pause();
        this.broadcastToSession(sessionId, {
          type: 'simulation_paused',
          state: engine.getState(),
          timestamp: Date.now()
        });
      }
    }
  }

  handleStopSimulation(clientId, sessionId) {
    const engine = this.sessions.get(sessionId);
    if (engine) {
      engine.stop();
      this.broadcastToSession(sessionId, {
        type: 'simulation_stopped',
        state: engine.getState(),
        timestamp: Date.now()
      });
    }
  }

  handleUpdateConfig(clientId, sessionId, config) {
    const engine = this.sessions.get(sessionId);
    if (engine) {
      engine.updateConfig(config);
      this.broadcastToSession(sessionId, {
        type: 'config_updated',
        config,
        timestamp: Date.now()
      });
    }
  }

  handleChangeAlgorithm(clientId, sessionId, algorithm, params) {
    const engine = this.sessions.get(sessionId);
    if (engine) {
      engine.setAlgorithm(algorithm, params);
      this.broadcastToSession(sessionId, {
        type: 'algorithm_changed',
        algorithm,
        params,
        timestamp: Date.now()
      });
    }
  }

  handleUpdateTrafficInflow(clientId, sessionId, trafficInflow = {}) {
    const engine = this.sessions.get(sessionId);
    if (engine && trafficInflow && Object.keys(trafficInflow).length > 0) {
      engine.setTrafficInflow(trafficInflow);
    }
  }

  handleDisconnect(clientId) {
    this.handleLeaveSession(clientId);
    this.clients.delete(clientId);
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  broadcastToSession(sessionId, data) {
    this.clients.forEach((client, clientId) => {
      if (client.sessionId === sessionId) {
        this.sendToClient(clientId, data);
      }
    });
  }

  broadcast(data) {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, data);
    });
  }

  close() {
    // Close all client connections
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close();
      }
    });
    
    // Stop all simulations
    this.sessions.forEach((engine) => {
      engine.stop();
    });
    
    // Close the WebSocket server
    if (this.wss) {
      this.wss.close(() => {
      });
    }
    
    this.clients.clear();
    this.sessions.clear();
  }
}

module.exports = WebSocketServer;
