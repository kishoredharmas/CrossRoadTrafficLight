import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Paper, Typography } from '@mui/material';

// Constants
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 1000;
const CANVAS_CENTER_X = CANVAS_WIDTH / 2;
const CANVAS_CENTER_Y = CANVAS_HEIGHT / 2;
const LANE_WIDTH = 40;
const LANE_LENGTH_METERS = 500;
const LANE_LENGTH_SCALED = LANE_LENGTH_METERS / 2; // 500m -> 250px
const ARROW_SIZE = 15;
const ARROW_OFFSET_FROM_INTERSECTION = 80;
const SIGNAL_OFFSET_FROM_INTERSECTION = 40;
const LIGHT_RADIUS = 6;
const MIN_INTERSECTION_SIZE = 60;

// Turn direction mappings
const OPPOSITE_DIRECTIONS = { north: 'south', south: 'north', east: 'west', west: 'east' };
const LEFT_TURN_DIRECTIONS = { north: 'east', east: 'south', south: 'west', west: 'north' };
const RIGHT_TURN_DIRECTIONS = { north: 'west', west: 'south', south: 'east', east: 'north' };

// Helper function to generate sequential lane IDs
const generateLaneId = (direction, type, crossroad) => {
  const prefix = direction.charAt(0).toUpperCase();
  const existingLanes = [
    ...(crossroad.lanes[direction]?.incoming || []),
    ...(crossroad.lanes[direction]?.outgoing || [])
  ];
  
  // Extract numbers from existing lane IDs (e.g., "N1" -> 1, "N2" -> 2)
  const existingNumbers = existingLanes
    .map(lane => {
      const match = lane.id.match(new RegExp(`^${prefix}(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0);
  
  // Find the next available number
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}${nextNumber}`;
};

function VisualDesignerCanvas({ crossroad, onCrossroadChange, onSelectObject, liveSignals }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [objects, setObjects] = useState([]);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [draggedObjectId, setDraggedObjectId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const calculateIntersectionSize = useCallback(() => {
    const maxLanes = Math.max(
      (crossroad.lanes.north?.incoming?.length || 0) + (crossroad.lanes.north?.outgoing?.length || 0),
      (crossroad.lanes.south?.incoming?.length || 0) + (crossroad.lanes.south?.outgoing?.length || 0),
      (crossroad.lanes.east?.incoming?.length || 0) + (crossroad.lanes.east?.outgoing?.length || 0),
      (crossroad.lanes.west?.incoming?.length || 0) + (crossroad.lanes.west?.outgoing?.length || 0)
    );
    return Math.max(MIN_INTERSECTION_SIZE, maxLanes * LANE_WIDTH / 2);
  }, [crossroad.lanes]);

  const getDefaultPosition = useCallback((direction, type, index) => {
    const incomingLanes = crossroad.lanes[direction]?.incoming || [];
    const outgoingLanes = crossroad.lanes[direction]?.outgoing || [];
    const intersectionSize = calculateIntersectionSize();
    const incomingCount = incomingLanes.length;
    const outgoingCount = outgoingLanes.length;
    const totalLanes = incomingCount + outgoingCount;
    const offset = totalLanes * LANE_WIDTH / 2;

    const positions = {
      north: {
        incoming: { 
          x: CANVAS_CENTER_X - offset + (index * LANE_WIDTH) + LANE_WIDTH/2, 
          y: CANVAS_CENTER_Y - intersectionSize 
        },
        outgoing: { 
          x: CANVAS_CENTER_X - offset + (incomingCount * LANE_WIDTH) + (index * LANE_WIDTH) + LANE_WIDTH/2, 
          y: CANVAS_CENTER_Y - intersectionSize 
        }
      },
      south: {
        incoming: { 
          x: CANVAS_CENTER_X + offset - (index * LANE_WIDTH) - LANE_WIDTH/2, 
          y: CANVAS_CENTER_Y + intersectionSize 
        },
        outgoing: { 
          x: CANVAS_CENTER_X + offset - (incomingCount * LANE_WIDTH) - (index * LANE_WIDTH) - LANE_WIDTH/2, 
          y: CANVAS_CENTER_Y + intersectionSize 
        }
      },
      east: {
        incoming: { 
          x: CANVAS_CENTER_X + intersectionSize, 
          y: CANVAS_CENTER_Y - offset + (index * LANE_WIDTH) + LANE_WIDTH/2 
        },
        outgoing: { 
          x: CANVAS_CENTER_X + intersectionSize, 
          y: CANVAS_CENTER_Y - offset + (incomingCount * LANE_WIDTH) + (index * LANE_WIDTH) + LANE_WIDTH/2 
        }
      },
      west: {
        incoming: { 
          x: CANVAS_CENTER_X - intersectionSize, 
          y: CANVAS_CENTER_Y + offset - (index * LANE_WIDTH) - LANE_WIDTH/2 
        },
        outgoing: { 
          x: CANVAS_CENTER_X - intersectionSize, 
          y: CANVAS_CENTER_Y + offset - (incomingCount * LANE_WIDTH) - (index * LANE_WIDTH) - LANE_WIDTH/2 
        }
      }
    };

    return positions[direction]?.[type] || { x: 100, y: 100 };
  }, [crossroad.lanes, calculateIntersectionSize]);

  useEffect(() => {
    // Convert crossroad data to visual objects
    const visualObjects = [];
    let objectId = 0;

    ['north', 'south', 'east', 'west'].forEach(direction => {
      const incoming = crossroad.lanes[direction]?.incoming || [];
      const outgoing = crossroad.lanes[direction]?.outgoing || [];

      // Explicitly order incoming lanes: right, straight, left
      const rightLanes = incoming.filter(lane => lane.type === 'right');
      const straightLanes = incoming.filter(lane => lane.type === 'straight');
      const leftLanes = incoming.filter(lane => lane.type === 'left');
      const sortedIncoming = [...rightLanes, ...straightLanes, ...leftLanes];

      sortedIncoming.forEach((lane, sortedIndex) => {
        visualObjects.push({
          id: `obj-${objectId++}`,
          type: 'incoming-lane',
          direction,
          laneId: lane.id,
          laneType: lane.type,
          length: lane.length,
          index: sortedIndex,
          ...getDefaultPosition(direction, 'incoming', sortedIndex, sortedIncoming.length)
        });
      });

      outgoing.forEach((lane, index) => {
        visualObjects.push({
          id: `obj-${objectId++}`,
          type: 'outgoing-lane',
          direction,
          laneId: lane.id,
          laneType: lane.type,
          length: lane.length,
          index,
          ...getDefaultPosition(direction, 'outgoing', index, outgoing.length)
        });
      });

      // Add signals
      const signals = crossroad.signals?.[direction];
      if (signals) {
        if (Array.isArray(signals)) {
          signals.forEach((signal, index) => {
            // Find the corresponding incoming lane for this signal
            const correspondingLane = incoming.find(lane => lane.id === signal.laneId);
            const laneIndex = incoming.indexOf(correspondingLane);
            let signalPosition;
            
            if (correspondingLane && laneIndex !== -1) {
              // Get the lane's position and place signal near intersection
              const lanePos = getDefaultPosition(direction, 'incoming', laneIndex, incoming.length);
              signalPosition = getSignalPositionOnLane(direction, lanePos);
            } else {
              // Fallback to default position if lane not found
              signalPosition = getDefaultSignalPosition(direction, index);
            }
            
            visualObjects.push({
              id: `signal-${objectId++}`,
              type: 'signal',
              direction,
              signalId: signal.id,
              state: signal.state,
              laneId: signal.laneId,
              ...signalPosition
            });
          });
        } else {
          // Single signal object
          const correspondingLane = incoming.find(lane => lane.id === signals.laneId);
          const laneIndex = incoming.indexOf(correspondingLane);
          let signalPosition;
          
          if (correspondingLane && laneIndex !== -1) {
            const lanePos = getDefaultPosition(direction, 'incoming', laneIndex, incoming.length);
            signalPosition = getSignalPositionOnLane(direction, lanePos);
          } else {
            signalPosition = getDefaultSignalPosition(direction, 0);
          }
          
          visualObjects.push({
            id: `signal-${objectId++}`,
            type: 'signal',
            direction,
            signalId: signals.id,
            state: signals.state,
            laneId: signals.laneId,
            ...signalPosition
          });
        }
      }
    });

    setObjects(visualObjects);

    // Update selectedObject if it exists to reflect changes in crossroad data
    if (selectedObject && selectedObject.laneId) {
      const updatedSelectedObj = visualObjects.find(obj => obj.laneId === selectedObject.laneId);
      if (updatedSelectedObj) {
        setSelectedObject(updatedSelectedObj);
        onSelectObject(updatedSelectedObj);
      }
    }
  }, [crossroad, getDefaultPosition, onSelectObject, selectedObject]);

  const getLaneRect = (obj) => {
    const halfWidth = LANE_WIDTH / 2;
    const rectMap = {
      north: { x: obj.x - halfWidth, y: obj.y - LANE_LENGTH_SCALED, width: LANE_WIDTH, height: LANE_LENGTH_SCALED },
      south: { x: obj.x - halfWidth, y: obj.y, width: LANE_WIDTH, height: LANE_LENGTH_SCALED },
      east: { x: obj.x, y: obj.y - halfWidth, width: LANE_LENGTH_SCALED, height: LANE_WIDTH },
      west: { x: obj.x - LANE_LENGTH_SCALED, y: obj.y - halfWidth, width: LANE_LENGTH_SCALED, height: LANE_WIDTH }
    };
    return rectMap[obj.direction] || { x: obj.x - 20, y: obj.y - 20, width: 40, height: 40 };
  };

  const getDefaultSignalPosition = (direction, index) => {
    const offset = 80;
    const spacing = 30;
    
    const positions = {
      north: { x: CANVAS_CENTER_X + 50 + (index * spacing), y: CANVAS_CENTER_Y - offset },
      south: { x: CANVAS_CENTER_X - 50 - (index * spacing), y: CANVAS_CENTER_Y + offset },
      east: { x: CANVAS_CENTER_X + offset, y: CANVAS_CENTER_Y + 50 + (index * spacing) },
      west: { x: CANVAS_CENTER_X - offset, y: CANVAS_CENTER_Y - 50 - (index * spacing) }
    };
    
    return positions[direction] || { x: 100, y: 100 };
  };

  const getSignalPositionOnLane = (direction, lanePosition) => {
    const intersectionSize = calculateIntersectionSize();
    // Position signal near the intersection edge on the lane
    const offsets = {
      north: { x: lanePosition.x, y: CANVAS_CENTER_Y - intersectionSize - SIGNAL_OFFSET_FROM_INTERSECTION },
      south: { x: lanePosition.x, y: CANVAS_CENTER_Y + intersectionSize + SIGNAL_OFFSET_FROM_INTERSECTION },
      east: { x: CANVAS_CENTER_X + intersectionSize + SIGNAL_OFFSET_FROM_INTERSECTION, y: lanePosition.y },
      west: { x: CANVAS_CENTER_X - intersectionSize - SIGNAL_OFFSET_FROM_INTERSECTION, y: lanePosition.y }
    };
    
    return offsets[direction] || lanePosition;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
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
          let laneTargetDir = '';
          if (lane.type === 'straight') {
            laneTargetDir = OPPOSITE_DIRECTIONS[sourceDir];
          } else if (lane.type === 'left') {
            laneTargetDir = LEFT_TURN_DIRECTIONS[sourceDir];
          } else if (lane.type === 'right') {
            laneTargetDir = RIGHT_TURN_DIRECTIONS[sourceDir];
          }
          
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
        const newLaneId = generateLaneId(targetDirection, 'outgoing', { ...lanes, lanes: { ...lanes, [targetDirection]: { ...lanes[targetDirection], outgoing: newOutgoing } } });
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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const itemData = e.dataTransfer.getData('application/json');
    if (!itemData) return;

    const item = JSON.parse(itemData);
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Determine direction based on drop position
    const direction = determineDirection(x, y);

    if (item.type === 'signal') {
      // Traffic signals are now automatically added to incoming lanes
      alert('Traffic signals are automatically added to each incoming lane. You don\'t need to place them manually.');
      return;
    }
    
    // Only allow incoming lanes to be dropped
    if (item.type !== 'incoming-lane') {
      alert('Only incoming lanes can be placed. Outgoing lanes are automatically generated.');
      return;
    }
    
    const type = 'incoming';
    const timestamp = Date.now();
    
    const newLaneId = generateLaneId(direction, type, crossroad);
    
    // Determine target direction based on incoming direction and lane type
    const laneType = item.laneType || 'straight';
    let targetDirection = '';
    
    if (laneType === 'straight') {
      targetDirection = OPPOSITE_DIRECTIONS[direction];
    } else if (laneType === 'left') {
      targetDirection = LEFT_TURN_DIRECTIONS[direction];
    } else if (laneType === 'right') {
      targetDirection = RIGHT_TURN_DIRECTIONS[direction];
    }
    
    // Create the new incoming lane without pairId (outgoing lanes are shared)
    const newLane = {
      id: newLaneId,
      type: laneType,
      direction,
      length: 500, // Fixed length for all lanes
      pairId: null // No specific pair since outgoing lanes are shared
    };

    // Auto-create traffic signal for this incoming lane
    const newSignal = {
      id: `SIG_${newLaneId}`,
      state: 'red',
      timeInState: 0,
      direction,
      laneId: newLane.id
    };

    // Get existing signals for this direction
    const existingSignals = crossroad.signals?.[direction];
    let updatedSignals;

    if (Array.isArray(existingSignals)) {
      updatedSignals = [...existingSignals, newSignal];
    } else if (existingSignals) {
      updatedSignals = [existingSignals, newSignal];
    } else {
      updatedSignals = [newSignal];
    }

    // Add the new incoming lane first
    let updatedLanes = {
      ...crossroad.lanes,
      [direction]: {
        ...crossroad.lanes[direction],
        [type]: [...(crossroad.lanes[direction]?.[type] || []), newLane]
      }
    };

    // Regenerate outgoing lanes for the target direction based on new requirements
    const newOutgoingLanes = regenerateOutgoingLanes(updatedLanes, targetDirection);
    
    updatedLanes = {
      ...updatedLanes,
      [targetDirection]: {
        ...updatedLanes[targetDirection],
        outgoing: newOutgoingLanes
      }
    };

    const updatedCrossroad = {
      ...crossroad,
      lanes: updatedLanes,
      signals: {
        ...crossroad.signals,
        [direction]: updatedSignals
      }
    };

    onCrossroadChange(updatedCrossroad);
  };

  const determineDirection = (x, y) => {
    const distances = {
      north: y,
      south: CANVAS_HEIGHT - y,
      east: CANVAS_WIDTH - x,
      west: x
    };

    return Object.keys(distances).reduce((a, b) => 
      distances[a] < distances[b] ? a : b
    );
  };

  const handleObjectClick = (obj) => {
    setSelectedObject(obj);
    onSelectObject(obj);
  };

  const handleCanvasClick = (e) => {
    if (isDraggingObject) return; // Don't select if we're dragging
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;


    // Check signals first (higher priority for overlapping objects)
    let clickedObject = null;
    
    // Iterate through objects to find signals
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (obj.type === 'signal') {
        const isHit = x >= obj.x - 20 && x <= obj.x + 20 && y >= obj.y - 20 && y <= obj.y + 20;
        if (isHit) {
          clickedObject = obj;
          break;
        }
      }
    }

    // If no signal was clicked, check lanes
    if (!clickedObject) {
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (obj.type === 'signal') continue; // Skip signals, already checked
        
        // For lanes, check against extended rectangle
        const bounds = getLaneRect(obj);
        
        const isHit = x >= bounds.x && x <= bounds.x + bounds.width && 
               y >= bounds.y && y <= bounds.y + bounds.height;
        if (isHit) {
          clickedObject = obj;
          break;
        }
      }
    }

    if (clickedObject) {
      handleObjectClick(clickedObject);
    } else {
      setSelectedObject(null);
      onSelectObject(null);
    }
  };

  const handleMouseDown = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check signals first (higher priority for overlapping objects)
    let clickedObject = objects.find(obj => {
      if (obj.type === 'signal') {
        return x >= obj.x - 20 && x <= obj.x + 20 && y >= obj.y - 20 && y <= obj.y + 20;
      }
      return false;
    });

    // If no signal was clicked, check lanes
    if (!clickedObject) {
      clickedObject = objects.find(obj => {
        if (obj.type === 'signal') return false; // Skip signals, already checked
        
        // For lanes, check against extended rectangle
        const laneLength = (obj.length || 500) / 2;
        const laneWidth = 40;
        let bounds;
        
        if (obj.direction === 'north') {
          bounds = { x: obj.x - laneWidth/2, y: obj.y - laneLength, width: laneWidth, height: laneLength };
        } else if (obj.direction === 'south') {
          bounds = { x: obj.x - laneWidth/2, y: obj.y, width: laneWidth, height: laneLength };
        } else if (obj.direction === 'east') {
          bounds = { x: obj.x, y: obj.y - laneWidth/2, width: laneLength, height: laneWidth };
        } else if (obj.direction === 'west') {
          bounds = { x: obj.x - laneLength, y: obj.y - laneWidth/2, width: laneLength, height: laneWidth };
        } else {
          bounds = { x: obj.x - 20, y: obj.y - 20, width: 40, height: 40 };
        }
        
        return x >= bounds.x && x <= bounds.x + bounds.width && 
               y >= bounds.y && y <= bounds.y + bounds.height;
      });
    }

    if (clickedObject) {
      setIsDraggingObject(true);
      setDraggedObjectId(clickedObject.id);
      setDragOffset({ x: x - clickedObject.x, y: y - clickedObject.y });
      setHasMoved(false); // Reset movement flag
      setSelectedObject(clickedObject);
      onSelectObject(clickedObject);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDraggingObject || !draggedObjectId) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Mark that movement has occurred
    setHasMoved(true);

    // Update object position
    setObjects(prevObjects => 
      prevObjects.map(obj => 
        obj.id === draggedObjectId 
          ? { ...obj, x: x - dragOffset.x, y: y - dragOffset.y }
          : obj
      )
    );
  };

  const handleMouseUp = (e) => {
    if (isDraggingObject && draggedObjectId && hasMoved) {
      // Only update direction if the object was actually dragged
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const finalX = x - dragOffset.x;
      const finalY = y - dragOffset.y;
      const newDirection = determineDirection(finalX, finalY);
      
      // Update the crossroad data if direction changed
      const draggedObj = objects.find(obj => obj.id === draggedObjectId);
      if (draggedObj && draggedObj.direction !== newDirection) {
        // Remove from old direction
        const oldDirection = draggedObj.direction;
        const laneType = draggedObj.type === 'incoming-lane' ? 'incoming' : 'outgoing';
        
        const oldLanes = crossroad.lanes[oldDirection][laneType].filter(
          lane => lane.id !== draggedObj.laneId
        );
        
        // Add to new direction
        const movedLane = crossroad.lanes[oldDirection][laneType].find(
          lane => lane.id === draggedObj.laneId
        );
        
        if (movedLane) {
          let updatedCrossroad = {
            ...crossroad,
            lanes: {
              ...crossroad.lanes,
              [oldDirection]: {
                ...crossroad.lanes[oldDirection],
                [laneType]: oldLanes
              },
              [newDirection]: {
                ...crossroad.lanes[newDirection],
                [laneType]: [...crossroad.lanes[newDirection][laneType], { ...movedLane, direction: newDirection }]
              }
            }
          };
          
          // If moving an incoming lane, also move its associated signal
          if (laneType === 'incoming') {
            const oldDirectionSignals = crossroad.signals?.[oldDirection] || [];
            const newDirectionSignals = crossroad.signals?.[newDirection] || [];
            
            // Find and remove the signal from old direction
            const movedSignal = Array.isArray(oldDirectionSignals) 
              ? oldDirectionSignals.find(s => s.laneId === draggedObj.laneId)
              : (oldDirectionSignals.laneId === draggedObj.laneId ? oldDirectionSignals : null);
            
            if (movedSignal) {
              const remainingOldSignals = Array.isArray(oldDirectionSignals)
                ? oldDirectionSignals.filter(s => s.laneId !== draggedObj.laneId)
                : [];
              
              const updatedNewSignals = Array.isArray(newDirectionSignals)
                ? [...newDirectionSignals, { ...movedSignal, direction: newDirection }]
                : [{ ...movedSignal, direction: newDirection }];
              
              updatedCrossroad = {
                ...updatedCrossroad,
                signals: {
                  ...updatedCrossroad.signals,
                  [oldDirection]: remainingOldSignals,
                  [newDirection]: updatedNewSignals
                }
              };
            }
          }
          
          onCrossroadChange(updatedCrossroad);
        }
      }
    }
    
    setIsDraggingObject(false);
    setDraggedObjectId(null);
    setDragOffset({ x: 0, y: 0 });
    setHasMoved(false);
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw intersection center
    const intersectionSize = calculateIntersectionSize();
    
    ctx.fillStyle = '#bbb';
    ctx.fillRect(CANVAS_CENTER_X - intersectionSize, CANVAS_CENTER_Y - intersectionSize, intersectionSize * 2, intersectionSize * 2);
    
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Intersection', CANVAS_CENTER_X, CANVAS_CENTER_Y);
    ctx.fillText('Center', CANVAS_CENTER_X, CANVAS_CENTER_Y + 15);

    // Draw direction labels
    ctx.fillStyle = '#1976d2';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('NORTH', CANVAS_CENTER_X, 30);
    ctx.fillText('SOUTH', CANVAS_CENTER_X, CANVAS_HEIGHT - 20);
    ctx.save();
    ctx.translate(30, CANVAS_CENTER_Y);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('WEST', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(CANVAS_WIDTH - 30, CANVAS_CENTER_Y);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('EAST', 0, 0);
    ctx.restore();

    // Draw objects - draw lanes first, then signals on top
    const lanes = objects.filter(obj => obj.type !== 'signal');
    const signals = objects.filter(obj => obj.type === 'signal');
    
    // Draw lanes
    lanes.forEach(obj => {
      const isSelected = selectedObject?.id === obj.id;
      const isBeingDragged = isDraggingObject && draggedObjectId === obj.id;
      
      // Draw lane with length visualization
      ctx.fillStyle = obj.type === 'incoming-lane' ? '#2196f3' : '#4caf50';
      if (isSelected) {
        ctx.fillStyle = '#ff9800';
      }
      if (isBeingDragged) {
        ctx.globalAlpha = 0.7;
      }
      
      // Calculate lane rectangle based on direction
      const laneRect = getLaneRect(obj);
      
      ctx.fillRect(laneRect.x, laneRect.y, laneRect.width, laneRect.height);
      
      // Draw border
      ctx.strokeStyle = isSelected ? '#f57c00' : '#fff';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(laneRect.x, laneRect.y, laneRect.width, laneRect.height);

      ctx.globalAlpha = 1.0;

      // Draw directional arrow at the end of lane (near intersection)
      ctx.strokeStyle = '#fff';
      ctx.fillStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const laneType = obj.laneType || 'straight';
      drawLaneArrow(ctx, obj, laneType);
      
      // Draw lane ID at the free end (far from intersection) - only for incoming lanes
      if (obj.type === 'incoming-lane') {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Position label at the free end of the lane (far from intersection)
        let labelX = obj.x;
        let labelY = obj.y;
        const labelOffset = LANE_LENGTH_SCALED - 30; // 30px from the edge
        
        if (obj.direction === 'north') {
          // North lanes extend upward (negative Y), free end is up
          labelY = obj.y - labelOffset;
        } else if (obj.direction === 'south') {
          // South lanes extend downward (positive Y), free end is down
          labelY = obj.y + labelOffset;
        } else if (obj.direction === 'east') {
          // East lanes extend rightward (positive X), free end is right
          labelX = obj.x + labelOffset;
        } else if (obj.direction === 'west') {
          // West lanes extend leftward (negative X), free end is left
          labelX = obj.x - labelOffset;
        }
        
        // Draw background for label
        const textMetrics = ctx.measureText(obj.laneId);
        const padding = 4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
          labelX - textMetrics.width / 2 - padding,
          labelY - 9,
          textMetrics.width + padding * 2,
          18
        );
        
        // Draw text
        ctx.fillStyle = '#fff';
        ctx.fillText(obj.laneId, labelX, labelY);
      }
    });
    
    // Draw signals on top of lanes
    signals.forEach(obj => {
      const isSelected = selectedObject?.id === obj.id;
      const isBeingDragged = isDraggingObject && draggedObjectId === obj.id;
      
      // Draw traffic signal
      if (isBeingDragged) {
        ctx.globalAlpha = 0.7;
      }
      
      // Save context for rotation
      ctx.save();
      
      // Rotate for east and west directions
      if (obj.direction === 'east' || obj.direction === 'west') {
        ctx.translate(obj.x, obj.y);
        ctx.rotate(Math.PI / 2); // 90 degrees
        ctx.translate(-obj.x, -obj.y);
      }
      
      // Draw signal post
      ctx.fillStyle = '#333';
      ctx.fillRect(obj.x - 8, obj.y - 25, 16, 50);
      
      // Get live signal state if available
      let liveSignalState = obj.state || 'red';
      if (liveSignals?.[obj.direction]) {
        const directionSignals = liveSignals[obj.direction];
        if (Array.isArray(directionSignals)) {
          // Find the matching signal by ID or laneId
          const matchingSignal = directionSignals.find(s => s.id === obj.id || s.laneId === obj.laneId);
          if (matchingSignal) {
            liveSignalState = matchingSignal.state;
          }
        } else if (directionSignals.state) {
          // Single signal object
          liveSignalState = directionSignals.state;
        }
      }
      
      // Draw signal lights (red, yellow, green circles)
      // Red light
      ctx.fillStyle = liveSignalState === 'red' ? '#ff0000' : '#440000';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y - 12, LIGHT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      // Yellow light
      ctx.fillStyle = liveSignalState === 'yellow' ? '#ffff00' : '#444400';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, LIGHT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      // Green light
      ctx.fillStyle = liveSignalState === 'green' ? '#00ff00' : '#004400';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y + 12, LIGHT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      // Restore context after rotation
      ctx.restore();
      
      // Border if selected (draw after restore so it's not rotated)
      if (isSelected) {
        ctx.save();
        if (obj.direction === 'east' || obj.direction === 'west') {
          ctx.translate(obj.x, obj.y);
          ctx.rotate(Math.PI / 2);
          ctx.translate(-obj.x, -obj.y);
        }
        ctx.strokeStyle = '#f57c00';
        ctx.lineWidth = 3;
        ctx.strokeRect(obj.x - 12, obj.y - 28, 24, 56);
        ctx.restore();
      }
      
      ctx.globalAlpha = 1.0;
    });
  }, [objects, selectedObject, isDraggingObject, draggedObjectId, liveSignals]);

  useEffect(() => {
    drawCanvas();
  }, [objects, selectedObject, drawCanvas, liveSignals]);

  const drawLaneArrow = (ctx, obj, laneType) => {
    const offset = ARROW_OFFSET_FROM_INTERSECTION;
    const arrowConfig = {
      north: {
        incoming: {
          pos: { x: obj.x, y: obj.y - offset },
          straight: () => drawArrow(ctx, obj.x, obj.y - offset - ARROW_SIZE, obj.x, obj.y - offset + ARROW_SIZE, ARROW_SIZE/2),
          left: () => drawCurvedArrow(ctx, obj.x, obj.y - offset - ARROW_SIZE, obj.x + ARROW_SIZE, obj.y - offset + 5, 'left'),
          right: () => drawCurvedArrow(ctx, obj.x, obj.y - offset - ARROW_SIZE, obj.x - ARROW_SIZE, obj.y - offset + 5, 'right')
        },
        outgoing: () => drawArrow(ctx, obj.x, obj.y - offset + ARROW_SIZE, obj.x, obj.y - offset - ARROW_SIZE, ARROW_SIZE/2)
      },
      south: {
        incoming: {
          pos: { x: obj.x, y: obj.y + offset },
          straight: () => drawArrow(ctx, obj.x, obj.y + offset + ARROW_SIZE, obj.x, obj.y + offset - ARROW_SIZE, ARROW_SIZE/2),
          left: () => drawCurvedArrow(ctx, obj.x, obj.y + offset + ARROW_SIZE, obj.x - ARROW_SIZE, obj.y + offset - 5, 'left'),
          right: () => drawCurvedArrow(ctx, obj.x, obj.y + offset + ARROW_SIZE, obj.x + ARROW_SIZE, obj.y + offset - 5, 'right')
        },
        outgoing: () => drawArrow(ctx, obj.x, obj.y + offset - ARROW_SIZE, obj.x, obj.y + offset + ARROW_SIZE, ARROW_SIZE/2)
      },
      east: {
        incoming: {
          pos: { x: obj.x + offset, y: obj.y },
          straight: () => drawArrow(ctx, obj.x + offset + ARROW_SIZE, obj.y, obj.x + offset - ARROW_SIZE, obj.y, ARROW_SIZE/2),
          left: () => drawCurvedArrow(ctx, obj.x + offset + ARROW_SIZE, obj.y, obj.x + offset - 5, obj.y + ARROW_SIZE, 'left'),
          right: () => drawCurvedArrow(ctx, obj.x + offset + ARROW_SIZE, obj.y, obj.x + offset - 5, obj.y - ARROW_SIZE, 'right')
        },
        outgoing: () => drawArrow(ctx, obj.x + offset - ARROW_SIZE, obj.y, obj.x + offset + ARROW_SIZE, obj.y, ARROW_SIZE/2)
      },
      west: {
        incoming: {
          pos: { x: obj.x - offset, y: obj.y },
          straight: () => drawArrow(ctx, obj.x - offset - ARROW_SIZE, obj.y, obj.x - offset + ARROW_SIZE, obj.y, ARROW_SIZE/2),
          left: () => drawCurvedArrow(ctx, obj.x - offset - ARROW_SIZE, obj.y, obj.x - offset + 5, obj.y - ARROW_SIZE, 'left'),
          right: () => drawCurvedArrow(ctx, obj.x - offset - ARROW_SIZE, obj.y, obj.x - offset + 5, obj.y + ARROW_SIZE, 'right')
        },
        outgoing: () => drawArrow(ctx, obj.x - offset + ARROW_SIZE, obj.y, obj.x - offset - ARROW_SIZE, obj.y, ARROW_SIZE/2)
      }
    };

    const config = arrowConfig[obj.direction];
    if (!config) return;

    if (obj.type === 'incoming-lane') {
      const incomingConfig = config.incoming;
      if (incomingConfig[laneType]) {
        incomingConfig[laneType]();
      }
    } else {
      config.outgoing();
    }
  };

  // Helper function to draw a straight arrow
  const drawArrow = (ctx, fromX, fromY, toX, toY, headSize) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headSize * Math.cos(angle - Math.PI / 6),
      toY - headSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headSize * Math.cos(angle + Math.PI / 6),
      toY - headSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // Helper function to draw a curved arrow for turns
  const drawCurvedArrow = (ctx, fromX, fromY, toX, toY, turnDirection) => {
    const controlX = (fromX + toX) / 2;
    const controlY = (fromY + toY) / 2;
    
    // Draw curved line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo(controlX, controlY, toX, toY);
    ctx.stroke();
    
    // Draw arrowhead at the end
    const angle = Math.atan2(toY - controlY, toX - controlX);
    const headSize = 7;
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headSize * Math.cos(angle - Math.PI / 6),
      toY - headSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headSize * Math.cos(angle + Math.PI / 6),
      toY - headSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  return (
    <Box
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      sx={{
        position: 'relative',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        border: '2px solid #ddd',
        borderRadius: 1,
        cursor: isDraggingObject ? 'grabbing' : 'crosshair',
        backgroundColor: '#fafafa'
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          display: 'block',
          pointerEvents: 'none'
        }}
      />
    </Box>
  );
}

export default VisualDesignerCanvas;
