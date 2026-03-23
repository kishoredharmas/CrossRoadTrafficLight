const RecordingManager = require('../../server/services/RecordingManager');
const Recording = require('../../server/models/Recording');
const Session = require('../../server/models/Session');
const { sequelize } = require('../../server/config/database');

describe('RecordingManager', () => {
  let recordingManager;
  let testSessionId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    recordingManager = new RecordingManager();
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

  describe('saveRecording', () => {
    it('should save a recording with valid data', async () => {
      const recordingData = {
        name: 'Test Recording',
        sessionId: testSessionId,
        duration: 120,
        frames: [
          { time: 0, vehicles: [], signals: [] },
          { time: 1, vehicles: [], signals: [] }
        ]
      };

      const recording = await recordingManager.saveRecording(recordingData);

      expect(recording).toBeDefined();
      expect(recording.name).toBe('Test Recording');
      expect(recording.sessionId).toBe(testSessionId);
      expect(recording.duration).toBe(120);
      expect(recording.id).toBeDefined();
    });

    it('should throw error with missing session id', async () => {
      const recordingData = {
        name: 'Invalid Recording',
        sessionId: 'non-existent-session-id',
        duration: 60,
        frames: []
      };

      await expect(recordingManager.saveRecording(recordingData))
        .rejects.toThrow();
    });
  });

  describe('listRecordings', () => {
    it('should return empty array when no recordings exist', async () => {
      const recordings = await recordingManager.listRecordings();
      expect(recordings).toEqual([]);
    });

    it('should return all recordings without frames data', async () => {
      await recordingManager.saveRecording({
        name: 'Recording 1',
        sessionId: testSessionId,
        duration: 60,
        frames: [{ time: 0, vehicles: [], signals: [] }]
      });
      await recordingManager.saveRecording({
        name: 'Recording 2',
        sessionId: testSessionId,
        duration: 120,
        frames: [{ time: 0, vehicles: [], signals: [] }]
      });

      const recordings = await recordingManager.listRecordings();

      expect(recordings).toHaveLength(2);
      expect(recordings[0].frames).toBeUndefined(); // Summary view excludes frames
    });
  });

  describe('getRecording', () => {
    it('should return recording by id with full frames data', async () => {
      const created = await recordingManager.saveRecording({
        name: 'Get Test',
        sessionId: testSessionId,
        duration: 60,
        frames: [
          { time: 0, vehicles: [], signals: [] },
          { time: 1, vehicles: [], signals: [] }
        ]
      });

      const recording = await recordingManager.getRecording(created.id);

      expect(recording).toBeDefined();
      expect(recording.id).toBe(created.id);
      expect(recording.name).toBe('Get Test');
      expect(recording.frames).toHaveLength(2);
    });

    it('should return null for non-existent recording', async () => {
      const recording = await recordingManager.getRecording('non-existent-id');
      expect(recording).toBeNull();
    });
  });

  describe('deleteRecording', () => {
    it('should delete recording by id', async () => {
      const created = await recordingManager.saveRecording({
        name: 'To Delete',
        sessionId: testSessionId,
        duration: 60,
        frames: [{ time: 0, vehicles: [], signals: [] }]
      });

      const result = await recordingManager.deleteRecording(created.id);
      expect(result).toBe(true);

      const recording = await recordingManager.getRecording(created.id);
      expect(recording).toBeNull();
    });

    it('should return false for non-existent recording', async () => {
      const result = await recordingManager.deleteRecording('non-existent-id');
      expect(result).toBe(false);
    });
  });
});
