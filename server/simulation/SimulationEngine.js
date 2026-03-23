const EventEmitter = require('events');
const TrafficSignalAlgorithms = require('./algorithms/TrafficSignalAlgorithms');
const VehicleGenerator = require('./VehicleGenerator');
const { v4: uuidv4 } = require('uuid');

class SimulationEngine extends EventEmitter {
  constructor(sessionId) {
    super();
    this.sessionId = sessionId;
    this.isRunning = false;
    this.isPaused = false;
    this.tickRate = 100; // milliseconds per simulation tick
    this.simulationTime = 0;
    this.lastLogTime = -1; // For periodic logging
    this.tickInterval = null;
    
    // Crossroad configuration - will be set via updateCrossroad()
    this.crossroad = {
      id: uuidv4(),
      name: 'Default Crossroad',
      lanes: {
        north: { incoming: [], outgoing: [] },
        south: { incoming: [], outgoing: [] },
        east: { incoming: [], outgoing: [] },
        west: { incoming: [], outgoing: [] }
      },
      signals: {} // Will be initialized from crossroad design
    };
    
    // Traffic configuration
    this.config = {
      vehicleSpawnRate: 0.3, // vehicles per second per lane
      vehicleSpeed: 200, // km/h (increased for faster simulation)
      trafficPattern: 'uniform', // uniform, rush-hour, custom
    };
    
    // Current algorithm
    this.algorithm = null;
    this.algorithmParams = {};
    this.setAlgorithm('fixed-time', { cycleTime: 60, greenTime: 30 });
    
    // Simulation state
    this.vehicles = [];
    this.vehicleGenerator = new VehicleGenerator(this.crossroad, this.config);
    
    // Recording
    this.recording = {
      enabled: false,
      startTime: null,
      events: []
    };
  }

  calculateIntersectionSize() {
    if (!this.crossroad || !this.crossroad.lanes) return 30;
    
    const maxLanes = Math.max(
      (this.crossroad.lanes.north?.incoming?.length || 0) + (this.crossroad.lanes.north?.outgoing?.length || 0),
      (this.crossroad.lanes.south?.incoming?.length || 0) + (this.crossroad.lanes.south?.outgoing?.length || 0),
      (this.crossroad.lanes.east?.incoming?.length || 0) + (this.crossroad.lanes.east?.outgoing?.length || 0),
      (this.crossroad.lanes.west?.incoming?.length || 0) + (this.crossroad.lanes.west?.outgoing?.length || 0)
    );
    
    // Calculate intersection size: 10 meters per lane, minimum 30 meters
    return Math.max(30, maxLanes * 10);
  }

  updateVehicleCoordinates(vehicle) {
    // Calculate the current X,Y coordinates based on phase and position
    const lane = vehicle.lane;
    if (!lane || !lane.startCoords || !lane.endCoords) {
      return; // Skip if lane doesn't have coordinates
    }

    const startX = lane.startCoords.x;
    const startY = lane.startCoords.y;
    const endX = lane.endCoords.x;
    const endY = lane.endCoords.y;
    
    if (vehicle.phase === 'incoming') {
      // Calculate position along the incoming lane
      const progress = vehicle.position / lane.length;
      vehicle.x = startX + (endX - startX) * progress;
      vehicle.y = startY + (endY - startY) * progress;
    } else if (vehicle.phase === 'intersection') {
      // In intersection - interpolate from incoming lane end to outgoing lane start
      if (!vehicle.targetLane || !vehicle.targetLane.startCoords) {
        // No target lane, stay at current position
        vehicle.x = endX;
        vehicle.y = endY;
        return;
      }
      
      const targetStartX = vehicle.targetLane.startCoords.x;
      const targetStartY = vehicle.targetLane.startCoords.y;
      
      // Calculate intersection crossing distance
      const intersectionSize = this.calculateIntersectionSize();
      const progress = vehicle.position / intersectionSize;
      
      vehicle.x = endX + (targetStartX - endX) * progress;
      vehicle.y = endY + (targetStartY - endY) * progress;
    } else if (vehicle.phase === 'outgoing') {
      // Calculate position along the outgoing lane
      if (!vehicle.targetLane || !vehicle.targetLane.startCoords || !vehicle.targetLane.endCoords) {
        return;
      }
      
      const outStartX = vehicle.targetLane.startCoords.x;
      const outStartY = vehicle.targetLane.startCoords.y;
      const outEndX = vehicle.targetLane.endCoords.x;
      const outEndY = vehicle.targetLane.endCoords.y;
      
      const progress = vehicle.position / vehicle.targetLane.length;
      vehicle.x = outStartX + (outEndX - outStartX) * progress;
      vehicle.y = outStartY + (outEndY - outStartY) * progress;
    }
  }

  isVehicleInIntersection(vehicle) {
    // Check if vehicle is within the intersection boundary
    if (!this.crossroad.intersection || !vehicle.x || !vehicle.y) {
      return vehicle.phase === 'intersection';
    }

    const intersection = this.crossroad.intersection;
    const centerX = intersection.center.x;
    const centerY = intersection.center.y;
    const halfWidth = intersection.width / 2;
    const halfHeight = intersection.height / 2;

    return (
      vehicle.x >= centerX - halfWidth &&
      vehicle.x <= centerX + halfWidth &&
      vehicle.y >= centerY - halfHeight &&
      vehicle.y <= centerY + halfHeight
    );
  }

  canEnterIntersection(vehicle, vehicleSignal) {
    // Check if intersection is clear from conflicting directions
    if (!vehicleSignal || vehicleSignal.state !== 'green') {
      return false;
    }

    // Check for vehicles from other directions in the intersection
    const conflictingVehicles = this.vehicles.filter(v => 
      v.id !== vehicle.id &&
      v.originalDirection !== vehicle.originalDirection &&
      this.isVehicleInIntersection(v)
    );

    return conflictingVehicles.length === 0;
  }

  start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    
    if (this.recording.enabled) {
      this.recording.startTime = Date.now();
      this.recording.events = [];
    }
    
    this.tickInterval = setInterval(() => this.tick(), this.tickRate);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    
    // Reset simulation time and phase for fresh restart
    this.simulationTime = 0;
    this.lastLogTime = -1;
    
    // Clear all vehicles
    this.vehicles = [];
    
    // Reset traffic signal algorithm
    if (this.algorithm) {
      this.algorithm.phaseTime = 0;
      this.algorithm.currentPhase = 0;
    }
    
    // Reset all signals to initial state based on algorithm
    if (this.crossroad.signals) {
      Object.keys(this.crossroad.signals).forEach(direction => {
        const signal = this.crossroad.signals[direction];
        // Let the algorithm handle initial state
        if (Array.isArray(signal)) {
          signal.forEach(s => {
            s.timeInState = 0;
          });
        } else if (signal && typeof signal === 'object') {
          signal.timeInState = 0;
        }
      });
    }
    
    // Emit reset state
    this.emit('simulation_reset', {
      vehicles: this.vehicles,
      signals: this.crossroad.signals
    });
  }

  tick() {
    if (this.isPaused) return;
    
    const deltaTime = this.tickRate / 1000; // Convert to seconds
    this.simulationTime += deltaTime;
    
    // Update traffic signals using current algorithm
    if (this.algorithm && this.crossroad.signals) {
      this.algorithm.update(this.crossroad.signals, deltaTime);
    }
    
    // Spawn new vehicles
    const newVehicles = this.vehicleGenerator.generateVehicles(deltaTime);
    this.vehicles.push(...newVehicles);
    
    // Update vehicle positions
    this.updateVehicles(deltaTime);
    
    // Record events if recording is enabled
    if (this.recording.enabled) {
      this.recordTick();
    }
    
    // Emit updates
    this.emit('state_update', this.getState());
    this.emit('vehicle_update', this.vehicles);
    this.emit('signal_update', this.crossroad.signals);
  }

  updateVehicles(deltaTime) {
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const vehicle = this.vehicles[i];
      
      // Find the signal for this vehicle's lane
      // Use the original direction the vehicle came from (not current direction)
      const directionSignals = this.crossroad.signals[vehicle.originalDirection || vehicle.direction];
      let vehicleSignal = null;
      
      if (Array.isArray(directionSignals)) {
        // Find signal matching this vehicle's original lane
        vehicleSignal = directionSignals.find(s => s.laneId === (vehicle.originalLane?.id || vehicle.lane.id));
      } else if (directionSignals) {
        // Single signal for direction
        vehicleSignal = directionSignals;
      }
      
      // Determine if vehicle can proceed based on signal and position
      const INTERSECTION_SIZE = this.calculateIntersectionSize(); // Calculate dynamically based on crossroad
      
      // Get lane length from vehicle's lane object (should always be set from crossroad config)
      const INCOMING_LANE_LENGTH = vehicle.lane.length;
      const OUTGOING_LANE_LENGTH = vehicle.targetLane?.length;
      
      if (!INCOMING_LANE_LENGTH) {
        continue;
      }
      
      let canMove = true;
      
      // Check for vehicle ahead ONLY in incoming phase to prevent overlap
      // Outgoing vehicles should flow freely without collision detection
      const SAFE_DISTANCE = 15; // Minimum distance to maintain from vehicle ahead
      let vehicleAhead = null;
      
      if (vehicle.phase === 'incoming') {
        vehicleAhead = this.vehicles.find(v => 
          v.id !== vehicle.id &&
          v.phase === 'incoming' &&
          v.lane?.id === vehicle.lane?.id &&
          v.direction === vehicle.direction &&
          v.position > vehicle.position &&
          (v.position - vehicle.position) < 50 // Only check vehicles within 50m
        );
        
        if (vehicleAhead) {
          const distanceToVehicleAhead = vehicleAhead.position - vehicle.position;
          if (distanceToVehicleAhead < SAFE_DISTANCE) {
            canMove = false;
            vehicle.speed = 0;
          } else if (distanceToVehicleAhead < SAFE_DISTANCE * 2) {
            // Slow down when approaching vehicle ahead
            vehicle.speed = Math.min(vehicle.speed, vehicleAhead.speed);
          }
        }
      }
      
      // Phase management based on position
      if (vehicle.phase === 'incoming' && canMove) {
        // Calculate stop line to align with visual intersection edge on canvas
        // Vehicles should stop just before the visual intersection area
        const STOP_LINE_OFFSET = 100; // Distance before end of lane to stop
        const STOP_LINE_POSITION = INCOMING_LANE_LENGTH - STOP_LINE_OFFSET;
        const distanceToStopLine = STOP_LINE_POSITION - vehicle.position;
        
        if (distanceToStopLine <= 50 && vehicleSignal) {
          if (vehicleSignal.state === 'red') {
            // Stop at red light if approaching stop line
            if (distanceToStopLine <= 10) {
              canMove = false;
              vehicle.speed = 0;
            } else {
              // Decelerate as approaching red light
              const maxSpeed = Math.max(0, vehicle.desiredSpeed * (distanceToStopLine / 50));
              vehicle.speed = Math.min(vehicle.speed, maxSpeed);
            }
          } else if (vehicleSignal.state === 'yellow') {
            // Stop at yellow if far enough to stop safely
            if (distanceToStopLine > 20) {
              // Decelerate
              const maxSpeed = Math.max(0, vehicle.desiredSpeed * (distanceToStopLine / 50));
              vehicle.speed = Math.min(vehicle.speed, maxSpeed);
              if (distanceToStopLine <= 10) {
                canMove = false;
                vehicle.speed = 0;
              }
            }
            // If too close (< 20m), proceed through
          } else if (vehicleSignal.state === 'green') {
            // Green light - always proceed at full speed
            canMove = true;
            // Restore full speed immediately if no vehicle ahead
            if (!vehicleAhead) {
              vehicle.speed = vehicle.desiredSpeed;
            }
          }
        } else if (vehicle.speed < vehicle.desiredSpeed && !vehicleAhead) {
          // Normal acceleration when far from intersection
          vehicle.speed = Math.min(vehicle.speed + 2 * deltaTime, vehicle.desiredSpeed);
        }
        
        // Transition to intersection phase ONLY when reaching stop line AND signal allows
        if (vehicle.position >= STOP_LINE_POSITION) {
          // Check if signal allows entry to intersection
          const canEnterIntersection = this.canEnterIntersection(vehicle, vehicleSignal);
          
          if (canEnterIntersection) {
            vehicle.phase = 'intersection';
            vehicle.position = 0; // Reset position for intersection
          } else {
            // Red light or intersection occupied - stop at the stop line
            vehicle.position = STOP_LINE_POSITION;
            vehicle.speed = 0;
            canMove = false;
          }
        }
      } else if (vehicle.phase === 'intersection') {
        // Move through intersection
        canMove = true;
        
        // Transition to outgoing phase when clearing intersection
        if (vehicle.position >= INTERSECTION_SIZE) {
          vehicle.phase = 'outgoing';
          vehicle.position = 0; // Reset position for outgoing lane
          vehicle.direction = vehicle.targetDirection; // Update direction
          vehicle.lane = vehicle.targetLane; // Update to outgoing lane
        }
      } else if (vehicle.phase === 'outgoing') {
        // Continue on outgoing lane
        canMove = true;
        
        // Check if we have a valid outgoing lane length
        if (!OUTGOING_LANE_LENGTH || OUTGOING_LANE_LENGTH <= 0) {
          // If no valid outgoing lane, remove vehicle after a short distance
          if (vehicle.position >= 50) {
            this.vehicles.splice(i, 1);
            continue;
          }
        } else {
          // Remove vehicle when it reaches end of outgoing lane
          if (vehicle.position >= OUTGOING_LANE_LENGTH) {
            this.vehicles.splice(i, 1);
            continue;
          }
        }
      }
      
      // Move vehicle if allowed - only update position if vehicle has speed and can move
      if (canMove && vehicle.speed > 0) {
        vehicle.position += vehicle.speed * deltaTime;
      } else if (!canMove && vehicle.phase === 'incoming') {
        // Restore speed gradually when light turns green and no obstacles
        if (vehicleSignal?.state === 'green' && !vehicleAhead) {
          vehicle.speed = Math.min(vehicle.desiredSpeed, vehicle.speed + 5 * deltaTime);
          if (vehicle.speed > 0) {
            vehicle.position += vehicle.speed * deltaTime;
          }
        }
      }
      
      // Ensure stopped vehicles don't move
      if (vehicle.speed === 0) {
        // Don't update position
      }
      
      // Update vehicle's X,Y coordinates based on current position and phase
      this.updateVehicleCoordinates(vehicle);
    }
  }

  setAlgorithm(algorithmType, params = {}) {
    this.algorithm = TrafficSignalAlgorithms.create(algorithmType, params);
    this.algorithmParams = params;
  }

  updateConfig(config) {
    this.config = { ...this.config, ...config };
    this.vehicleGenerator.updateConfig(this.config);
  }

  setTrafficInflow(inflowConfig) {
    this.vehicleGenerator.setAllLaneInflowLevels(inflowConfig);
  }

  updateCrossroad(crossroad) {
    
    // Use the crossroad as-is, including its signals
    this.crossroad = { 
      ...this.crossroad, 
      ...crossroad
    };
    
    // Ensure all signals have required properties
    if (this.crossroad.signals) {
      Object.keys(this.crossroad.signals).forEach(direction => {
        const signal = this.crossroad.signals[direction];
        if (signal && typeof signal === 'object') {
          // Handle both array of signals and single signal
          if (Array.isArray(signal)) {
            signal.forEach(s => {
              if (!s.state) s.state = 'red';
              if (!s.timeInState) s.timeInState = 0;
            });
          } else {
            if (!signal.state) signal.state = 'red';
            if (!signal.timeInState) signal.timeInState = 0;
          }
        }
      });
    }
    
    // Reinitialize vehicle generator with new crossroad
    this.vehicleGenerator = new VehicleGenerator(this.crossroad, this.config);
  }

  startRecording() {
    this.recording.enabled = true;
    this.recording.startTime = Date.now();
    this.recording.events = [];
  }

  stopRecording() {
    this.recording.enabled = false;
    return {
      sessionId: this.sessionId,
      startTime: this.recording.startTime,
      endTime: Date.now(),
      events: this.recording.events,
      crossroad: this.crossroad,
      config: this.config,
      algorithm: {
        type: this.algorithm?.type,
        params: this.algorithmParams
      }
    };
  }

  recordTick() {
    this.recording.events.push({
      time: this.simulationTime,
      signals: JSON.parse(JSON.stringify(this.crossroad.signals)),
      vehicleCount: this.vehicles.length,
      vehicles: this.vehicles.map(v => ({
        id: v.id,
        position: v.position,
        lane: v.lane.id,
        direction: v.direction
      }))
    });
  }

  getState() {
    return {
      sessionId: this.sessionId,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      simulationTime: this.simulationTime,
      crossroad: this.crossroad,
      config: this.config,
      algorithm: {
        type: this.algorithm?.type || 'none',
        params: this.algorithmParams
      },
      vehicleCount: this.vehicles.length,
      recording: {
        enabled: this.recording.enabled,
        eventCount: this.recording.events.length
      }
    };
  }

  loadState(state) {
    this.stop();
    this.simulationTime = state.simulationTime || 0;
    this.crossroad = state.crossroad;
    this.config = state.config;
    if (state.algorithm) {
      this.setAlgorithm(state.algorithm.type, state.algorithm.params);
    }
  }
}

module.exports = SimulationEngine;
