import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

function SimulationCanvas({ crossroad, vehicles, signals }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to fixed dimensions for consistent coordinates
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw crossroad using actual design data
    if (crossroad && crossroad.lanes) {
      drawCrossroadDesign(ctx, canvas.width, canvas.height, crossroad);
    } else {
      // Fallback to simple crossroad if no design available
      drawSimpleCrossroad(ctx, canvas.width, canvas.height);
    }

    // Draw traffic signals
    if (signals) {
      drawSignals(ctx, signals, canvas.width, canvas.height, crossroad);
    }

    // Draw vehicles
    if (vehicles) {
      drawVehicles(ctx, vehicles, canvas.width, canvas.height);
    }
  }, [crossroad, vehicles, signals]);

  const drawCrossroadDesign = (ctx, width, height, crossroad) => {
    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    // If crossroad has intersection definition with coordinates, use it
    if (crossroad.intersection) {
      // Draw intersection
      ctx.fillStyle = '#666';
      const intersection = crossroad.intersection;
      const x = intersection.center.x - intersection.width / 2;
      const y = intersection.center.y - intersection.height / 2;
      ctx.fillRect(x, y, intersection.width, intersection.height);
    }

    // Draw all lanes using their coordinate data
    ctx.fillStyle = '#555';
    ['north', 'south', 'east', 'west'].forEach(direction => {
      const directionLanes = crossroad.lanes[direction];
      if (!directionLanes) return;

      // Draw incoming lanes
      directionLanes.incoming?.forEach(lane => {
        if (lane.corners && lane.corners.length === 4) {
          ctx.beginPath();
          ctx.moveTo(lane.corners[0].x, lane.corners[0].y);
          lane.corners.forEach((corner, i) => {
            if (i > 0) ctx.lineTo(corner.x, corner.y);
          });
          ctx.closePath();
          ctx.fill();
        }
      });

      // Draw outgoing lanes
      directionLanes.outgoing?.forEach(lane => {
        if (lane.corners && lane.corners.length === 4) {
          ctx.beginPath();
          ctx.moveTo(lane.corners[0].x, lane.corners[0].y);
          lane.corners.forEach((corner, i) => {
            if (i > 0) ctx.lineTo(corner.x, corner.y);
          });
          ctx.closePath();
          ctx.fill();
        }
      });
    });

    // Draw lane markings (white dashed lines between lanes)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);

    ['north', 'south', 'east', 'west'].forEach(direction => {
      const directionLanes = crossroad.lanes[direction];
      if (!directionLanes) return;

      // Draw lines between incoming lanes
      const incomingLanes = directionLanes.incoming || [];
      for (let i = 0; i < incomingLanes.length - 1; i++) {
        const lane1 = incomingLanes[i];
        const lane2 = incomingLanes[i + 1];
        
        if (lane1.corners && lane2.corners) {
          ctx.beginPath();
          // Draw line between shared edges
          if (direction === 'north' || direction === 'south') {
            // Vertical lanes - use right edge of lane1 / left edge of lane2
            ctx.moveTo(lane1.corners[1].x, lane1.corners[1].y);
            ctx.lineTo(lane1.corners[2].x, lane1.corners[2].y);
          } else {
            // Horizontal lanes
            ctx.moveTo(lane1.corners[1].x, lane1.corners[1].y);
            ctx.lineTo(lane1.corners[2].x, lane1.corners[2].y);
          }
          ctx.stroke();
        }
      }
    });
    
    ctx.setLineDash([]);
  };

  const drawLaneMarkings = (ctx, crossroad, centerX, centerY, laneWidth, hasNorth, hasSouth, hasEast, hasWest) => {
    const offset = 40;
    
    // North lanes
    if (hasNorth) {
      const incomingCount = crossroad.lanes.north?.incoming?.length || 0;
      for (let i = 0; i < incomingCount - 1; i++) {
        const x = centerX - (incomingCount * laneWidth / 2) + (i + 1) * laneWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, centerY - offset);
        ctx.stroke();
      }
    }
    
    // South lanes
    if (hasSouth) {
      const incomingCount = crossroad.lanes.south?.incoming?.length || 0;
      for (let i = 0; i < incomingCount - 1; i++) {
        const x = centerX + (incomingCount * laneWidth / 2) - (i + 1) * laneWidth;
        ctx.beginPath();
        ctx.moveTo(x, centerY + offset);
        ctx.lineTo(x, ctx.canvas.height);
        ctx.stroke();
      }
    }
    
    // East lanes
    if (hasEast) {
      const incomingCount = crossroad.lanes.east?.incoming?.length || 0;
      for (let i = 0; i < incomingCount - 1; i++) {
        const y = centerY - (incomingCount * laneWidth / 2) + (i + 1) * laneWidth;
        ctx.beginPath();
        ctx.moveTo(centerX + offset, y);
        ctx.lineTo(ctx.canvas.width, y);
        ctx.stroke();
      }
    }
    
    // West lanes
    if (hasWest) {
      const incomingCount = crossroad.lanes.west?.incoming?.length || 0;
      for (let i = 0; i < incomingCount - 1; i++) {
        const y = centerY + (incomingCount * laneWidth / 2) - (i + 1) * laneWidth;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(centerX - offset, y);
        ctx.stroke();
      }
    }
  };

  const drawSimpleCrossroad = (ctx, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const roadWidth = 60;

    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    // Draw roads
    ctx.fillStyle = '#555';
    
    // Vertical road (North-South)
    ctx.fillRect(centerX - roadWidth / 2, 0, roadWidth, height);
    
    // Horizontal road (East-West)
    ctx.fillRect(0, centerY - roadWidth / 2, width, roadWidth);

    // Draw lane markings
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);

    // Vertical lanes
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, centerY - roadWidth / 2);
    ctx.moveTo(centerX, centerY + roadWidth / 2);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Horizontal lanes
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(centerX - roadWidth / 2, centerY);
    ctx.moveTo(centerX + roadWidth / 2, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw intersection
    ctx.fillStyle = '#666';
    ctx.fillRect(
      centerX - roadWidth / 2,
      centerY - roadWidth / 2,
      roadWidth,
      roadWidth
    );
  };

  const drawSignals = (ctx, signals, width, height, crossroad) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const signalRadius = 5;
    const offset = 45;
    const laneWidth = 12;

    // Draw signals for each direction based on crossroad lanes
    ['north', 'south', 'east', 'west'].forEach(direction => {
      if (!crossroad || !crossroad.lanes || !crossroad.lanes[direction]) return;
      
      const incomingLanes = crossroad.lanes[direction]?.incoming || [];
      const incomingCount = incomingLanes.length;
      
      if (incomingCount === 0) return;
      
      // Get signal state for this direction
      const signalState = signals[direction]?.state || 'red';
      const color = signalState === 'green' ? '#0f0' :
                    signalState === 'yellow' ? '#ff0' : '#f00';
      
      // Draw a signal for each incoming lane
      for (let i = 0; i < incomingCount; i++) {
        let x, y;
        
        switch (direction) {
          case 'north':
            x = centerX - (incomingCount * laneWidth / 2) + (i * laneWidth) + laneWidth / 2;
            y = centerY - offset;
            // Draw signal post
            ctx.fillStyle = '#333';
            ctx.fillRect(x - 5, y - 10, 10, 20);
            break;
          case 'south':
            x = centerX + (incomingCount * laneWidth / 2) - (i * laneWidth) - laneWidth / 2;
            y = centerY + offset;
            ctx.fillStyle = '#333';
            ctx.fillRect(x - 5, y - 10, 10, 20);
            break;
          case 'east':
            x = centerX + offset;
            y = centerY - (incomingCount * laneWidth / 2) + (i * laneWidth) + laneWidth / 2;
            ctx.fillStyle = '#333';
            ctx.fillRect(x - 10, y - 5, 20, 10);
            break;
          case 'west':
            x = centerX - offset;
            y = centerY + (incomingCount * laneWidth / 2) - (i * laneWidth) - laneWidth / 2;
            ctx.fillStyle = '#333';
            ctx.fillRect(x - 10, y - 5, 20, 10);
            break;
          default:
            return;
        }
        
        // Draw signal light
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, signalRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawVehicles = (ctx, vehicles, width, height) => {
    vehicles.forEach(vehicle => {
      // Use vehicle's calculated X,Y coordinates directly
      if (!vehicle.x || !vehicle.y) {
        return; // Skip vehicles without coordinates
      }

      const x = vehicle.x;
      const y = vehicle.y;

      // Draw vehicle
      ctx.fillStyle = vehicle.type === 'car' ? '#00f' :
                     vehicle.type === 'truck' ? '#f80' :
                     vehicle.type === 'bus' ? '#f00' : '#0ff';
      
      const vehicleLength = vehicle.type === 'truck' || vehicle.type === 'bus' ? 12 : 8;
      const vehicleWidth = 6;

      // Determine vehicle orientation based on direction
      if (vehicle.direction === 'north' || vehicle.direction === 'south') {
        ctx.fillRect(x - vehicleWidth / 2, y - vehicleLength / 2, vehicleWidth, vehicleLength);
      } else {
        ctx.fillRect(x - vehicleLength / 2, y - vehicleWidth / 2, vehicleLength, vehicleWidth);
      }
    });
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
    </Box>
  );
}

export default SimulationCanvas;
