const request = require('supertest');
const express = require('express');
const crossroadRoutes = require('../../server/routes/crossroadRoutes');
const { sequelize } = require('../../server/config/database');
const Crossroad = require('../../server/models/Crossroad');

const app = express();
app.use(express.json());
app.use('/api/crossroads', crossroadRoutes);

describe('Crossroad Routes', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Crossroad.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const validLanes = {
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
  };

  describe('GET /api/crossroads', () => {
    it('should return empty array when no crossroads exist', async () => {
      const response = await request(app).get('/api/crossroads');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all crossroads', async () => {
      await Crossroad.create({
        name: 'Crossroad 1',
        lanes: validLanes
      });
      await Crossroad.create({
        name: 'Crossroad 2',
        lanes: validLanes
      });

      const response = await request(app).get('/api/crossroads');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      const names = response.body.map(c => c.name).sort();
      expect(names).toContain('Crossroad 1');
      expect(names).toContain('Crossroad 2');
    });
  });

  describe('GET /api/crossroads/:id', () => {
    it('should return a single crossroad with enriched coordinates', async () => {
      const created = await Crossroad.create({
        name: 'Test Crossroad',
        lanes: validLanes
      });

      const response = await request(app).get(`/api/crossroads/${created.id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Crossroad');
      expect(response.body.lanes).toBeDefined();
      // Check that coordinates were enriched
      expect(response.body.lanes.north.incoming[0].startCoords).toBeDefined();
      expect(response.body.lanes.north.incoming[0].endCoords).toBeDefined();
    });

    it('should return 404 for non-existent crossroad', async () => {
      const response = await request(app).get('/api/crossroads/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/crossroads', () => {
    it('should create a new crossroad', async () => {
      const newCrossroad = {
        name: 'New Crossroad',
        description: 'Test description',
        lanes: validLanes
      };

      const response = await request(app)
        .post('/api/crossroads')
        .send(newCrossroad);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Crossroad');
      expect(response.body.id).toBeDefined();
    });

    it('should return 500 for invalid crossroad data', async () => {
      const invalidCrossroad = {
        name: 'Invalid',
        lanes: { north: { incoming: [] } } // Missing required directions
      };

      const response = await request(app)
        .post('/api/crossroads')
        .send(invalidCrossroad);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/crossroads/:id', () => {
    it('should update a crossroad', async () => {
      const created = await Crossroad.create({
        name: 'Original Name',
        lanes: validLanes
      });

      const response = await request(app)
        .put(`/api/crossroads/${created.id}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent crossroad', async () => {
      const response = await request(app)
        .put('/api/crossroads/non-existent-id')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/crossroads/:id', () => {
    it('should delete a crossroad', async () => {
      const created = await Crossroad.create({
        name: 'To Delete',
        lanes: validLanes
      });

      const response = await request(app).delete(`/api/crossroads/${created.id}`);

      expect(response.status).toBe(200);

      const checkDeleted = await Crossroad.findByPk(created.id);
      expect(checkDeleted).toBeNull();
    });

    it('should return 404 for non-existent crossroad', async () => {
      const response = await request(app).delete('/api/crossroads/non-existent-id');

      expect(response.status).toBe(404);
    });
  });
});
