const WebSocketServer = require('../../server/websocket/WebSocketServer');

describe('WebSocketServer', () => {
  let wsServer;

  beforeEach(() => {
    wsServer = new WebSocketServer(8080);
  });

  afterEach(() => {
    if (wsServer.wss) {
      wsServer.close();
    }
  });

  describe('Constructor', () => {
    it('should initialize with port', () => {
      expect(wsServer.port).toBe(8080);
      expect(wsServer.wss).toBeNull();
    });

    it('should initialize empty collections', () => {
      expect(wsServer.clients).toBeInstanceOf(Map);
      expect(wsServer.sessions).toBeInstanceOf(Map);
      expect(wsServer.clients.size).toBe(0);
      expect(wsServer.sessions.size).toBe(0);
    });

    it('should initialize service managers', () => {
      expect(wsServer.sessionManager).toBeDefined();
      expect(wsServer.crossroadManager).toBeDefined();
    });
  });

  describe('enrichCrossroadWithCoordinates', () => {
    it('should enrich crossroad lanes with coordinates', () => {
      const crossroad = {
        lanes: {
          north: {
            incoming: [{ id: 'n-in-1', type: 'straight', length: 100 }],
            outgoing: [{ id: 'n-out-1', type: 'straight', length: 100 }]
          },
          south: {
            incoming: [{ id: 's-in-1', type: 'straight', length: 100 }],
            outgoing: [{ id: 's-out-1', type: 'straight', length: 100 }]
          },
          east: {
            incoming: [{ id: 'e-in-1', type: 'straight', length: 100 }],
            outgoing: [{ id: 'e-out-1', type: 'straight', length: 100 }]
          },
          west: {
            incoming: [{ id: 'w-in-1', type: 'straight', length: 100 }],
            outgoing: [{ id: 'w-out-1', type: 'straight', length: 100 }]
          }
        }
      };

      const enriched = wsServer.enrichCrossroadWithCoordinates(crossroad);

      expect(enriched).toBeDefined();
      expect(enriched.lanes).toBeDefined();
      expect(enriched.lanes.north).toBeDefined();
      expect(enriched.lanes.north.incoming[0].startCoords).toBeDefined();
      expect(enriched.lanes.north.incoming[0].endCoords).toBeDefined();
      expect(enriched.lanes.north.incoming[0].startCoords.x).toBeDefined();
      expect(enriched.lanes.north.incoming[0].startCoords.y).toBeDefined();
    });

    it('should handle empty lanes', () => {
      const crossroad = {
        lanes: {
          north: { incoming: [], outgoing: [] },
          south: { incoming: [], outgoing: [] },
          east: { incoming: [], outgoing: [] },
          west: { incoming: [], outgoing: [] }
        }
      };

      const enriched = wsServer.enrichCrossroadWithCoordinates(crossroad);

      expect(enriched.lanes.north.incoming).toEqual([]);
      expect(enriched.lanes.south.incoming).toEqual([]);
    });
  });

  describe('broadcast', () => {
    it('should not throw when broadcasting with no clients', () => {
      expect(() => {
        wsServer.broadcast({ type: 'test', data: {} });
      }).not.toThrow();
    });
  });

  describe('sendToClient', () => {
    it('should not throw when sending to non-existent client', () => {
      expect(() => {
        wsServer.sendToClient('non-existent-client', { type: 'test' });
      }).not.toThrow();
    });
  });

  describe('broadcastToSession', () => {
    it('should not throw when broadcasting to non-existent session', () => {
      expect(() => {
        wsServer.broadcastToSession('non-existent-session', { type: 'test' });
      }).not.toThrow();
    });
  });

  describe('handleMessage', () => {
    it('should handle JSON string messages', () => {
      const mockClient = { ws: { send: jest.fn() } };
      const message = JSON.stringify({ type: 'ping' });

      expect(() => {
        wsServer.handleMessage('test-client', message);
      }).not.toThrow();
    });
  });

  describe('handleDisconnect', () => {
    it('should not throw when disconnecting non-existent client', () => {
      expect(() => {
        wsServer.handleDisconnect('non-existent-client');
      }).not.toThrow();
    });
  });

  describe('close', () => {
    it('should not throw when closing uninitialized server', () => {
      expect(() => {
        wsServer.close();
      }).not.toThrow();
    });
  });
});
