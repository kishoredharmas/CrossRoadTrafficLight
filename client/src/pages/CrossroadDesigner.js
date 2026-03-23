import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Traffic as SignalIcon,
  ArrowDownward,
  Info as InfoIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import axios from 'axios';
import VisualDesignerCanvas from '../components/Designer/VisualDesignerCanvas';
import CrossroadMapPicker from '../components/Map/CrossroadMapPicker';

// Constants
const LANE_LENGTH_METERS = 500;
const OPPOSITE_DIRECTIONS = { north: 'south', south: 'north', east: 'west', west: 'east' };
const LEFT_TURN_DIRECTIONS = { north: 'east', east: 'south', south: 'west', west: 'north' };
const RIGHT_TURN_DIRECTIONS = { north: 'west', west: 'south', south: 'east', east: 'north' };

const getTargetDirection = (direction, laneType) => {
  if (laneType === 'straight') return OPPOSITE_DIRECTIONS[direction];
  if (laneType === 'left') return LEFT_TURN_DIRECTIONS[direction];
  if (laneType === 'right') return RIGHT_TURN_DIRECTIONS[direction];
  return direction;
};

// Helper function to calculate required outgoing lanes for each direction
const calculateRequiredOutgoingLanes = (lanes) => {
  const requiredOutgoing = {
    north: 0,
    south: 0,
    east: 0,
    west: 0
  };

  // For each target direction, count incoming lanes from each source direction
  ['north', 'south', 'east', 'west'].forEach(targetDir => {
    const incomingBySource = {
      north: 0,
      south: 0,
      east: 0,
      west: 0
    };

    // Count incoming lanes from each direction that go to this target direction
    ['north', 'south', 'east', 'west'].forEach(sourceDir => {
      const incomingLanes = lanes[sourceDir]?.incoming || [];
      incomingLanes.forEach(lane => {
        const laneTargetDir = getTargetDirection(sourceDir, lane.type);
        if (laneTargetDir === targetDir) {
          incomingBySource[sourceDir]++;
        }
      });
    });

    // Take the maximum from any single source direction
    requiredOutgoing[targetDir] = Math.max(...Object.values(incomingBySource));
  });

  return requiredOutgoing;
};

// Helper function to regenerate outgoing lanes for a direction
const regenerateOutgoingLanes = (lanes, targetDirection) => {
  const required = calculateRequiredOutgoingLanes(lanes);
  const requiredCount = required[targetDirection];
  const existingOutgoing = lanes[targetDirection]?.outgoing || [];
  const currentCount = existingOutgoing.length;

  let newOutgoing = [...existingOutgoing];

  if (requiredCount > currentCount) {
    // Add more outgoing lanes
    for (let i = currentCount; i < requiredCount; i++) {
      const prefix = targetDirection.charAt(0).toUpperCase();
      const existingLanes = [
        ...(lanes[targetDirection]?.incoming || []),
        ...newOutgoing
      ];
      const existingNumbers = existingLanes
        .map(lane => {
          const match = lane.id.match(new RegExp(`^${prefix}(\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0);
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      const newLaneId = `${prefix}${nextNumber}`;
      
      newOutgoing.push({
        id: newLaneId,
        type: 'straight',
        direction: targetDirection,
        length: LANE_LENGTH_METERS,
        pairId: null
      });
    }
  } else if (requiredCount < currentCount) {
    // Remove excess outgoing lanes (from the end)
    newOutgoing = newOutgoing.slice(0, requiredCount);
  }

  return newOutgoing;
};

function CrossroadDesigner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedObject, setSelectedObject] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState(null);
  const [savedCrossroads, setSavedCrossroads] = useState([]);
  const [selectedCrossroadId, setSelectedCrossroadId] = useState(id || 'new');
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [crossroad, setCrossroad] = useState({
    name: 'New Crossroad',
    description: '',
    location: { lat: 40.7128, lng: -74.0060 },
    mapProvider: 'openstreetmap',
    lanes: {
      north: { incoming: [], outgoing: [] },
      south: { incoming: [], outgoing: [] },
      east: { incoming: [], outgoing: [] },
      west: { incoming: [], outgoing: [] }
    },
    signals: {}
  });

  useEffect(() => {
    loadSavedCrossroads();
  }, []);

  useEffect(() => {
    if (id) {
      loadCrossroad(id);
    } else {
      // No ID means new design
      setSelectedCrossroadId('new');
    }
  }, [id]);

  const loadSavedCrossroads = async () => {
    try {
      const response = await axios.get('/api/crossroads');
      setSavedCrossroads(response.data);
    } catch (error) {
    }
  };

  const loadCrossroad = async (crossroadId) => {
    try {
      const response = await axios.get(`/api/crossroads/${crossroadId}`);
      setCrossroad(response.data);
      setSelectedCrossroadId(crossroadId);
    } catch (error) {
    }
  };

  const handleCrossroadSelect = (event) => {
    const crossroadId = event.target.value;
    if (crossroadId === 'new') {
      // Create new crossroad
      setSelectedCrossroadId('new');
      setCrossroad({
        name: 'New Crossroad',
        description: '',
        location: { lat: 40.7128, lng: -74.0060 },
        mapProvider: 'openstreetmap',
        lanes: {
          north: { incoming: [], outgoing: [] },
          south: { incoming: [], outgoing: [] },
          east: { incoming: [], outgoing: [] },
          west: { incoming: [], outgoing: [] }
        },
        signals: {}
      });
      navigate('/designer');
    } else if (crossroadId) {
      // Load existing crossroad
      loadCrossroad(crossroadId);
      navigate(`/designer/${crossroadId}`);
    }
  };

  const handleSave = () => {
    if (selectedCrossroadId && selectedCrossroadId !== 'new') {
      // Existing design - save directly
      performSave();
    } else {
      // New design - ask for name
      setSaveName(crossroad.name || '');
      setSaveDialogOpen(true);
    }
  };

  const performSave = async () => {
    try {
      const dataToSave = { ...crossroad };
      
      // Update name if provided from dialog
      if (saveName && (!selectedCrossroadId || selectedCrossroadId === 'new')) {
        dataToSave.name = saveName;
      }

      if (selectedCrossroadId && selectedCrossroadId !== 'new') {
        // Update existing crossroad
        await axios.put(`/api/crossroads/${selectedCrossroadId}`, dataToSave);
        alert('Crossroad updated successfully!');
        await loadSavedCrossroads(); // Refresh the list
      } else {
        // Create new crossroad
        const response = await axios.post('/api/crossroads', dataToSave);
        alert('Crossroad saved successfully!');
        setSelectedCrossroadId(response.data.id);
        await loadSavedCrossroads(); // Refresh the list
        navigate(`/designer/${response.data.id}`);
      }
      
      setSaveDialogOpen(false);
      setSaveName('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Error saving crossroad';
      alert(errorMessage);
      // Keep dialog open if duplicate name error
      if (!error.response?.data?.error?.includes('already exists')) {
        setSaveDialogOpen(false);
      }
    }
  };

  const handleSaveDialogClose = () => {
    setSaveDialogOpen(false);
    setSaveName('');
  };

  const handleDeleteClick = () => {
    if (selectedCrossroadId && selectedCrossroadId !== 'new') {
      setDesignToDelete({
        id: selectedCrossroadId,
        name: crossroad.name
      });
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!designToDelete) return;

    try {
      await axios.delete(`/api/crossroads/${designToDelete.id}`);
      
      // Reload the crossroads list
      await loadSavedCrossroads();
      
      // Reset to new design
      setSelectedCrossroadId('new');
      setCrossroad({
        name: 'New Crossroad',
        description: '',
        location: { lat: 40.7128, lng: -74.0060 },
        mapProvider: 'openstreetmap',
        lanes: {
          north: { incoming: [], outgoing: [] },
          south: { incoming: [], outgoing: [] },
          east: { incoming: [], outgoing: [] },
          west: { incoming: [], outgoing: [] }
        },
        signals: {}
      });
      navigate('/designer');
      
      alert('Crossroad deleted successfully!');
    } catch (error) {
      alert('Error deleting crossroad');
    } finally {
      setDeleteDialogOpen(false);
      setDesignToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDesignToDelete(null);
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handlePropertyChange = (property, value) => {
    if (!selectedObject) return;

    // Update the specific lane property
    const direction = selectedObject.direction;
    const laneType = selectedObject.type === 'incoming-lane' ? 'incoming' : 'outgoing';
    const lanes = crossroad.lanes[direction][laneType];
    
    const updatedLanesArray = lanes.map(lane => {
      if (lane.id === selectedObject.laneId) {
        return { ...lane, [property]: value };
      }
      return lane;
    });

    let updatedLanesObj = {
      ...crossroad.lanes,
      [direction]: {
        ...crossroad.lanes[direction],
        [laneType]: updatedLanesArray
      }
    };

    // If lane type changed and this is an incoming lane, regenerate outgoing lanes
    if (property === 'type' && laneType === 'incoming') {
      const oldLaneType = lanes.find(lane => lane.id === selectedObject.laneId)?.type || 'straight';
      
      // Determine old and new target directions
      const oldTargetDirection = getTargetDirection(direction, oldLaneType);
      const newTargetDirection = getTargetDirection(direction, value);

      // Regenerate outgoing lanes for both old and new target directions
      if (oldTargetDirection !== newTargetDirection) {
        const newOldOutgoing = regenerateOutgoingLanes(updatedLanesObj, oldTargetDirection);
        updatedLanesObj = {
          ...updatedLanesObj,
          [oldTargetDirection]: {
            ...updatedLanesObj[oldTargetDirection],
            outgoing: newOldOutgoing
          }
        };
      }

      const newOutgoing = regenerateOutgoingLanes(updatedLanesObj, newTargetDirection);
      updatedLanesObj = {
        ...updatedLanesObj,
        [newTargetDirection]: {
          ...updatedLanesObj[newTargetDirection],
          outgoing: newOutgoing
        }
      };
    }

    const updatedCrossroad = {
      ...crossroad,
      lanes: updatedLanesObj
    };

    setCrossroad(updatedCrossroad);

    // Update the selected object to reflect the change
    const updatedLane = updatedLanesObj[direction][laneType].find(lane => lane.id === selectedObject.laneId);
    if (updatedLane) {
      setSelectedObject({
        ...selectedObject,
        laneType: updatedLane.type,
        length: updatedLane.length
      });
    }
  };

  const handleMapPickerConfirm = ({ lanes, signals, location, name }) => {
    setCrossroad(prev => ({
      ...prev,
      lanes,
      signals,
      location,
      // Only overwrite name if this is a new / unnamed design
      name: (!prev.name || prev.name === 'New Crossroad') ? name : prev.name,
    }));
    setMapPickerOpen(false);
  };

  const handleDeleteSelected = () => {
    if (!selectedObject) return;

    // Handle signal deletion - now signals are auto-generated with lanes
    if (selectedObject.type === 'signal') {
      alert('Traffic signals cannot be deleted directly. Delete the incoming lane to remove its signal.');
      return;
    }

    // Handle lane deletion
    const direction = selectedObject.direction;
    const laneType = selectedObject.type === 'incoming-lane' ? 'incoming' : 'outgoing';
    const lanes = crossroad.lanes[direction][laneType];
    
    const updatedLanes = lanes.filter(lane => lane.id !== selectedObject.laneId);
    
    // Remove associated signal if deleting an incoming lane
    let updatedSignals = { ...crossroad.signals };
    if (laneType === 'incoming') {
      const directionSignals = updatedSignals[direction] || [];
      if (Array.isArray(directionSignals)) {
        updatedSignals[direction] = directionSignals.filter(s => s.laneId !== selectedObject.laneId);
      }
    }

    let updatedLanesObj = {
      ...crossroad.lanes,
      [direction]: {
        ...crossroad.lanes[direction],
        [laneType]: updatedLanes
      }
    };

    // If deleting an incoming lane, regenerate outgoing lanes for the target direction
    if (laneType === 'incoming') {
      const deletedLane = lanes.find(lane => lane.id === selectedObject.laneId);
      const deletedLaneType = deletedLane?.type || 'straight';
      
      // Determine target direction
      const targetDirection = getTargetDirection(direction, deletedLaneType);
      
      // Regenerate outgoing lanes for the target direction
      const newOutgoing = regenerateOutgoingLanes(updatedLanesObj, targetDirection);
      updatedLanesObj = {
        ...updatedLanesObj,
        [targetDirection]: {
          ...updatedLanesObj[targetDirection],
          outgoing: newOutgoing
        }
      };
    }

    const updatedCrossroad = {
      ...crossroad,
      lanes: updatedLanesObj,
      signals: updatedSignals
    };

    setCrossroad(updatedCrossroad);
    setSelectedObject(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Visual Crossroad Designer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drag objects from the toolbox onto the canvas to design your intersection
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<MapIcon />}
              onClick={() => setMapPickerOpen(true)}
              size="large"
            >
              Import from Map
            </Button>
            {selectedCrossroadId && selectedCrossroadId !== 'new' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
                size="large"
              >
                Delete
              </Button>
            )}
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              size="large"
            >
              Save Design
            </Button>
          </Box>
        </Box>

        {/* Design Selector */}
        <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="crossroad-select-label">Select Design</InputLabel>
                <Select
                  labelId="crossroad-select-label"
                  value={selectedCrossroadId}
                  onChange={handleCrossroadSelect}
                  label="Select Design"
                >
                  <MenuItem value="new">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AddIcon fontSize="small" />
                      Create New Design
                    </Box>
                  </MenuItem>
                  {savedCrossroads.length > 0 && <Divider />}
                  {savedCrossroads.map((design) => (
                    <MenuItem key={design.id} value={design.id}>
                      <Box>
                        <Typography variant="body1">{design.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {design.description || 'No description'} • 
                          {new Date(design.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {selectedCrossroadId && selectedCrossroadId !== 'new' && (
                  <Chip 
                    label={`Editing: ${crossroad.name}`} 
                    color="primary" 
                    variant="outlined"
                  />
                )}
                {(!selectedCrossroadId || selectedCrossroadId === 'new') && (
                  <Chip 
                    label="New Design" 
                    color="success" 
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Grid container spacing={2}>
        {/* Left Panel - Toolbox */}
        <Grid item xs={12} md={1}>
          <Paper sx={{ 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            height: '100%'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              writingMode: { xs: 'horizontal-tb', md: 'vertical-rl' },
              transform: { xs: 'none', md: 'rotate(180deg)' },
              mb: 2
            }}>
              <InfoIcon fontSize="small" color="primary" />
              Toolbox
            </Typography>

            <Box
              draggable
              onDragStart={(e) => handleDragStart(e, { type: 'incoming-lane', laneType: 'straight' })}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                border: '2px dashed #2196f3',
                borderRadius: 2,
                cursor: 'grab',
                '&:active': { cursor: 'grabbing' },
                backgroundColor: '#e3f2fd',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: '#bbdefb',
                  transform: 'scale(1.05)',
                  boxShadow: 2
                },
                mb: 2
              }}
            >
              <ArrowDownward sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: 'primary.main',
                textAlign: 'center',
                mt: 0.5
              }}>
                Lane
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ 
              textAlign: 'center',
              display: 'block',
              mb: 2
            }}>
              💡 Drag to add lane
            </Typography>

            <Divider sx={{ my: 2, width: '100%' }} />

            <Typography variant="caption" gutterBottom sx={{ 
              textAlign: 'center',
              fontWeight: 'bold',
              writingMode: { xs: 'horizontal-tb', md: 'vertical-rl' },
              transform: { xs: 'none', md: 'rotate(180deg)' }
            }}>
              Info
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', mt: 1 }}>
              {['north', 'south', 'east', 'west'].map(dir => {
                const incoming = crossroad.lanes[dir]?.incoming?.length || 0;
                const outgoing = crossroad.lanes[dir]?.outgoing?.length || 0;
                return (
                  <Box key={dir} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ 
                      textTransform: 'capitalize',
                      fontWeight: 'bold',
                      fontSize: '0.65rem'
                    }}>
                      {dir.charAt(0).toUpperCase()}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Chip label={incoming} size="small" color="primary" sx={{ minWidth: 28, height: 20, fontSize: '0.65rem' }} />
                      <Chip label={outgoing} size="small" color="success" sx={{ minWidth: 28, height: 20, fontSize: '0.65rem' }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Center Panel - Canvas - Full Width */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>How to use:</strong> Drag items from the toolbox and drop them onto the canvas. 
              Click on objects to select and edit their properties in the right panel.
            </Alert>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              overflow: 'auto',
              maxHeight: '80vh',
              border: '1px solid #e0e0e0',
              borderRadius: 1
            }}>
              <VisualDesignerCanvas 
                crossroad={crossroad}
                onCrossroadChange={setCrossroad}
                onSelectObject={setSelectedObject}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Right Panel - Properties */}
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Properties
            </Typography>
            
            {selectedObject ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Object selected! Edit properties below.
                </Alert>

                <TextField
                  fullWidth
                  label="Object Type"
                  value={selectedObject.type === 'incoming-lane' ? 'Incoming Lane' : 'Outgoing Lane'}
                  disabled
                  sx={{ mb: 2 }}
                  size="small"
                />

                <FormControl fullWidth sx={{ mb: 2 }} size="small">
                  <InputLabel>Direction</InputLabel>
                  <Select
                    value={selectedObject.direction}
                    label="Direction"
                    disabled
                  >
                    <MenuItem value="north">North</MenuItem>
                    <MenuItem value="south">South</MenuItem>
                    <MenuItem value="east">East</MenuItem>
                    <MenuItem value="west">West</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }} size="small">
                  <InputLabel>Lane Type</InputLabel>
                  <Select
                    value={selectedObject.laneType || 'straight'}
                    label="Lane Type"
                    onChange={(e) => handlePropertyChange('type', e.target.value)}
                  >
                    <MenuItem value="straight">Straight</MenuItem>
                    <MenuItem value="left">Left Turn</MenuItem>
                    <MenuItem value="right">Right Turn</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteSelected}
                >
                  Delete Selected Object
                </Button>
              </Box>
            ) : (
              <Alert severity="info">
                Click on an object in the canvas to view and edit its properties.
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" gutterBottom>
              Crossroad Info
            </Typography>
            <TextField
              fullWidth
              label="Crossroad Name"
              value={crossroad.name}
              onChange={(e) => setCrossroad({ ...crossroad, name: e.target.value })}
              sx={{ mb: 2 }}
              size="small"
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={crossroad.description}
              onChange={(e) => setCrossroad({ ...crossroad, description: e.target.value })}
              size="small"
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={handleSaveDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Save Crossroad Design</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Design Name"
            fullWidth
            variant="outlined"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Enter a name for your crossroad design"
            helperText="Give your crossroad design a descriptive name"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveDialogClose}>Cancel</Button>
          <Button 
            onClick={performSave} 
            variant="contained" 
            color="primary"
            disabled={!saveName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map Picker Dialog */}
      <CrossroadMapPicker
        open={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onConfirm={handleMapPickerConfirm}
        initialCenter={crossroad.location}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleDeleteCancel}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Delete Crossroad Design</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography>
            Are you sure you want to delete the design <strong>"{designToDelete?.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will permanently remove the design and all its configuration.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default CrossroadDesigner;
