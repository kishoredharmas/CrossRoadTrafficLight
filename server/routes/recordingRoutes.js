const express = require('express');
const router = express.Router();
const RecordingManager = require('../services/RecordingManager');

const recordingManager = new RecordingManager();

// Get all recordings
router.get('/', async (req, res) => {
  try {
    const recordings = await recordingManager.listRecordings();
    res.json(recordings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recording by ID
router.get('/:id', async (req, res) => {
  try {
    const recording = await recordingManager.getRecording(req.params.id);
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    res.json(recording);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save recording
router.post('/', async (req, res) => {
  try {
    const recording = await recordingManager.saveRecording(req.body);
    res.status(201).json(recording);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete recording
router.delete('/:id', async (req, res) => {
  try {
    const success = await recordingManager.deleteRecording(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    res.json({ message: 'Recording deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Replay recording
router.post('/:id/replay', async (req, res) => {
  try {
    const playbackSession = await recordingManager.createPlaybackSession(req.params.id);
    if (!playbackSession) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    res.json(playbackSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
