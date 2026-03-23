const { v4: uuidv4 } = require('uuid');

// Traffic inflow level configurations
const INFLOW_RATES = {
  none: 0,
  light: 0.03,   // Low probability of spawning (3% per tick)
  medium: 0.08,  // Medium probability of spawning (8% per tick)
  heavy: 0.18    // High probability of spawning (18% per tick)
};

class VehicleGenerator {
  constructor(crossroad, config) {
    this.crossroad = crossroad;
    this.config = config;
    this.vehicleTypes = ['car', 'truck', 'bus', 'motorcycle'];
    this.vehicleTypeProbabilities = [0.7, 0.15, 0.1, 0.05];
    this.laneInflowLevels = {}; // Store inflow level per lane
  }

  setLaneInflowLevel(laneId, level) {
    this.laneInflowLevels[laneId] = level;
  }

  setAllLaneInflowLevels(inflowConfig) {
    this.laneInflowLevels = { ...inflowConfig };
  }

  generateVehicles(deltaTime) {
    const newVehicles = [];
    const directions = ['north', 'south', 'east', 'west'];

    directions.forEach(direction => {
      // ONLY use incoming lanes for spawning vehicles
      const lanes = this.crossroad.lanes[direction]?.incoming || [];
      
      if (lanes.length === 0) {
        return; // Skip if no incoming lanes
      }
      
      lanes.forEach(lane => {
        // Double check this is an incoming lane (not outgoing)
        const isIncomingLane = this.crossroad.lanes[direction]?.incoming?.some(l => l.id === lane.id);
        if (!isIncomingLane) {
          return;
        }
        
        // Get inflow level for this lane (default to 'medium' if not set)
        const inflowLevel = this.laneInflowLevels[lane.id] || 'medium';
        const spawnRate = INFLOW_RATES[inflowLevel] || INFLOW_RATES.medium;
        
        // Skip if no inflow
        if (inflowLevel === 'none' || spawnRate === 0) {
          return;
        }
        
        // Probability-based spawning
        const spawnProbability = spawnRate * deltaTime;
        
        if (Math.random() < spawnProbability) {
          const vehicle = this.createVehicle(lane, direction);
          newVehicles.push(vehicle);
        }
      });
    });

    return newVehicles;
  }

  createVehicle(lane, direction) {
    const vehicleType = this.selectVehicleType();
    const speed = this.config.vehicleSpeed * (0.9 + Math.random() * 0.2); // ±10% variation

    // Determine target direction and outgoing lane based on lane type
    const OPPOSITE_DIRECTIONS = { north: 'south', south: 'north', east: 'west', west: 'east' };
    const LEFT_TURN_DIRECTIONS = { north: 'east', east: 'south', south: 'west', west: 'north' };
    const RIGHT_TURN_DIRECTIONS = { north: 'west', west: 'south', south: 'east', east: 'north' };
    
    let targetDirection = direction;
    if (lane.type === 'straight') {
      targetDirection = OPPOSITE_DIRECTIONS[direction];
    } else if (lane.type === 'left') {
      targetDirection = LEFT_TURN_DIRECTIONS[direction];
    } else if (lane.type === 'right') {
      targetDirection = RIGHT_TURN_DIRECTIONS[direction];
    }

    // Find first outgoing lane in target direction
    const outgoingLanes = this.crossroad.lanes[targetDirection]?.outgoing || [];
    const targetLane = outgoingLanes[0] || null;

    // Calculate spawn position at the start of the lane (furthest from intersection)
    const spawnCoords = { ...lane.startCoords };
    
    return {
      id: uuidv4(),
      type: vehicleType,
      lane: lane,
      direction: direction,
      position: 0, // meters from start of lane
      x: spawnCoords.x, // Current X coordinate in pixels
      y: spawnCoords.y, // Current Y coordinate in pixels
      speed: speed / 3.6, // Convert km/h to m/s
      desiredSpeed: speed / 3.6,
      acceleration: 0,
      createdAt: Date.now(),
      phase: 'incoming', // 'incoming', 'intersection', 'outgoing'
      targetDirection: targetDirection,
      targetLane: targetLane,
      laneType: lane.type,
      originalDirection: direction, // Store original incoming direction
      originalLane: lane // Store original incoming lane
    };
  }

  selectVehicleType() {
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < this.vehicleTypes.length; i++) {
      cumulative += this.vehicleTypeProbabilities[i];
      if (random < cumulative) {
        return this.vehicleTypes[i];
      }
    }

    return this.vehicleTypes[0];
  }

  updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
}

module.exports = VehicleGenerator;
