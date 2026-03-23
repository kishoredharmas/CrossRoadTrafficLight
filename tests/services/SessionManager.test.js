const SessionManager = require('../../server/services/SessionManager');
const Session = require('../../server/models/Session');
const { sequelize } = require('../../server/config/database');

describe('SessionManager', () => {
  let sessionManager;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    sessionManager = new SessionManager();
    // Clear sessions before each test
    await Session.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('createSession', () => {
    it('should create a session with valid data', async () => {
      const sessionData = {
        name: 'Test Session',
        crossroadId: null,
        algorithm: 'fixed-time',
        configuration: { cycleDuration: 60 }
      };

      const session = await sessionManager.createSession(sessionData);

      expect(session).toBeDefined();
      expect(session.name).toBe('Test Session');
      expect(session.crossroadId).toBeNull();
      expect(session.algorithm).toBe('fixed-time');
      expect(session.id).toBeDefined();
    });

    it('should use default name when name is missing', async () => {
      const sessionData = {
        crossroadId: null,
        algorithm: 'fixed-time'
      };

      const session = await sessionManager.createSession(sessionData);
      expect(session.name).toBe('New Session');
    });

    it('should create session with default values', async () => {
      const sessionData = {
        name: 'Minimal Session',
        crossroadId: null
      };

      const session = await sessionManager.createSession(sessionData);

      expect(session.algorithm).toBe('fixed-time');
      expect(session.configuration).toBeDefined();
    });
  });

  describe('listSessions', () => {
    it('should return empty array when no sessions exist', async () => {
      const sessions = await sessionManager.listSessions();
      expect(sessions).toEqual([]);
    });

    it('should return all sessions', async () => {
      await sessionManager.createSession({
        name: 'Session 1',
        crossroadId: null,
        algorithm: 'fixed-time'
      });
      await sessionManager.createSession({
        name: 'Session 2',
        crossroadId: null,
        algorithm: 'adaptive'
      });

      const sessions = await sessionManager.listSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions[0].name).toBe('Session 2'); // DESC order
      expect(sessions[1].name).toBe('Session 1');
    });
  });

  describe('getSession', () => {
    it('should return session by id', async () => {
      const created = await sessionManager.createSession({
        name: 'Get Test',
        crossroadId: null,
        algorithm: 'fixed-time'
      });

      const session = await sessionManager.getSession(created.id);

      expect(session).toBeDefined();
      expect(session.id).toBe(created.id);
      expect(session.name).toBe('Get Test');
    });

    it('should return null for non-existent session', async () => {
      const session = await sessionManager.getSession('non-existent-id');
      expect(session).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session data', async () => {
      const created = await sessionManager.createSession({
        name: 'Original Name',
        crossroadId: null,
        algorithm: 'fixed-time'
      });

      const updated = await sessionManager.updateSession(created.id, {
        name: 'Updated Name',
        algorithm: 'adaptive'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.algorithm).toBe('adaptive');
    });

    it('should return null for non-existent session', async () => {
      const result = await sessionManager.updateSession('non-existent-id', { name: 'New Name' });
      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session by id', async () => {
      const created = await sessionManager.createSession({
        name: 'To Delete',
        crossroadId: null,
        algorithm: 'fixed-time'
      });

      const result = await sessionManager.deleteSession(created.id);
      expect(result).toBe(true);

      const session = await sessionManager.getSession(created.id);
      expect(session).toBeNull();
    });

    it('should return false for non-existent session', async () => {
      const result = await sessionManager.deleteSession('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('duplicateSession', () => {
    it('should create a copy of existing session', async () => {
      const original = await sessionManager.createSession({
        name: 'Original Session',
        crossroadId: null,
        algorithm: 'fixed-time',
        config: { cycleDuration: 60 }
      });

      const duplicate = await sessionManager.duplicateSession(original.id);

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.name).toBe('Original Session (Copy)');
      expect(duplicate.crossroadId).toBe(original.crossroadId);
      expect(duplicate.algorithm).toBe(original.algorithm);
    });
  });
});
