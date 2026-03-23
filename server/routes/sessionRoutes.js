const express = require('express');
const router = express.Router();
const SessionManager = require('../services/SessionManager');

const sessionManager = new SessionManager();

// Get all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await sessionManager.listSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await sessionManager.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new session
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ error: 'Session name is required' });
    }
    
    const session = await sessionManager.createSession(req.body);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    if (error.code === 'DUPLICATE_NAME') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update session
router.put('/:id', async (req, res) => {
  try {
    const session = await sessionManager.updateSession(req.params.id, req.body);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    if (error.code === 'DUPLICATE_NAME') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete session
router.delete('/:id', async (req, res) => {
  try {
    const success = await sessionManager.deleteSession(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicate session
router.post('/:id/duplicate', async (req, res) => {
  try {
    const newSession = await sessionManager.duplicateSession(req.params.id);
    if (!newSession) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
