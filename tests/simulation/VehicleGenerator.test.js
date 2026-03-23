const VehicleGenerator = require('../../server/simulation/VehicleGenerator');

describe('VehicleGenerator', () => {
  let generator;
  let mockCrossroad;

  beforeEach(() => {
    mockCrossroad = {
      lanes: {
        north: {
          incoming: [
            { id: 'n1', type: 'straight', direction: 'north', length: 100 }
          ],
          outgoing: []
        },
        south: {
          incoming: [
            { id: 's1', type: 'straight', direction: 'south', length: 100 }
          ],
          outgoing: []
        },
        east: {
          incoming: [
            { id: 'e1', type: 'left', direction: 'east', length: 100 }
          ],
          outgoing: []
        },
        west: {
          incoming: [],
          outgoing: []
        }
      }
    };

    const config = {
      vehicleSpeed: 10
    };

    generator = new VehicleGenerator(mockCrossroad, config);
  });

  describe('setLaneInflowLevel', () => {
    it('should set inflow level for a lane', () => {
      generator.setLaneInflowLevel('n1', 'heavy');
      expect(generator.laneInflowLevels['n1']).toBe('heavy');
    });
  });

  describe('setAllLaneInflowLevels', () => {
    it('should set inflow levels for all lanes', () => {
      const inflowConfig = {
        'n1': 'heavy',
        's1': 'light',
        'e1': 'medium'
      };

      generator.setAllLaneInflowLevels(inflowConfig);

      expect(generator.laneInflowLevels).toEqual(inflowConfig);
    });
  });

  describe('generateVehicles', () => {
    it('should not generate vehicles when inflow is none', () => {
      generator.setLaneInflowLevel('n1', 'none');
      const vehicles = generator.generateVehicles(1);
      expect(vehicles).toEqual([]);
    });

    it('should generate vehicles with correct structure', () => {
      generator.setLaneInflowLevel('n1', 'heavy'); // High spawn rate
      
      // Try multiple times to get at least one vehicle
      let vehicles = [];
      for (let i = 0; i < 100 && vehicles.length === 0; i++) {
        vehicles = generator.generateVehicles(1);
      }

      expect(vehicles.length).toBeGreaterThan(0);
      
      const vehicle = vehicles[0];
      expect(vehicle).toHaveProperty('id');
      expect(vehicle).toHaveProperty('type');
      expect(vehicle).toHaveProperty('position');
      expect(vehicle).toHaveProperty('speed');
      expect(vehicle).toHaveProperty('lane');
      expect(vehicle).toHaveProperty('direction');
    });

    it('should only spawn vehicles on incoming lanes', () => {
      generator.setAllLaneInflowLevels({
        'n1': 'heavy',
        's1': 'heavy',
        'e1': 'heavy'
      });

      const vehicles = [];
      // Generate many vehicles
      for (let i = 0; i < 1000; i++) {
        vehicles.push(...generator.generateVehicles(1));
      }

      // Check that no vehicles spawned on west direction (no incoming lanes)
      const westVehicles = vehicles.filter(v => v.direction === 'west');
      expect(westVehicles).toHaveLength(0);
    });

    it('should generate different vehicle types', () => {
      generator.setLaneInflowLevel('n1', 'heavy');
      
      const vehicles = [];
      // Generate many vehicles to get variety
      for (let i = 0; i < 1000; i++) {
        vehicles.push(...generator.generateVehicles(1));
      }

      const types = new Set(vehicles.map(v => v.type));
      expect(types.size).toBeGreaterThan(1); // Should have multiple types
    });
  });

  describe('createVehicle', () => {
    it('should create vehicle with proper lane assignment', () => {
      const lane = mockCrossroad.lanes.north.incoming[0];
      const vehicle = generator.createVehicle(lane, 'north');

      expect(vehicle.lane.id).toBe('n1');
      expect(vehicle.direction).toBe('north');
      expect(vehicle.position).toBe(0); // Start at beginning of lane
    });

    it('should create vehicle with speed variation', () => {
      const lane = mockCrossroad.lanes.north.incoming[0];
      
      const speeds = [];
      for (let i = 0; i < 100; i++) {
        const vehicle = generator.createVehicle(lane, 'north');
        speeds.push(vehicle.speed);
      }

      // Check that speeds vary (not all identical)
      const uniqueSpeeds = new Set(speeds);
      expect(uniqueSpeeds.size).toBeGreaterThan(1);
    });

    it('should set target direction for straight lanes', () => {
      const lane = { id: 'n1', type: 'straight', direction: 'north', length: 100 };
      const vehicle = generator.createVehicle(lane, 'north');

      expect(vehicle.targetDirection).toBe('south'); // Opposite of north
    });

    it('should set target direction for left turn lanes', () => {
      const lane = { id: 'e1', type: 'left', direction: 'east', length: 100 };
      const vehicle = generator.createVehicle(lane, 'east');

      expect(vehicle.targetDirection).toBe('south'); // Left turn from east
    });

    it('should set target direction for right turn lanes', () => {
      const lane = { id: 'n1', type: 'right', direction: 'north', length: 100 };
      const vehicle = generator.createVehicle(lane, 'north');

      expect(vehicle.targetDirection).toBe('west'); // Right turn from north
    });
  });

  describe('selectVehicleType', () => {
    it('should return a valid vehicle type', () => {
      const validTypes = ['car', 'truck', 'bus', 'motorcycle'];
      
      for (let i = 0; i < 100; i++) {
        const type = generator.selectVehicleType();
        expect(validTypes).toContain(type);
      }
    });

    it('should generate cars most frequently', () => {
      const typeCounts = { car: 0, truck: 0, bus: 0, motorcycle: 0 };
      
      for (let i = 0; i < 10000; i++) {
        const type = generator.selectVehicleType();
        typeCounts[type]++;
      }

      // Cars should be most common (70% probability)
      expect(typeCounts.car).toBeGreaterThan(typeCounts.truck);
      expect(typeCounts.car).toBeGreaterThan(typeCounts.bus);
      expect(typeCounts.car).toBeGreaterThan(typeCounts.motorcycle);
    });
  });
});
