import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  FiberManualRecord
} from '@mui/icons-material';
import axios from 'axios';
import Statistics from '../components/Simulation/Statistics';
import MapView from '../components/Map/MapView';
import VisualDesignerCanvas from '../components/Designer/VisualDesignerCanvas';

const WS_URL = `ws://localhost:${process.env.REACT_APP_WS_PORT || 8080}`;

function SessionPage() {
  const { id } = useParams();
  
  const [session, setSession] = useState(null);
  const [crossroad, setCrossroad] = useState(null);
  const [simulationState, setSimulationState] = useState(null);
  const [signals, setSignals] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [algorithm, setAlgorithm] = useState('fixed-time');
  const [algorithmParams, setAlgorithmParams] = useState({
    cycleTime: 60,
    greenTime: 25
  });
  const [trafficInflow, setTrafficInflow] = useState({});
  const wsRef = useRef(null);
  const vehicleCanvasRef = useRef(null);

  useEffect(() => {
    loadSession();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Redraw vehicles when they update
    if (vehicleCanvasRef.current && vehicles) {
      drawVehicles(vehicleCanvasRef.current, vehicles);
    }
  }, [vehicles]);

  useEffect(() => {
    // Log lane coordinates when crossroad loads
    if (crossroad) {
      // Coordinates are already loaded with the crossroad data
    }
  }, [crossroad]);

  const loadSession = async () => {
    try {
      const response = await axios.get(`/api/sessions/${id}`);
      setSession(response.data);
      
      // Set algorithm from session data
      if (response.data.algorithm) {
        setAlgorithm(response.data.algorithm);
      }
      
      // Load crossroad if specified
      if (response.data.crossroadId) {
        const crossroadResponse = await axios.get(`/api/crossroads/${response.data.crossroadId}`);
        const loadedCrossroad = crossroadResponse.data;
        
        // Log raw crossroad data
        
        setCrossroad(loadedCrossroad);
        
        // Initialize signals from crossroad design
        if (loadedCrossroad.signals) {
          setSignals(loadedCrossroad.signals);
        }
        
        // Initialize traffic inflow settings for all incoming lanes
        const initialInflow = {};
        ['north', 'south', 'east', 'west'].forEach(direction => {
          const incomingLanes = loadedCrossroad.lanes[direction]?.incoming || [];
          incomingLanes.forEach(lane => {
            initialInflow[lane.id] = 'medium'; // default to medium traffic
          });
        });
        setTrafficInflow(initialInflow);
      } else {
      }
    } catch (error) {
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'join_session', sessionId: id }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'session_joined':
        setSimulationState(data.state);
        break;
      case 'simulation_state':
        setSimulationState(data.state);
        break;
      case 'simulation_started':
      case 'simulation_stopped':
      case 'simulation_paused':
      case 'simulation_resumed':
        if (data.state) {
          setSimulationState(data.state);
        }
        break;
      case 'simulation_reset':
        // Clear vehicles and update signals when simulation is reset
        setVehicles(data.vehicles || []);
        setSignals(data.signals);
        break;
      case 'vehicle_update':
        setVehicles(data.vehicles);
        break;
      case 'signal_update':
        setSignals(data.signals);
        break;
      default:
        break;
    }
  };

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const handleStart = () => {
    sendMessage({ 
      type: 'start_simulation', 
      sessionId: id,
      trafficInflow: trafficInflow
    });
  };

  const handlePause = () => {
    sendMessage({ type: 'pause_simulation', sessionId: id });
  };

  const handleStop = () => {
    sendMessage({ type: 'stop_simulation', sessionId: id });
  };

  const handleAlgorithmChange = () => {
    sendMessage({
      type: 'change_algorithm',
      sessionId: id,
      algorithm,
      params: algorithmParams
    });
  };

  const handleTrafficInflowChange = (laneId, level) => {
    const updatedInflow = {
      ...trafficInflow,
      [laneId]: level
    };
    setTrafficInflow(updatedInflow);
    
    // Send update to server if simulation is running
    if (simulationState?.isRunning && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_traffic_inflow',
        sessionId: id,
        trafficInflow: updatedInflow
      }));
    }
  };

  const getIncomingLanes = () => {
    if (!crossroad) return [];
    const lanes = [];
    ['north', 'south', 'east', 'west'].forEach(direction => {
      const incomingLanes = crossroad.lanes[direction]?.incoming || [];
      incomingLanes.forEach(lane => {
        lanes.push({
          ...lane,
          direction,
          displayName: lane.id
        });
      });
    });
    return lanes;
  };

  const handleToggleRecording = () => {
    // TODO: Implement recording toggle
    setIsRecording(!isRecording);
  };

  const drawVehicles = (canvas, vehicles) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 1400; // Match updated canvas constants
    canvas.height = 1000;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const CANVAS_CENTER_X = 1400 / 2; // 700
    const CANVAS_CENTER_Y = 1000 / 2; // 500
    const LANE_WIDTH = 40;
    const pixelsPerMeter = 0.5; // Scale: 500m lane = 250px
    const LANE_LENGTH_PX = 250; // Lanes extend 250px from center

    // Calculate intersection size
    const calculateIntersectionSize = () => {
      if (!crossroad) return 60;
      const maxLanes = Math.max(
        (crossroad.lanes.north?.incoming?.length || 0) + (crossroad.lanes.north?.outgoing?.length || 0),
        (crossroad.lanes.south?.incoming?.length || 0) + (crossroad.lanes.south?.outgoing?.length || 0),
        (crossroad.lanes.east?.incoming?.length || 0) + (crossroad.lanes.east?.outgoing?.length || 0),
        (crossroad.lanes.west?.incoming?.length || 0) + (crossroad.lanes.west?.outgoing?.length || 0)
      );
      return Math.max(60, maxLanes * LANE_WIDTH / 2);
    };

    const intersectionSize = calculateIntersectionSize();

    // Helper to get lane center position based on direction and lane index
    const getLaneCenter = (vehicle) => {
      if (!crossroad) return { x: 0, y: 0, startDistance: 0 };
      
      // CRITICAL FIX: Use the lane's startCoords if available (sent from server)
      if (vehicle.lane.startCoords && vehicle.lane.endCoords) {
        return {
          x: vehicle.lane.startCoords.x,
          y: vehicle.lane.startCoords.y,
          startDistance: vehicle.lane.length || 500
        };
      }
      
      // Fallback to manual calculation if coordinates not provided
      const direction = vehicle.direction;
      const incomingLanes = crossroad.lanes[direction]?.incoming || [];
      const outgoingLanes = crossroad.lanes[direction]?.outgoing || [];
      
      // CRITICAL: Only look for vehicle lane in incoming lanes for incoming phase
      // Sort incoming lanes: right, straight, left
      const rightLanes = incomingLanes.filter(l => l.type === 'right');
      const straightLanes = incomingLanes.filter(l => l.type === 'straight');
      const leftLanes = incomingLanes.filter(l => l.type === 'left');
      const sortedIncoming = [...rightLanes, ...straightLanes, ...leftLanes];
      
      const laneIndex = sortedIncoming.findIndex(l => l.id === vehicle.lane.id);
      
      // If lane not found in incoming lanes, this is an error - vehicle should only be in incoming phase
      if (laneIndex === -1) {
        return { x: 0, y: 0, startDistance: 0 };
      }
      
      const incomingCount = sortedIncoming.length;
      const outgoingCount = outgoingLanes.length;
      // FIXED: Reduced offset for better visual alignment
      const offset = 40;

      let centerX, centerY, startDistance;

      switch (direction) {
        case 'north':
          // Incoming from north (top) - vehicles move downward toward intersection
          centerX = CANVAS_CENTER_X - offset + (laneIndex * LANE_WIDTH) + LANE_WIDTH / 2;
          centerY = CANVAS_CENTER_Y - intersectionSize / 2 - LANE_LENGTH_PX; // Start at top edge
          startDistance = (CANVAS_CENTER_Y + intersectionSize) - (CANVAS_CENTER_Y - LANE_LENGTH_PX);
          break;
        case 'south':
          // Incoming from south (bottom) - vehicles move upward toward intersection
          centerX = CANVAS_CENTER_X + offset - (laneIndex * LANE_WIDTH) - LANE_WIDTH / 2;
          centerY = CANVAS_CENTER_Y + intersectionSize / 2 + LANE_LENGTH_PX; // Start at bottom edge
          startDistance = CANVAS_CENTER_Y + LANE_LENGTH_PX - (CANVAS_CENTER_Y - intersectionSize);
          break;
        case 'east':
          // Incoming from east (right) - vehicles move leftward toward intersection
          centerX = CANVAS_CENTER_X + intersectionSize / 2 + LANE_LENGTH_PX; // Start at right edge
          centerY = CANVAS_CENTER_Y - offset + (laneIndex * LANE_WIDTH) + LANE_WIDTH / 2;
          startDistance = CANVAS_CENTER_X + LANE_LENGTH_PX - (CANVAS_CENTER_X - intersectionSize);
          break;
        case 'west':
          // Incoming from west (left) - vehicles move rightward toward intersection
          centerX = CANVAS_CENTER_X - intersectionSize / 2 - LANE_LENGTH_PX; // Start at left edge
          centerY = CANVAS_CENTER_Y + offset - (laneIndex * LANE_WIDTH) - LANE_WIDTH / 2;
          startDistance = (CANVAS_CENTER_X + intersectionSize) - (CANVAS_CENTER_X - LANE_LENGTH_PX);
          break;
        default:
          return { x: 0, y: 0, startDistance: 0 };
      }

      return { x: centerX, y: centerY, startDistance };
    };

    vehicles.forEach(vehicle => {
      // Skip vehicles without phase info (legacy or invalid)
      if (!vehicle.phase) {
        return;
      }

      // Validate vehicle is only drawn in correct phase
      if (vehicle.phase !== 'incoming' && vehicle.phase !== 'intersection' && vehicle.phase !== 'outgoing') {
        return;
      }

      // Skip if vehicle doesn't have required properties
      if (!vehicle.lane || !vehicle.direction) {
        return;
      }

      // CRITICAL: For incoming phase, verify the lane is actually an incoming lane
      if (vehicle.phase === 'incoming') {
        const incomingLanes = crossroad.lanes[vehicle.direction]?.incoming || [];
        const isInIncomingLanes = incomingLanes.some(l => l.id === vehicle.lane.id);
        
        if (!isInIncomingLanes) {
          return; // Don't draw this vehicle - it's in an invalid state
        }
      }

      let x, y, drawDirection;
      const position = vehicle.position * pixelsPerMeter; // Convert meters to pixels

      if (vehicle.phase === 'incoming') {
        // ONLY vehicles in incoming phase should be drawn on incoming lanes
        const originalDirection = vehicle.direction;
        const { x: startX, y: startY } = getLaneCenter(vehicle);
        
        // Validate we found a valid lane position
        if (startX === 0 && startY === 0) {
          return;
        }
        
        drawDirection = originalDirection;

        // Position vehicle along its incoming lane, moving TOWARD intersection
        switch (originalDirection) {
          case 'north':
            // North: spawn at top (small Y), move toward center (increase Y)
            x = startX;
            y = startY + position;
            break;
          case 'south':
            // South: spawn at bottom (large Y), move toward center (decrease Y)
            x = startX;
            y = startY - position;
            break;
          case 'east':
            // East: spawn at right (large X), move toward center (decrease X)
            x = startX - position;
            y = startY;
            break;
          case 'west':
            // West: spawn at left (small X), move toward center (increase X)
            x = startX + position;
            y = startY;
            break;
          default:
            return;
        }
        
        // Log vehicle position
        if (!window.vehiclePositionLogged || window.vehiclePositionLogged < 3) {
          window.vehiclePositionLogged = (window.vehiclePositionLogged || 0) + 1;
        }
      } else if (vehicle.phase === 'intersection') {
        // Vehicle is crossing through intersection - interpolate between incoming end and outgoing start
        // Calculate intersection size in meters to match server-side logic
        const maxLanes = Math.max(
          (crossroad.lanes.north?.incoming?.length || 0) + (crossroad.lanes.north?.outgoing?.length || 0),
          (crossroad.lanes.south?.incoming?.length || 0) + (crossroad.lanes.south?.outgoing?.length || 0),
          (crossroad.lanes.east?.incoming?.length || 0) + (crossroad.lanes.east?.outgoing?.length || 0),
          (crossroad.lanes.west?.incoming?.length || 0) + (crossroad.lanes.west?.outgoing?.length || 0)
        );
        const INTERSECTION_SIZE = Math.max(30, maxLanes * 10); // meters - matches server calculation
        const progress = vehicle.position / INTERSECTION_SIZE; // 0 to 1
        
        // Use original incoming direction and lane for positioning
        const incomingLaneInfo = { 
          direction: vehicle.originalDirection || vehicle.direction,
          lane: vehicle.originalLane || vehicle.lane
        };
        const incomingEndPos = getIncomingLaneEndPosition(incomingLaneInfo);
        
        // Get outgoing lane start position
        const outgoingStartPos = getOutgoingLaneStartPosition(vehicle);
        
        // Interpolate position
        x = incomingEndPos.x + (outgoingStartPos.x - incomingEndPos.x) * progress;
        y = incomingEndPos.y + (outgoingStartPos.y - incomingEndPos.y) * progress;
        
        // Interpolate rotation direction
        drawDirection = vehicle.targetDirection;
      } else if (vehicle.phase === 'outgoing') {
        // ONLY vehicles in outgoing phase should be drawn on outgoing lanes
        if (!vehicle.targetDirection || !vehicle.targetLane) {
          return;
        }
        
        const { x: startX, y: startY } = getOutgoingLaneStartPosition(vehicle);
        
        // Validate we found a valid position
        if (startX === 0 && startY === 0) {
          return;
        }
        
        drawDirection = vehicle.targetDirection;

        // Position vehicle along its outgoing lane, moving AWAY from intersection
        switch (vehicle.targetDirection) {
          case 'north':
            // North outgoing extends upward (negative Y) from intersection
            x = startX;
            y = startY - position;
            break;
          case 'south':
            // South outgoing extends downward (positive Y) from intersection
            x = startX;
            y = startY + position;
            break;
          case 'east':
            // East outgoing extends rightward (positive X) from intersection
            x = startX + position;
            y = startY;
            break;
          case 'west':
            // West outgoing extends leftward (negative X) from intersection
            x = startX - position;
            y = startY;
            break;
          default:
            return;
        }
      } else {
        return;
      }

      // Draw vehicle with contrasting colors to blue lanes
      ctx.fillStyle = vehicle.type === 'car' ? '#FFD700' :  // Gold
                     vehicle.type === 'truck' ? '#FF6B35' :  // Orange-red
                     vehicle.type === 'bus' ? '#FF1744' :    // Bright red
                     '#00E676';  // Bright green
      
      const vehicleLength = vehicle.type === 'truck' || vehicle.type === 'bus' ? 15 : 10;
      const vehicleWidth = 8;

      ctx.save();
      ctx.translate(x, y);
      
      // Rotate based on direction
      if (drawDirection === 'north') {
        ctx.rotate(-Math.PI / 2);
      } else if (drawDirection === 'south') {
        ctx.rotate(Math.PI / 2);
      } else if (drawDirection === 'west') {
        ctx.rotate(Math.PI);
      }
      // east is default (no rotation)
      
      // Draw vehicle rectangle centered at origin
      ctx.fillRect(-vehicleLength / 2, -vehicleWidth / 2, vehicleLength, vehicleWidth);
      
      // Draw front indicator (small white rectangle)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(vehicleLength / 2 - 2, -vehicleWidth / 2, 2, vehicleWidth);
      
      ctx.restore();
    });

    // Helper function to get incoming lane end position (at intersection edge)
    function getIncomingLaneEndPosition(vehicleInfo) {
      if (!vehicleInfo.direction || !vehicleInfo.lane) {
        return { x: 0, y: 0 };
      }
      
      // Use lane's endCoords if available
      if (vehicleInfo.lane.endCoords) {
        return {
          x: vehicleInfo.lane.endCoords.x,
          y: vehicleInfo.lane.endCoords.y
        };
      }
      
      const direction = vehicleInfo.direction;
      const incomingLanes = crossroad.lanes[direction]?.incoming || [];
      const outgoingLanes = crossroad.lanes[direction]?.outgoing || [];
      
      const rightLanes = incomingLanes.filter(l => l.type === 'right');
      const straightLanes = incomingLanes.filter(l => l.type === 'straight');
      const leftLanes = incomingLanes.filter(l => l.type === 'left');
      const sortedIncoming = [...rightLanes, ...straightLanes, ...leftLanes];
      
      const laneIndex = sortedIncoming.findIndex(l => l.id === vehicleInfo.lane.id);
      
      if (laneIndex === -1) {
        return { x: 0, y: 0 };
      }
      
      const totalLanes = sortedIncoming.length + outgoingLanes.length;
      const offset = totalLanes * LANE_WIDTH / 2;

      switch (direction) {
        case 'north':
          return {
            x: CANVAS_CENTER_X - offset + (laneIndex * LANE_WIDTH) + LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y - intersectionSize
          };
        case 'south':
          return {
            x: CANVAS_CENTER_X + offset - (laneIndex * LANE_WIDTH) - LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y + intersectionSize
          };
        case 'east':
          return {
            x: CANVAS_CENTER_X + intersectionSize,
            y: CANVAS_CENTER_Y - offset + (laneIndex * LANE_WIDTH) + LANE_WIDTH / 2
          };
        case 'west':
          return {
            x: CANVAS_CENTER_X - intersectionSize,
            y: CANVAS_CENTER_Y + offset - (laneIndex * LANE_WIDTH) - LANE_WIDTH / 2
          };
        default:
          return { x: 0, y: 0 };
      }
    }

    // Helper function to get outgoing lane start position (at intersection edge)
    function getOutgoingLaneStartPosition(vehicle) {
      if (!vehicle.targetDirection || !vehicle.targetLane) {
        return { x: 0, y: 0 };
      }
      
      // Use targetLane's startCoords if available
      if (vehicle.targetLane.startCoords) {
        return {
          x: vehicle.targetLane.startCoords.x,
          y: vehicle.targetLane.startCoords.y
        };
      }
      
      const direction = vehicle.targetDirection;
      const outgoingLanes = crossroad.lanes[direction]?.outgoing || [];
      const incomingLanes = crossroad.lanes[direction]?.incoming || [];
      
      if (outgoingLanes.length === 0) {
        return { x: 0, y: 0 };
      }
      
      // Find which outgoing lane this vehicle should use (use first available)
      const laneIndex = 0; // Simplified - use first outgoing lane
      
      const totalLanes = incomingLanes.length + outgoingLanes.length;
      const offset = totalLanes * LANE_WIDTH / 2;

      switch (direction) {
        case 'north':
          return {
            x: CANVAS_CENTER_X - offset + (incomingLanes.length * LANE_WIDTH) + (laneIndex * LANE_WIDTH) + LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y - intersectionSize
          };
        case 'south':
          return {
            x: CANVAS_CENTER_X + offset - (incomingLanes.length * LANE_WIDTH) - (laneIndex * LANE_WIDTH) - LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y + intersectionSize
          };
        case 'east':
          return {
            x: CANVAS_CENTER_X + intersectionSize,
            y: CANVAS_CENTER_Y - offset + (incomingLanes.length * LANE_WIDTH) + (laneIndex * LANE_WIDTH) + LANE_WIDTH / 2
          };
        case 'west':
          return {
            x: CANVAS_CENTER_X - intersectionSize,
            y: CANVAS_CENTER_Y + offset - (incomingLanes.length * LANE_WIDTH) - (laneIndex * LANE_WIDTH) - LANE_WIDTH / 2
          };
        default:
          return { x: 0, y: 0 };
      }
    }
  };

  if (!session) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {session.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
          />
          {simulationState?.isRunning && (
            <Chip label="Running" color="primary" size="small" />
          )}
          {isRecording && (
            <Chip
              icon={<FiberManualRecord />}
              label="Recording"
              color="error"
              size="small"
            />
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <ButtonGroup variant="contained">
                <Button
                  startIcon={<PlayArrow />}
                  onClick={handleStart}
                  disabled={simulationState?.isRunning}
                >
                  Start
                </Button>
                <Button
                  startIcon={simulationState?.isPaused ? <PlayArrow /> : <Pause />}
                  onClick={handlePause}
                  disabled={!simulationState?.isRunning}
                >
                  {simulationState?.isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  startIcon={<Stop />}
                  onClick={handleStop}
                  disabled={!simulationState?.isRunning}
                >
                  Stop
                </Button>
              </ButtonGroup>

              <Button
                variant={isRecording ? 'contained' : 'outlined'}
                color="error"
                startIcon={<FiberManualRecord />}
                onClick={handleToggleRecording}
              >
                {isRecording ? 'Stop Recording' : 'Record'}
              </Button>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Algorithm</InputLabel>
                <Select
                  value={algorithm}
                  label="Algorithm"
                  onChange={(e) => setAlgorithm(e.target.value)}
                >
                  <MenuItem value="fixed-time">Fixed Time</MenuItem>
                  <MenuItem value="adaptive">Adaptive</MenuItem>
                  <MenuItem value="actuated">Actuated</MenuItem>
                  <MenuItem value="coordinated">Coordinated</MenuItem>
                  <MenuItem value="ml-based">ML-Based</MenuItem>
                </Select>
              </FormControl>

              {algorithm === 'fixed-time' && (
                <>
                  <TextField
                    label="Cycle Time (s)"
                    type="number"
                    value={algorithmParams.cycleTime}
                    onChange={(e) => setAlgorithmParams({
                      ...algorithmParams,
                      cycleTime: parseInt(e.target.value)
                    })}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <TextField
                    label="Green Time (s)"
                    type="number"
                    value={algorithmParams.greenTime}
                    onChange={(e) => setAlgorithmParams({
                      ...algorithmParams,
                      greenTime: parseInt(e.target.value)
                    })}
                    size="small"
                    sx={{ width: 120 }}
                  />
                </>
              )}

              <Button variant="outlined" onClick={handleAlgorithmChange}>
                Apply
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Traffic Inflow Control - Above Simulation */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              Traffic Inflow Control
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 1.5,
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              {getIncomingLanes().map(lane => (
                <Box key={lane.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" fontWeight="bold" sx={{ minWidth: '35px' }}>
                    {lane.displayName}
                  </Typography>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select
                      value={trafficInflow[lane.id] || 'medium'}
                      onChange={(e) => handleTrafficInflowChange(lane.id, e.target.value)}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      <MenuItem value="none" sx={{ fontSize: '0.75rem' }}>🚫 None</MenuItem>
                      <MenuItem value="light" sx={{ fontSize: '0.75rem' }}>🟢 Light</MenuItem>
                      <MenuItem value="medium" sx={{ fontSize: '0.75rem' }}>🟡 Medium</MenuItem>
                      <MenuItem value="heavy" sx={{ fontSize: '0.75rem' }}>🔴 Heavy</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Main Simulation View */}
        <Grid item xs={12} md={8} lg={9}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Live Simulation
            </Typography>
            <Box sx={{ 
              position: 'relative', 
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'center'
            }}>
              {/* Use the same designer canvas for exact visualization */}
              {(crossroad || simulationState?.crossroad) ? (
                <Box sx={{ position: 'relative', width: 1400, height: 1000 }}>
                  <VisualDesignerCanvas 
                    crossroad={crossroad || simulationState?.crossroad} 
                    onCrossroadChange={() => {}} 
                    onSelectObject={() => {}}
                    liveSignals={signals}
                  />
                  {/* Vehicle overlay layer */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 1400,
                      height: 1000,
                      pointerEvents: 'none'
                    }}
                  >
                    <canvas
                      ref={vehicleCanvasRef}
                      width={1400}
                      height={1000}
                      style={{ width: '1400px', height: '1000px' }}
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="text.secondary">Loading crossroad design...</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Statistics Sidebar */}
        <Grid item xs={12} md={4} lg={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Statistics
                  simulationTime={simulationState?.simulationTime}
                  vehicleCount={vehicles.length}
                />
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Map View */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Map View
            </Typography>
            <MapView
              crossroad={simulationState?.crossroad}
              vehicles={vehicles}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default SessionPage;
