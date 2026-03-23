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
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [selectedCrossroadId, setSelectedCrossroadId] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('fixed-time');
  const [crossroads, setCrossroads] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
    loadRecordings();
    loadCrossroads();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axios.get('/api/sessions');
      setSessions(response.data.slice(0, 3)); // Show only first 3
    } catch (error) {
    }
  };

  const loadRecordings = async () => {
    try {
      const response = await axios.get('/api/recordings');
      setRecordings(response.data.slice(0, 3)); // Show only first 3
    } catch (error) {
    }
  };

  const loadCrossroads = async () => {
    try {
      const response = await axios.get('/api/crossroads');
      setCrossroads(response.data);
    } catch (error) {
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setNewSessionName('');
    setNewSessionDescription('');
    setSelectedCrossroadId('');
    setSelectedAlgorithm('fixed-time');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewSessionName('');
    setNewSessionDescription('');
    setSelectedCrossroadId('');
    setSelectedAlgorithm('fixed-time');
  };

  const createNewSession = async () => {
    if (!newSessionName.trim()) {
      return;
    }

    try {
      const response = await axios.post('/api/sessions', {
        name: newSessionName,
        description: newSessionDescription,
        crossroadId: selectedCrossroadId || null,
        algorithm: selectedAlgorithm
      });
      handleCloseDialog();
      navigate(`/session/${response.data.id}`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Error creating session';
      alert(errorMessage);
      // Keep dialog open if duplicate name error
      if (!error.response?.data?.error?.includes('already exists')) {
        handleCloseDialog();
      }
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Traffic Light Simulation Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Design, simulate, and optimize traffic signal algorithms
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
              >
                New Session
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/designer')}
              >
                Design Crossroad
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/recordings')}
              >
                View Recordings
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Sessions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Recent Sessions</Typography>
              <Button size="small" onClick={() => navigate('/sessions')}>
                View All
              </Button>
            </Box>
            {sessions.length === 0 ? (
              <Typography color="text.secondary">No sessions yet</Typography>
            ) : (
              sessions.map(session => (
                <Card key={session.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{session.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {session.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(session.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/session/${session.id}`)}>
                      Open
                    </Button>
                  </CardActions>
                </Card>
              ))
            )}
          </Paper>
        </Grid>

        {/* Recent Recordings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Recent Recordings</Typography>
              <Button size="small" onClick={() => navigate('/recordings')}>
                View All
              </Button>
            </Box>
            {recordings.length === 0 ? (
              <Typography color="text.secondary">No recordings yet</Typography>
            ) : (
              recordings.map(recording => (
                <Card key={recording.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{recording.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {Math.round(recording.duration / 1000)}s
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {recording.eventCount} events
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">Play</Button>
                    <Button size="small">Details</Button>
                  </CardActions>
                </Card>
              ))
            )}
          </Paper>
        </Grid>

        {/* Features Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Features
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    Design
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create custom crossroad layouts with multiple lanes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    Simulate
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Test traffic patterns with real-time visualization
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    Algorithms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Apply fixed-time, adaptive, and ML-based algorithms
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    Analyze
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Record and playback sessions for optimization
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Create Session Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Session Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newSessionName.trim()) {
                createNewSession();
              }
            }}
            sx={{ mb: 2, mt: 1 }}
            required
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newSessionDescription}
            onChange={(e) => setNewSessionDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Crossroad Design</InputLabel>
            <Select
              value={selectedCrossroadId}
              onChange={(e) => setSelectedCrossroadId(e.target.value)}
              label="Crossroad Design"
            >
              <MenuItem value="">
                <em>None (Create later)</em>
              </MenuItem>
              {crossroads.map((crossroad) => (
                <MenuItem key={crossroad.id} value={crossroad.id}>
                  {crossroad.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Traffic Signal Algorithm</InputLabel>
            <Select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              label="Traffic Signal Algorithm"
            >
              <MenuItem value="fixed-time">Fixed-Time</MenuItem>
              <MenuItem value="adaptive">Adaptive</MenuItem>
              <MenuItem value="actuated">Actuated</MenuItem>
              <MenuItem value="coordinated">Coordinated</MenuItem>
              <MenuItem value="ml-based">ML-Based</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={createNewSession} 
            variant="contained"
            disabled={!newSessionName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Dashboard;
