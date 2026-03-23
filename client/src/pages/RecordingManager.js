import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function RecordingManager() {
  const [recordings, setRecordings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const response = await axios.get('/api/recordings');
      setRecordings(response.data);
    } catch (error) {
    }
  };

  const handleDeleteRecording = async (id) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      try {
        await axios.delete(`/api/recordings/${id}`);
        loadRecordings();
      } catch (error) {
      }
    }
  };

  const handlePlayRecording = async (id) => {
    try {
      const response = await axios.post(`/api/recordings/${id}/replay`);
      // Navigate to playback session
      navigate(`/session/${response.data.id}`);
    } catch (error) {
    }
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">
          Recording Manager
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          View and playback simulation recordings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {recordings.map(recording => (
          <Grid item xs={12} sm={6} md={4} key={recording.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {recording.name}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${formatDuration(recording.duration)}`}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${recording.eventCount} events`}
                    size="small"
                    color="primary"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Session: {recording.sessionId?.substring(0, 8)}...
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created: {new Date(recording.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PlayIcon />}
                  onClick={() => handlePlayRecording(recording.id)}
                >
                  Play
                </Button>
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteRecording(recording.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {recordings.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Typography color="text.secondary">
            No recordings yet. Start a session and enable recording to save simulations.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

export default RecordingManager;
