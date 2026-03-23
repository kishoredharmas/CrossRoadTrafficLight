const request = require('supertest');
const express = require('express');
const recordingRoutes = require('../../server/routes/recordingRoutes');
const { sequelize } = require('../../server/config/database');
const Recording = require('../../server/models/Recording');
const Session = require('../../server/models/Session');

const app = express();
app.use(express.json());
app.use('/api/recordings', recordingRoutes);

describe('Recording Routes', () => {
  let testSessionId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Recording.destroy({ where: {}, force: true });
    await Session.destroy({ where: {}, force: true });

    // Create a test session for recordings
    const session = await Session.create({
      name: 'Test Session',
      crossroadId: null,
      algorithm: 'fixed-time',
      configuration: {}
    });
    testSessionId = session.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/recordings', () => {
    it('should return empty array when no recordings exist', async () => {
      const response = await request(app).get('/api/recordings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all recordings', async () => {
      await Recording.create({
        name: 'Recording 1',
        sessionId: testSessionId,
        duration: 60,
        frames: [],
        statistics: {}
      });
      await Recording.create({
        name: 'Recording 2',
        sessionId: testSessionId,
        duration: 120,
        frames: [],
        statistics: {}
      });

      const response = await request(app).get('/api/recordings');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      const names = response.body.map(r => r.name).sort();
      expect(names).toContain('Recording 1');
      expect(names).toContain('Recording 2');
    });
  });

  describe('GET /api/recordings/:id', () => {
    it('should return a single recording', async () => {
      const created = await Recording.create({
        name: 'Test Recording',
        sessionId: testSessionId,
        duration: 60,
        frames: [{ time: 0, vehicles: [] }],
        statistics: { totalVehicles: 0 }
      });

      const response = await request(app).get(`/api/recordings/${created.id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Recording');
      expect(response.body.frames).toBeDefined();
    });

    it('should return 404 for non-existent recording', async () => {
      const response = await request(app).get('/api/recordings/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/recordings', () => {
    it('should create a new recording', async () => {
      const newRecording = {
        name: 'New Recording',
        sessionId: testSessionId,
        duration: 90,
        frames: [{ time: 0, vehicles: [] }],
        statistics: { totalVehicles: 0 }
      };

      const response = await request(app)
        .post('/api/recordings')
        .send(newRecording);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Recording');
      expect(response.body.id).toBeDefined();
    });

    it('should return 500 for missing required fields', async () => {
      const invalidRecording = {
        name: 'Invalid Recording'
        // Missing sessionId
      };

      const response = await request(app)
        .post('/api/recordings')
        .send(invalidRecording);

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/recordings/:id', () => {
    it('should delete a recording', async () => {
      const created = await Recording.create({
        name: 'To Delete',
        sessionId: testSessionId,
        duration: 60,
        frames: [],
        statistics: {}
      });

      const response = await request(app).delete(`/api/recordings/${created.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Recording deleted successfully');

      const checkDeleted = await Recording.findByPk(created.id);
      expect(checkDeleted).toBeNull();
    });

    it('should return 404 for non-existent recording', async () => {
      const response = await request(app).delete('/api/recordings/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/recordings/:id/replay', () => {
    it('should create a playback session', async () => {
      const created = await Recording.create({
        name: 'Recording to Replay',
        sessionId: testSessionId,
        duration: 60,
        frames: [{ time: 0, vehicles: [] }],
        statistics: {}
      });

      const response = await request(app).post(`/api/recordings/${created.id}/replay`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.recordingId).toBe(created.id);
    });

    it('should return 404 for non-existent recording', async () => {
      const response = await request(app).post('/api/recordings/non-existent-id/replay');

      expect(response.status).toBe(404);
    });
  });
});
