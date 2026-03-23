const request = require('supertest');
const express = require('express');
const sessionRoutes = require('../../server/routes/sessionRoutes');
const { sequelize } = require('../../server/config/database');
const Session = require('../../server/models/Session');

describe('Session Routes', () => {
  let app;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Create express app
    app = express();
    app.use(express.json());
    app.use('/api/sessions', sessionRoutes);
    
    // Clear sessions before each test
    await Session.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/sessions', () => {
    it('should return empty array when no sessions exist', async () => {
      const response = await request(app).get('/api/sessions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all sessions', async () => {
      await Session.create({
        name: 'Session 1',
        crossroadId: null,
        algorithm: 'fixed-time',
        config: {}
      });
      await Session.create({
        name: 'Session 2',
        crossroadId: null,
        algorithm: 'adaptive',
        config: {}
      });

      const response = await request(app).get('/api/sessions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return a single session', async () => {
      const created = await Session.create({
        name: 'Test Session',
        crossroadId: null,
        algorithm: 'fixed-time',
        config: {}
      });

      const response = await request(app).get(`/api/sessions/${created.id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Session');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app).get('/api/sessions/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const newSession = {
        name: 'New Session',
        crossroadId: null,
        algorithm: 'fixed-time',
        config: {}
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(newSession);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Session');
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for missing name', async () => {
      const invalidSession = {
        crossroadId: null,
        algorithm: 'fixed-time'
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(invalidSession);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/sessions/:id', () => {
    it('should update a session', async () => {
      const created = await Session.create({
        name: 'Original Name',
        crossroadId: null,
        algorithm: 'fixed-time',
        config: {}
      });

      const updates = { name: 'Updated Name' };

      const response = await request(app)
        .put(`/api/sessions/${created.id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .put('/api/sessions/non-existent-id')
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    it('should delete a session', async () => {
      const created = await Session.create({
        name: 'To Delete',
        crossroadId: null,
        algorithm: 'fixed-time',
        config: {}
      });

      const response = await request(app).delete(`/api/sessions/${created.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app).delete('/api/sessions/non-existent-id');

      expect(response.status).toBe(404);
    });
  });
});
