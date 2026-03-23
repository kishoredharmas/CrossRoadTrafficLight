import React, { useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';

function CrossroadCanvas({ crossroad }) {
  const canvasRef = useRef(null);

  const drawCrossroad = useCallback((ctx, width, height, crossroad) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const roadWidth = 80;
    const laneWidth = 12;

    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    // Count active directions
    const hasNorth = (crossroad.lanes.north?.incoming?.length || 0) + (crossroad.lanes.north?.outgoing?.length || 0) > 0;
    const hasSouth = (crossroad.lanes.south?.incoming?.length || 0) + (crossroad.lanes.south?.outgoing?.length || 0) > 0;
    const hasEast = (crossroad.lanes.east?.incoming?.length || 0) + (crossroad.lanes.east?.outgoing?.length || 0) > 0;
    const hasWest = (crossroad.lanes.west?.incoming?.length || 0) + (crossroad.lanes.west?.outgoing?.length || 0) > 0;

    // Draw roads
    ctx.fillStyle = '#555';
    
    // Vertical road (North-South)
    if (hasNorth || hasSouth) {
      const northIncomingLanes = crossroad.lanes.north?.incoming?.length || 0;
      const northOutgoingLanes = crossroad.lanes.north?.outgoing?.length || 0;
      const southIncomingLanes = crossroad.lanes.south?.incoming?.length || 0;
      const southOutgoingLanes = crossroad.lanes.south?.outgoing?.length || 0;
      
      const northTotalLanes = northIncomingLanes + northOutgoingLanes;
      const southTotalLanes = southIncomingLanes + southOutgoingLanes;
      const maxVerticalLanes = Math.max(northTotalLanes, southTotalLanes, 2);
      const verticalRoadWidth = maxVerticalLanes * laneWidth;
      
      if (hasNorth) {
        ctx.fillRect(centerX - verticalRoadWidth / 2, 0, verticalRoadWidth, centerY - roadWidth / 2);
      }
      if (hasSouth) {
        ctx.fillRect(centerX - verticalRoadWidth / 2, centerY + roadWidth / 2, verticalRoadWidth, height);
      }
    }
    
    // Horizontal road (East-West)
    if (hasEast || hasWest) {
      const eastIncomingLanes = crossroad.lanes.east?.incoming?.length || 0;
      const eastOutgoingLanes = crossroad.lanes.east?.outgoing?.length || 0;
      const westIncomingLanes = crossroad.lanes.west?.incoming?.length || 0;
      const westOutgoingLanes = crossroad.lanes.west?.outgoing?.length || 0;
      
      const eastTotalLanes = eastIncomingLanes + eastOutgoingLanes;
      const westTotalLanes = westIncomingLanes + westOutgoingLanes;
      const maxHorizontalLanes = Math.max(eastTotalLanes, westTotalLanes, 2);
      const horizontalRoadWidth = maxHorizontalLanes * laneWidth;
      
      if (hasWest) {
        ctx.fillRect(0, centerY - horizontalRoadWidth / 2, centerX - roadWidth / 2, horizontalRoadWidth);
      }
      if (hasEast) {
        ctx.fillRect(centerX + roadWidth / 2, centerY - horizontalRoadWidth / 2, width, horizontalRoadWidth);
      }
    }

    // Draw intersection center
    ctx.fillStyle = '#666';
    ctx.fillRect(centerX - roadWidth / 2, centerY - roadWidth / 2, roadWidth, roadWidth);

    // Draw lane markings (dashed lines between lanes)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);

    // North lanes
    if (hasNorth) {
      const incomingLanes = crossroad.lanes.north?.incoming?.length || 0;
      const outgoingLanes = crossroad.lanes.north?.outgoing?.length || 0;
      drawLaneMarkings(ctx, 'north', incomingLanes, outgoingLanes, centerX, centerY, laneWidth);
    }

    // South lanes
    if (hasSouth) {
      const incomingLanes = crossroad.lanes.south?.incoming?.length || 0;
      const outgoingLanes = crossroad.lanes.south?.outgoing?.length || 0;
      drawLaneMarkings(ctx, 'south', incomingLanes, outgoingLanes, centerX, centerY, laneWidth);
    }

    // East lanes
    if (hasEast) {
      const incomingLanes = crossroad.lanes.east?.incoming?.length || 0;
      const outgoingLanes = crossroad.lanes.east?.outgoing?.length || 0;
      drawLaneMarkings(ctx, 'east', incomingLanes, outgoingLanes, centerX, centerY, laneWidth);
    }

    // West lanes
    if (hasWest) {
      const incomingLanes = crossroad.lanes.west?.incoming?.length || 0;
      const outgoingLanes = crossroad.lanes.west?.outgoing?.length || 0;
      drawLaneMarkings(ctx, 'west', incomingLanes, outgoingLanes, centerX, centerY, laneWidth);
    }

    ctx.setLineDash([]);

    // Draw solid lines separating incoming and outgoing lanes
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    drawIncomingOutgoingSeparators(ctx, 'north', centerX, centerY, crossroad, laneWidth);
    drawIncomingOutgoingSeparators(ctx, 'south', centerX, centerY, crossroad, laneWidth);
    drawIncomingOutgoingSeparators(ctx, 'east', centerX, centerY, crossroad, laneWidth);
    drawIncomingOutgoingSeparators(ctx, 'west', centerX, centerY, crossroad, laneWidth);

    // Draw traffic signals
    drawTrafficSignals(ctx, centerX, centerY, hasNorth, hasSouth, hasEast, hasWest, crossroad, laneWidth);

    // Draw labels
    drawLabels(ctx, centerX, centerY, crossroad, hasNorth, hasSouth, hasEast, hasWest);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !crossroad) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawCrossroad(ctx, canvas.width, canvas.height, crossroad);
  }, [crossroad, drawCrossroad]);

  const drawLaneMarkings = (ctx, direction, incomingCount, outgoingCount, centerX, centerY, laneWidth) => {
    const offset = 40;
    
    switch (direction) {
      case 'north':
        // Dashed lines between incoming lanes
        for (let i = 0; i < incomingCount - 1; i++) {
          const x = centerX - (incomingCount * laneWidth / 2) + (i + 1) * laneWidth;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, centerY - offset);
          ctx.stroke();
        }
        // Dashed lines between outgoing lanes
        for (let i = 0; i < outgoingCount - 1; i++) {
          const x = centerX + (outgoingCount * laneWidth / 2) - (i + 1) * laneWidth;
          ctx.beginPath();
          ctx.moveTo(x, centerY + offset);
          ctx.lineTo(x, 0);
          ctx.stroke();
        }
        break;
      
      case 'south':
        // Dashed lines between incoming lanes
        for (let i = 0; i < incomingCount - 1; i++) {
          const x = centerX + (incomingCount * laneWidth / 2) - (i + 1) * laneWidth;
          ctx.beginPath();
          ctx.moveTo(x, centerY + offset);
          ctx.lineTo(x, ctx.canvas.height);
          ctx.stroke();
        }
        // Dashed lines between outgoing lanes
        for (let i = 0; i < outgoingCount - 1; i++) {
          const x = centerX - (outgoingCount * laneWidth / 2) + (i + 1) * laneWidth;
          ctx.beginPath();
          ctx.moveTo(x, centerY - offset);
          ctx.lineTo(x, ctx.canvas.height);
          ctx.stroke();
        }
        break;
      
      case 'east':
        // Dashed lines between incoming lanes
        for (let i = 0; i < incomingCount - 1; i++) {
          const y = centerY - (incomingCount * laneWidth / 2) + (i + 1) * laneWidth;
          ctx.beginPath();
          ctx.moveTo(centerX + offset, y);
          ctx.lineTo(ctx.canvas.width, y);
          ctx.stroke();
        }
        // Dashed lines between outgoing lanes
        for (let i = 0; i < outgoingCount - 1; i++) {
          const y = centerY + (outgoingCount * laneWidth / 2) - (i + 1) * laneWidth;
          ctx.beginPath();
          ctx.moveTo(centerX - offset, y);
          ctx.lineTo(ctx.canvas.width, y);
          ctx.stroke();
        }
        break;
      
      case 'west':
        // Dashed lines between incoming lanes
        for (let i = 0; i < incomingCount - 1; i++) {
          const y = centerY + (incomingCount * laneWidth / 2) - (i + 1) * laneWidth;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(centerX - offset, y);
          ctx.stroke();
        }
        // Dashed lines between outgoing lanes
        for (let i = 0; i < outgoingCount - 1; i++) {
          const y = centerY - (outgoingCount * laneWidth / 2) + (i + 1) * laneWidth;
          ctx.beginPath();
          ctx.moveTo(centerX + offset, y);
          ctx.lineTo(0, y);
          ctx.stroke();
        }
        break;
      default:
        break;
    }
  };

  const drawIncomingOutgoingSeparators = (ctx, direction, centerX, centerY, crossroad, laneWidth) => {
    const incomingCount = crossroad.lanes[direction]?.incoming?.length || 0;
    const outgoingCount = crossroad.lanes[direction]?.outgoing?.length || 0;
    
    if (incomingCount === 0 || outgoingCount === 0) return;

    const offset = 40;

    switch (direction) {
      case 'north':
        // Solid yellow line between incoming and outgoing lanes
        const northIncomingRightX = centerX + (incomingCount * laneWidth / 2);
        const northOutgoingLeftX = centerX - (outgoingCount * laneWidth / 2);
        ctx.beginPath();
        ctx.moveTo(northOutgoingLeftX, centerY - offset);
        ctx.lineTo(northIncomingRightX, centerY - offset);
        ctx.stroke();
        break;
      
      case 'south':
        // Solid yellow line between incoming and outgoing lanes
        const southIncomingLeftX = centerX - (incomingCount * laneWidth / 2);
        const southOutgoingRightX = centerX + (outgoingCount * laneWidth / 2);
        ctx.beginPath();
        ctx.moveTo(southIncomingLeftX, centerY + offset);
        ctx.lineTo(southOutgoingRightX, centerY + offset);
        ctx.stroke();
        break;
      
      case 'east':
        // Solid yellow line between incoming and outgoing lanes
        const eastIncomingTopY = centerY - (incomingCount * laneWidth / 2);
        const eastOutgoingBottomY = centerY + (outgoingCount * laneWidth / 2);
        ctx.beginPath();
        ctx.moveTo(centerX + offset, eastIncomingTopY);
        ctx.lineTo(centerX + offset, eastOutgoingBottomY);
        ctx.stroke();
        break;
      
      case 'west':
        // Solid yellow line between incoming and outgoing lanes
        const westIncomingBottomY = centerY + (incomingCount * laneWidth / 2);
        const westOutgoingTopY = centerY - (outgoingCount * laneWidth / 2);
        ctx.beginPath();
        ctx.moveTo(centerX - offset, westOutgoingTopY);
        ctx.lineTo(centerX - offset, westIncomingBottomY);
        ctx.stroke();
        break;
      default:
        break;
    }
  };

  const drawTrafficSignals = (ctx, centerX, centerY, hasNorth, hasSouth, hasEast, hasWest, crossroad, laneWidth) => {
    const signalRadius = 5;
    const offset = 45;

    // North signals (one per incoming lane)
    if (hasNorth) {
      const incomingCount = crossroad.lanes.north?.incoming?.length || 0;
      for (let i = 0; i < incomingCount; i++) {
        const x = centerX - (incomingCount * laneWidth / 2) + (i * laneWidth) + laneWidth / 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(x - 5, centerY - offset - 10, 10, 20);
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(x, centerY - offset, signalRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // South signals (one per incoming lane)
    if (hasSouth) {
      const incomingCount = crossroad.lanes.south?.incoming?.length || 0;
      for (let i = 0; i < incomingCount; i++) {
        const x = centerX + (incomingCount * laneWidth / 2) - (i * laneWidth) - laneWidth / 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(x - 5, centerY + offset - 10, 10, 20);
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(x, centerY + offset, signalRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // East signals (one per incoming lane)
    if (hasEast) {
      const incomingCount = crossroad.lanes.east?.incoming?.length || 0;
      for (let i = 0; i < incomingCount; i++) {
        const y = centerY - (incomingCount * laneWidth / 2) + (i * laneWidth) + laneWidth / 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(centerX + offset - 10, y - 5, 20, 10);
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(centerX + offset, y, signalRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // West signals (one per incoming lane)
    if (hasWest) {
      const incomingCount = crossroad.lanes.west?.incoming?.length || 0;
      for (let i = 0; i < incomingCount; i++) {
        const y = centerY + (incomingCount * laneWidth / 2) - (i * laneWidth) - laneWidth / 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(centerX - offset - 10, y - 5, 20, 10);
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(centerX - offset, y, signalRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawLabels = (ctx, centerX, centerY, crossroad, hasNorth, hasSouth, hasEast, hasWest) => {
    ctx.fillStyle = '#1976d2';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';

    const getLaneText = (direction) => {
      const incoming = crossroad.lanes[direction]?.incoming?.length || 0;
      const outgoing = crossroad.lanes[direction]?.outgoing?.length || 0;
      return `${incoming}↓ ${outgoing}↑`;
    };

    if (hasNorth) {
      ctx.fillText('NORTH', centerX, 30);
      ctx.font = '11px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(getLaneText('north'), centerX, 50);
    }

    if (hasSouth) {
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#1976d2';
      ctx.fillText('SOUTH', centerX, ctx.canvas.height - 30);
      ctx.font = '11px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(getLaneText('south'), centerX, ctx.canvas.height - 15);
    }

    if (hasEast) {
      ctx.save();
      ctx.translate(ctx.canvas.width - 30, centerY);
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#1976d2';
      ctx.fillText('EAST', 0, 0);
      ctx.font = '11px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(getLaneText('east'), 0, 15);
      ctx.restore();
    }

    if (hasWest) {
      ctx.save();
      ctx.translate(30, centerY);
      ctx.rotate(Math.PI / 2);
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#1976d2';
      ctx.fillText('WEST', 0, 0);
      ctx.font = '11px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(getLaneText('west'), 0, 15);
      ctx.restore();
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}
      />
    </Box>
  );
}

export default CrossroadCanvas;
