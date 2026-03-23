const CrossroadManager = require('../../server/services/CrossroadManager');
const Crossroad = require('../../server/models/Crossroad');
const { sequelize } = require('../../server/config/database');

describe('CrossroadManager', () => {
  let crossroadManager;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    crossroadManager = new CrossroadManager();
    await Crossroad.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('createCrossroad', () => {
    it('should create a crossroad with valid data', async () => {
      const crossroadData = {
        name: 'Test Crossroad',
        lanes: {
          north: {
            incoming: [{ id: 'N1', direction: 'north', length: 100, type: 'straight' }],
            outgoing: [{ id: 'N2', direction: 'north', length: 100, type: 'straight' }]
          },
          south: {
            incoming: [{ id: 'S1', direction: 'south', length: 100, type: 'straight' }],
            outgoing: []
          },
          east: {
            incoming: [{ id: 'E1', direction: 'east', length: 100, type: 'straight' }],
            outgoing: []
          },
          west: {
            incoming: [],
            outgoing: []
          }
        },
        signals: {
          north: [{ id: 's1', laneId: 'N1', state: 'red', timeInState: 0 }]
        }
      };

      const crossroad = await crossroadManager.createCrossroad(crossroadData);

      expect(crossroad).toBeDefined();
      expect(crossroad.name).toBe('Test Crossroad');
      expect(crossroad.lanes.north.incoming).toHaveLength(1);
      expect(crossroad.signals.north).toHaveLength(1);
    });

    it('should use default values when not provided', async () => {
      const crossroadData = {
        name: 'Minimal Crossroad'
      };

      const crossroad = await crossroadManager.createCrossroad(crossroadData);
      
      expect(crossroad.name).toBe('Minimal Crossroad');
      expect(crossroad.lanes).toBeDefined();
      expect(crossroad.lanes.north).toBeDefined();
    });
  });

  describe('listCrossroads', () => {
    it('should return empty array when no crossroads exist', async () => {
      const crossroads = await crossroadManager.listCrossroads();
      expect(crossroads).toEqual([]);
    });

    it('should return all crossroads', async () => {
      await crossroadManager.createCrossroad({
        name: 'Crossroad 1'
      });
      await crossroadManager.createCrossroad({
        name: 'Crossroad 2'
      });

      const crossroads = await crossroadManager.listCrossroads();

      expect(crossroads).toHaveLength(2);
    });
  });

  describe('getCrossroad', () => {
    it('should return crossroad by id', async () => {
      const created = await crossroadManager.createCrossroad({
        name: 'Get Test'
      });

      const crossroad = await crossroadManager.getCrossroad(created.id);

      expect(crossroad).toBeDefined();
      expect(crossroad.id).toBe(created.id);
      expect(crossroad.name).toBe('Get Test');
    });

    it('should return null for non-existent crossroad', async () => {
      const crossroad = await crossroadManager.getCrossroad('non-existent-id');
      expect(crossroad).toBeNull();
    });
  });

  describe('updateCrossroad', () => {
    it('should update crossroad data', async () => {
      const created = await crossroadManager.createCrossroad({
        name: 'Original Name'
      });

      const updated = await crossroadManager.updateCrossroad(created.id, {
        name: 'Updated Name'
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should return null for non-existent crossroad', async () => {
      const result = await crossroadManager.updateCrossroad('non-existent-id', { name: 'New Name' });
      expect(result).toBeNull();
    });
  });

  describe('deleteCrossroad', () => {
    it('should delete crossroad by id', async () => {
      const created = await crossroadManager.createCrossroad({
        name: 'To Delete'
      });

      const result = await crossroadManager.deleteCrossroad(created.id);
      expect(result).toBe(true);

      const crossroad = await crossroadManager.getCrossroad(created.id);
      expect(crossroad).toBeNull();
    });

    it('should return false for non-existent crossroad', async () => {
      const result = await crossroadManager.deleteCrossroad('non-existent-id');
      expect(result).toBe(false);
    });
  });
});
