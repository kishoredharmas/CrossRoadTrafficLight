const express = require('express');
const router = express.Router();
const CrossroadManager = require('../services/CrossroadManager');

const crossroadManager = new CrossroadManager();

// Enrich crossroad lanes with coordinate data
function enrichCrossroadWithCoordinates(crossroad) {
  const CANVAS_CENTER_X = 700;
  const CANVAS_CENTER_Y = 500;
  const LANE_WIDTH = 40;
  const LANE_LENGTH_SCALED = 250;
  
  const maxLanes = Math.max(
    (crossroad.lanes.north?.incoming?.length || 0) + (crossroad.lanes.north?.outgoing?.length || 0),
    (crossroad.lanes.south?.incoming?.length || 0) + (crossroad.lanes.south?.outgoing?.length || 0),
    (crossroad.lanes.east?.incoming?.length || 0) + (crossroad.lanes.east?.outgoing?.length || 0),
    (crossroad.lanes.west?.incoming?.length || 0) + (crossroad.lanes.west?.outgoing?.length || 0)
  );
  const intersectionSize = Math.max(60, maxLanes * LANE_WIDTH / 2);

  const enrichedLanes = JSON.parse(JSON.stringify(crossroad.lanes));

  ['north', 'south', 'east', 'west'].forEach(direction => {
    const incomingLanes = enrichedLanes[direction]?.incoming || [];
    const outgoingLanes = enrichedLanes[direction]?.outgoing || [];
    
    const rightLanes = incomingLanes.filter(l => l.type === 'right');
    const straightLanes = incomingLanes.filter(l => l.type === 'straight');
    const leftLanes = incomingLanes.filter(l => l.type === 'left');
    const sortedIncoming = [...rightLanes, ...straightLanes, ...leftLanes];
    
    const incomingCount = incomingLanes.length;
    const outgoingCount = outgoingLanes.length;
    const totalLanes = incomingCount + outgoingCount;
    const offset = totalLanes * LANE_WIDTH / 2;

    sortedIncoming.forEach((lane, index) => {
      const originalLane = incomingLanes.find(l => l.id === lane.id);
      if (!originalLane) return;

      let startCoords, endCoords;

      switch (direction) {
        case 'north':
          startCoords = {
            x: CANVAS_CENTER_X - offset + (index * LANE_WIDTH) + LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y - intersectionSize / 2 - LANE_LENGTH_SCALED
          };
          endCoords = {
            x: CANVAS_CENTER_X - offset + (index * LANE_WIDTH) + LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y - intersectionSize / 2
          };
          break;
        case 'south':
          startCoords = {
            x: CANVAS_CENTER_X + offset - (index * LANE_WIDTH) - LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y + intersectionSize / 2 + LANE_LENGTH_SCALED
          };
          endCoords = {
            x: CANVAS_CENTER_X + offset - (index * LANE_WIDTH) - LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y + intersectionSize / 2
          };
          break;
        case 'east':
          startCoords = {
            x: CANVAS_CENTER_X + intersectionSize / 2 + LANE_LENGTH_SCALED,
            y: CANVAS_CENTER_Y - offset + (index * LANE_WIDTH) + LANE_WIDTH / 2
          };
          endCoords = {
            x: CANVAS_CENTER_X + intersectionSize / 2,
            y: CANVAS_CENTER_Y - offset + (index * LANE_WIDTH) + LANE_WIDTH / 2
          };
          break;
        case 'west':
          startCoords = {
            x: CANVAS_CENTER_X - intersectionSize / 2 - LANE_LENGTH_SCALED,
            y: CANVAS_CENTER_Y + offset - (index * LANE_WIDTH) - LANE_WIDTH / 2
          };
          endCoords = {
            x: CANVAS_CENTER_X - intersectionSize / 2,
            y: CANVAS_CENTER_Y + offset - (index * LANE_WIDTH) - LANE_WIDTH / 2
          };
          break;
      }

      originalLane.startCoords = startCoords;
      originalLane.endCoords = endCoords;
    });

    outgoingLanes.forEach((lane, index) => {
      let startCoords, endCoords;

      switch (direction) {
        case 'north':
          startCoords = {
            x: CANVAS_CENTER_X - offset + (incomingCount * LANE_WIDTH) + (index * LANE_WIDTH) + LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y - intersectionSize / 2
          };
          endCoords = {
            x: CANVAS_CENTER_X - offset + (incomingCount * LANE_WIDTH) + (index * LANE_WIDTH) + LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y - intersectionSize / 2 - LANE_LENGTH_SCALED
          };
          break;
        case 'south':
          startCoords = {
            x: CANVAS_CENTER_X + offset - (incomingCount * LANE_WIDTH) - (index * LANE_WIDTH) - LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y + intersectionSize / 2
          };
          endCoords = {
            x: CANVAS_CENTER_X + offset - (incomingCount * LANE_WIDTH) - (index * LANE_WIDTH) - LANE_WIDTH / 2,
            y: CANVAS_CENTER_Y + intersectionSize / 2 + LANE_LENGTH_SCALED
          };
          break;
        case 'east':
          startCoords = {
            x: CANVAS_CENTER_X + intersectionSize / 2,
            y: CANVAS_CENTER_Y - offset + (incomingCount * LANE_WIDTH) + (index * LANE_WIDTH) + LANE_WIDTH / 2
          };
          endCoords = {
            x: CANVAS_CENTER_X + intersectionSize / 2 + LANE_LENGTH_SCALED,
            y: CANVAS_CENTER_Y - offset + (incomingCount * LANE_WIDTH) + (index * LANE_WIDTH) + LANE_WIDTH / 2
          };
          break;
        case 'west':
          startCoords = {
            x: CANVAS_CENTER_X - intersectionSize / 2,
            y: CANVAS_CENTER_Y + offset - (incomingCount * LANE_WIDTH) - (index * LANE_WIDTH) - LANE_WIDTH / 2
          };
          endCoords = {
            x: CANVAS_CENTER_X - intersectionSize / 2 - LANE_LENGTH_SCALED,
            y: CANVAS_CENTER_Y + offset - (incomingCount * LANE_WIDTH) - (index * LANE_WIDTH) - LANE_WIDTH / 2
          };
          break;
      }

      lane.startCoords = startCoords;
      lane.endCoords = endCoords;
    });
  });

  return {
    ...crossroad,
    lanes: enrichedLanes
  };
}

// Get all crossroad designs
router.get('/', async (req, res) => {
  try {
    const crossroads = await crossroadManager.listCrossroads();
    res.json(crossroads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get crossroad by ID
router.get('/:id', async (req, res) => {
  try {
    const crossroad = await crossroadManager.getCrossroad(req.params.id);
    if (!crossroad) {
      return res.status(404).json({ error: 'Crossroad not found' });
    }
    // Enrich with coordinates before sending to client
    const enrichedCrossroad = enrichCrossroadWithCoordinates(crossroad);
    res.json(enrichedCrossroad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new crossroad design
router.post('/', async (req, res) => {
  try {
    const crossroad = await crossroadManager.createCrossroad(req.body);
    res.status(201).json(crossroad);
  } catch (error) {
    if (error.code === 'DUPLICATE_NAME') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update crossroad
router.put('/:id', async (req, res) => {
  try {
    const crossroad = await crossroadManager.updateCrossroad(req.params.id, req.body);
    if (!crossroad) {
      return res.status(404).json({ error: 'Crossroad not found' });
    }
    res.json(crossroad);
  } catch (error) {
    if (error.code === 'DUPLICATE_NAME') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete crossroad
router.delete('/:id', async (req, res) => {
  try {
    const success = await crossroadManager.deleteCrossroad(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Crossroad not found' });
    }
    res.json({ message: 'Crossroad deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
