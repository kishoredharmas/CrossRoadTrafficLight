const SimulationEngine = require('../../server/simulation/SimulationEngine');

describe('SimulationEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new SimulationEngine('test-session-id');
  });

  afterEach(() => {
    if (engine.isRunning) {
      engine.stop();
    }
  });

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      expect(engine.sessionId).toBe('test-session-id');
      expect(engine.isRunning).toBe(false);
      expect(engine.isPaused).toBe(false);
      expect(engine.simulationTime).toBe(0);
      expect(engine.vehicles).toEqual([]);
    });

    it('should have default crossroad configuration', () => {
      expect(engine.crossroad).toBeDefined();
      expect(engine.crossroad.name).toBe('Default Crossroad');
      expect(engine.crossroad.lanes).toHaveProperty('north');
      expect(engine.crossroad.lanes).toHaveProperty('south');
      expect(engine.crossroad.lanes).toHaveProperty('east');
      expect(engine.crossroad.lanes).toHaveProperty('west');
    });

    it('should initialize with default algorithm', () => {
      expect(engine.algorithm).toBeDefined();
      expect(engine.algorithmParams).toBeDefined();
    });
  });

  describe('updateCrossroad', () => {
    it('should update crossroad configuration', () => {
      const newCrossroad = {
        id: 'crossroad-1',
        name: 'Test Crossroad',
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
        },
        signals: {}
      };

      engine.updateCrossroad(newCrossroad);

      expect(engine.crossroad.id).toBe('crossroad-1');
      expect(engine.crossroad.name).toBe('Test Crossroad');
    });
  });

  describe('setAlgorithm', () => {
    it('should set fixed-time algorithm', () => {
      engine.setAlgorithm('fixed-time', { cycleTime: 90 });

      expect(engine.algorithm).toBeDefined();
      expect(engine.algorithmParams.cycleTime).toBe(90);
    });

    it('should update algorithm parameters', () => {
      const params = { cycleTime: 120, greenTime: 40 };
      engine.setAlgorithm('fixed-time', params);

      expect(engine.algorithmParams.cycleTime).toBe(120);
      expect(engine.algorithmParams.greenTime).toBe(40);
    });
  });

  describe('configuration', () => {
    it('should update traffic configuration via config property', () => {
      const newConfig = {
        vehicleSpawnRate: 0.5,
        vehicleSpeed: 250,
        trafficPattern: 'rush-hour'
      };

      engine.config = newConfig;

      expect(engine.config.vehicleSpawnRate).toBe(0.5);
      expect(engine.config.vehicleSpeed).toBe(250);
      expect(engine.config.trafficPattern).toBe('rush-hour');
    });
  });

  describe('start and stop', () => {
    it('should start the simulation', () => {
      engine.start();

      expect(engine.isRunning).toBe(true);
      expect(engine.tickInterval).not.toBeNull();

      engine.stop();
    });

    it('should stop the simulation', () => {
      engine.start();
      engine.stop();

      expect(engine.isRunning).toBe(false);
      expect(engine.tickInterval).toBeNull();
    });

    it('should not start if already running', () => {
      engine.start();
      const firstInterval = engine.tickInterval;
      engine.start();

      expect(engine.tickInterval).toBe(firstInterval);

      engine.stop();
    });
  });

  describe('pause and resume', () => {
    it('should pause the simulation', () => {
      engine.start();
      engine.pause();

      expect(engine.isPaused).toBe(true);

      engine.stop();
    });

    it('should resume the simulation', () => {
      engine.start();
      engine.pause();
      engine.resume();

      expect(engine.isPaused).toBe(false);

      engine.stop();
    });
  });

  describe('stop', () => {
    it('should reset simulation state on stop', () => {
      engine.start();
      engine.simulationTime = 1000;
      engine.vehicles = [{ id: 'v1' }];

      engine.stop();

      expect(engine.simulationTime).toBe(0);
      expect(engine.vehicles).toEqual([]);
      expect(engine.isRunning).toBe(false);
      expect(engine.isPaused).toBe(false);
    });
  });

  describe('calculateIntersectionSize', () => {
    it('should return minimum size for empty lanes', () => {
      const size = engine.calculateIntersectionSize();
      expect(size).toBeGreaterThanOrEqual(30);
    });

    it('should calculate size based on lane count', () => {
      engine.crossroad.lanes.north.incoming = [
        { id: 'n-in-1' },
        { id: 'n-in-2' },
        { id: 'n-in-3' },
        { id: 'n-in-4' }
      ];

      const size = engine.calculateIntersectionSize();
      expect(size).toBeGreaterThan(30);
    });
  });

  describe('getState', () => {
    it('should return current simulation state', () => {
      const state = engine.getState();

      expect(state).toHaveProperty('isRunning');
      expect(state).toHaveProperty('isPaused');
      expect(state).toHaveProperty('simulationTime');
      expect(state).toHaveProperty('vehicleCount');
      expect(state).toHaveProperty('crossroad');
    });

    it('should include vehicle count in state', () => {
      engine.vehicles = [{ id: 'v1' }, { id: 'v2' }];
      const state = engine.getState();

      expect(state.vehicleCount).toBe(2);
    });
  });

  describe('recording', () => {
    it('should start recording', () => {
      engine.startRecording();

      expect(engine.recording.enabled).toBe(true);
      expect(engine.recording.startTime).toBeDefined();
      expect(engine.recording.events).toEqual([]);
    });

    it('should stop recording and return data', () => {
      engine.startRecording();
      const recordingData = engine.stopRecording();

      expect(engine.recording.enabled).toBe(false);
      expect(recordingData).toHaveProperty('startTime');
      expect(recordingData).toHaveProperty('endTime');
      expect(recordingData).toHaveProperty('events');
    });
  });
});
