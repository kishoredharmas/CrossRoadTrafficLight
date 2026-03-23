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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SessionManager() {
  const [sessions, setSessions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [selectedCrossroadId, setSelectedCrossroadId] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('fixed-time');
  const [crossroads, setCrossroads] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
    loadCrossroads();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axios.get('/api/sessions');
      setSessions(response.data);
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

  const handleCreateSession = async () => {
    try {
      const response = await axios.post('/api/sessions', {
        name: newSessionName || 'New Session',
        description: newSessionDescription,
        crossroadId: selectedCrossroadId || null,
        algorithm: selectedAlgorithm
      });
      setOpenDialog(false);
      setNewSessionName('');
      setNewSessionDescription('');
      setSelectedCrossroadId('');
      setSelectedAlgorithm('fixed-time');
      navigate(`/session/${response.data.id}`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Error creating session';
      alert(errorMessage);
      // Keep dialog open if duplicate name error
      if (!error.response?.data?.error?.includes('already exists')) {
        setOpenDialog(false);
      }
    }
  };

  const handleDeleteSession = async (id) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await axios.delete(`/api/sessions/${id}`);
        loadSessions();
      } catch (error) {
      }
    }
  };

  const handleDuplicateSession = async (id) => {
    try {
      await axios.post(`/api/sessions/${id}/duplicate`);
      loadSessions();
    } catch (error) {
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Session Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Session
        </Button>
      </Box>

      <Grid container spacing={3}>
        {sessions.map(session => (
          <Grid item xs={12} sm={6} md={4} key={session.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {session.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {session.description || 'No description'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created: {new Date(session.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Updated: {new Date(session.updatedAt).toLocaleDateString()}
                </Typography>
                {session.algorithm && (
                  <Typography variant="caption" color="primary" display="block" sx={{ mt: 1 }}>
                    Algorithm: {session.algorithm.type}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(`/session/${session.id}`)}
                >
                  Open
                </Button>
                <IconButton
                  size="small"
                  onClick={() => handleDuplicateSession(session.id)}
                >
                  <DuplicateIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteSession(session.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {sessions.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Typography color="text.secondary" gutterBottom>
            No sessions yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ mt: 2 }}
          >
            Create Your First Session
          </Button>
        </Paper>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Session Name"
            fullWidth
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
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
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateSession} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SessionManager;
