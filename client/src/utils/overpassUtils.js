/**
 * Utility functions for querying the OpenStreetMap Overpass API
 * to extract intersection road/lane data for the crossroad designer.
 */

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const LANE_LENGTH_METERS = 500;

// Cardinal direction helpers
const OPPOSITE     = { north: 'south', south: 'north', east: 'west',  west: 'east'  };
const LEFT_TURN    = { north: 'east',  east: 'south',  south: 'west', west: 'north' };
const RIGHT_TURN   = { north: 'west',  west: 'south',  south: 'east', east: 'north' };

function toRadians(deg) { return (deg * Math.PI) / 180; }
function toDegrees(rad) { return (rad * 180) / Math.PI; }

/** Compute bearing (0-360°, 0=North) from point A to point B. */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = toRadians(lng2 - lng1);
  const φ1   = toRadians(lat1);
  const φ2   = toRadians(lat2);
  const y    = Math.sin(dLng) * Math.cos(φ2);
  const x    = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/** Snap a bearing to N / E / S / W. */
export function snapToCardinal4(bearing) {
  if (bearing >= 315 || bearing < 45)  return 'north';
  if (bearing >= 45  && bearing < 135) return 'east';
  if (bearing >= 135 && bearing < 225) return 'south';
  return 'west';
}

/** Haversine distance in metres between two lat/lng points. */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R    = 6_371_000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Parse a OSM `turn:lanes` string into an array of 'straight' | 'left' | 'right'. */
function parseTurnLanes(turnStr, count) {
  if (!turnStr || !turnStr.trim()) return Array(count).fill('straight');
  const parts = turnStr.split('|').map(t => {
    const v = t.trim().toLowerCase();
    if (v.includes('left')  && !v.includes('right') && !v.includes('through')) return 'left';
    if (v.includes('right') && !v.includes('left')  && !v.includes('through')) return 'right';
    return 'straight';
  });
  while (parts.length < count) parts.push('straight');
  return parts.slice(0, count);
}

/**
 * Fetch road/intersection data from the Overpass API for the given coordinate.
 *
 * Returns:
 *   { nodeId, lat, lng, arms: [ { direction, bearing, incomingCount, turnLanes, wayName, highwayType, isOneway } ] }
 */
export async function fetchIntersectionData(lat, lng) {
  // Query all highway ways within ~80 m, with full geometry so we can compute bearings.
  const query = `
[out:json][timeout:20];
(
  way(around:80,${lat},${lng})
    [highway]
    [highway!~"^(footway|cycleway|path|steps|pedestrian|service|track|proposed|construction|elevator|corridor)$"];
);
out geom;
`;

  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.elements || data.elements.length === 0) {
    throw new Error('No roads found near the selected point. Try clicking closer to a road intersection.');
  }

  // ── Build node → ways index ──────────────────────────────────────────────
  const nodeWays   = {};   // nodeId (string) → Way[]
  const nodeCoords = {};   // nodeId (string) → { lat, lng }

  data.elements.forEach(way => {
    if (way.type !== 'way' || !way.geometry || !way.nodes) return;
    way.nodes.forEach((nodeId, idx) => {
      const g = way.geometry[idx];
      if (!g) return;
      const nid = String(nodeId);
      nodeCoords[nid] = { lat: g.lat, lng: g.lon };
      if (!nodeWays[nid]) nodeWays[nid] = [];
      nodeWays[nid].push(way);
    });
  });

  // ── Find best intersection node ──────────────────────────────────────────
  // Prefer nodes shared by the most ways that are closest to the click.
  let bestNode = null;
  let bestWays = 0;
  let bestDist = Infinity;

  Object.entries(nodeWays).forEach(([nid, ways]) => {
    if (ways.length < 2) return;
    const { lat: nLat, lng: nLng } = nodeCoords[nid];
    const dist = haversineDistance(lat, lng, nLat, nLng);
    if (dist > 120) return;
    if (ways.length > bestWays || (ways.length === bestWays && dist < bestDist)) {
      bestWays = ways.length;
      bestDist = dist;
      bestNode = { id: nid, lat: nLat, lng: nLng, ways };
    }
  });

  // Fallback: nearest node on any way (may be a T-junction with 1 extra way)
  if (!bestNode) {
    Object.entries(nodeCoords).forEach(([nid, { lat: nLat, lng: nLng }]) => {
      const dist = haversineDistance(lat, lng, nLat, nLng);
      if (dist < bestDist) {
        bestDist = dist;
        bestNode = { id: nid, lat: nLat, lng: nLng, ways: nodeWays[nid] || [] };
      }
    });
  }

  if (!bestNode) {
    throw new Error('No intersection node found near the selected point.');
  }

  // ── Extract road arms from the intersection node ─────────────────────────
  const seenDirections = new Set();
  const arms = [];

  bestNode.ways.forEach(way => {
    if (!way.geometry || !way.nodes) return;
    const tags = way.tags || {};

    const nodeIdx = way.nodes.indexOf(parseInt(bestNode.id, 10));
    if (nodeIdx === -1) return;

    // Determine how many lanes flow toward / away from this node
    const totalLanes    = parseInt(tags['lanes'])              || 2;
    const lanesForward  = parseInt(tags['lanes:forward'])      || Math.ceil(totalLanes / 2);
    const lanesBackward = parseInt(tags['lanes:backward'])     || Math.floor(totalLanes / 2);
    const isOneway      = tags['oneway'] === 'yes' || tags['oneway'] === '1';
    const turnFwd       = tags['turn:lanes:forward']  || tags['turn:lanes']          || '';
    const turnBwd       = tags['turn:lanes:backward'] || '';

    /**
     * Walk along the geometry from `startIdx` in `delta` direction (+1/-1)
     * until we find a node at least `minDist` metres from the intersection.
     */
    const getArmPoint = (startIdx, delta, minDist = 15) => {
      let idx = startIdx + delta;
      while (idx >= 0 && idx < way.geometry.length) {
        const g = way.geometry[idx];
        if (haversineDistance(bestNode.lat, bestNode.lng, g.lat, g.lon) >= minDist) {
          return { lat: g.lat, lng: g.lon };
        }
        idx += delta;
      }
      return null;
    };

    const processArm = (armPoint, isForwardArm) => {
      if (!armPoint) return;
      const bearing   = calculateBearing(bestNode.lat, bestNode.lng, armPoint.lat, armPoint.lng);
      const direction = snapToCardinal4(bearing);

      if (seenDirections.has(direction)) return; // already have this cardinal direction
      seenDirections.add(direction);

      // Incoming traffic (approaching the intersection) comes from the other end of this arm.
      // • forward arm: traffic comes FROM the forward direction → travels BACKWARD (lanesBackward)
      // • backward arm: traffic comes FROM the backward direction → travels FORWARD (lanesForward)
      let incomingCount;
      let turnLanesStr;

      if (isOneway) {
        // One-way toward the intersection = backward arm; away = forward arm.
        incomingCount = isForwardArm ? 0 : totalLanes;
        turnLanesStr  = isForwardArm ? '' : turnFwd;
      } else {
        incomingCount = isForwardArm ? lanesBackward : lanesForward;
        turnLanesStr  = isForwardArm ? turnBwd       : turnFwd;
      }

      // Always give at least 1 incoming lane on a road that reaches the intersection.
      if (incomingCount === 0 && !isOneway) incomingCount = 1;

      arms.push({
        direction,
        bearing,
        incomingCount: Math.max(1, incomingCount),
        turnLanes: parseTurnLanes(turnLanesStr, Math.max(1, incomingCount)),
        wayName:     tags['name'] || tags['ref'] || '',
        highwayType: tags['highway'] || 'road',
        isOneway,
      });
    };

    processArm(getArmPoint(nodeIdx, +1), true);
    processArm(getArmPoint(nodeIdx, -1), false);
  });

  if (arms.length === 0) {
    throw new Error('Could not extract any road arms from the selected intersection.');
  }

  return {
    nodeId: bestNode.id,
    lat:    bestNode.lat,
    lng:    bestNode.lng,
    arms,
  };
}

/**
 * Convert the fetched intersection arms into the app's lane data structure:
 *   { north: { incoming: [], outgoing: [] }, south: …, east: …, west: … }
 */
export function buildLanesFromArms(arms) {
  const lanes = {
    north: { incoming: [], outgoing: [] },
    south: { incoming: [], outgoing: [] },
    east:  { incoming: [], outgoing: [] },
    west:  { incoming: [], outgoing: [] },
  };

  // --- Incoming lanes -------------------------------------------------------
  arms.forEach(({ direction, incomingCount, turnLanes }) => {
    if (incomingCount === 0) return;
    const prefix   = direction.charAt(0).toUpperCase();
    const incoming = [];
    for (let i = 0; i < incomingCount; i++) {
      incoming.push({
        id:        `${prefix}${i + 1}`,
        type:      turnLanes[i] || 'straight',
        direction,
        length:    LANE_LENGTH_METERS,
        pairId:    null,
      });
    }
    lanes[direction].incoming = incoming;
  });

  // --- Outgoing lanes (auto-calculated from incoming, mirrors app logic) ----
  ['north', 'south', 'east', 'west'].forEach(targetDir => {
    let maxFromAny = 0;
    ['north', 'south', 'east', 'west'].forEach(srcDir => {
      const count = (lanes[srcDir].incoming || []).filter(lane => {
        if (lane.type === 'straight') return OPPOSITE[srcDir]  === targetDir;
        if (lane.type === 'left')     return LEFT_TURN[srcDir]  === targetDir;
        if (lane.type === 'right')    return RIGHT_TURN[srcDir] === targetDir;
        return false;
      }).length;
      maxFromAny = Math.max(maxFromAny, count);
    });

    if (maxFromAny > 0) {
      const prefix    = targetDir.charAt(0).toUpperCase();
      const usedIds   = new Set(lanes[targetDir].incoming.map(l => l.id));
      const outgoing  = [];
      let   laneNum   = 1;

      for (let i = 0; i < maxFromAny; i++) {
        while (usedIds.has(`${prefix}${laneNum}`)) laneNum++;
        outgoing.push({
          id:        `${prefix}${laneNum}`,
          type:      'straight',
          direction: targetDir,
          length:    LANE_LENGTH_METERS,
          pairId:    null,
        });
        usedIds.add(`${prefix}${laneNum}`);
        laneNum++;
      }
      lanes[targetDir].outgoing = outgoing;
    }
  });

  return lanes;
}

/**
 * Build the `signals` object that the app expects, mirroring the auto-signal
 * creation done in VisualDesignerCanvas when a lane is dropped manually:
 *   { north: [{ id, state, timeInState, direction, laneId }], ... }
 *
 * One signal is created per incoming lane.
 */
export function buildSignalsFromLanes(lanes) {
  const signals = {};
  ['north', 'south', 'east', 'west'].forEach(direction => {
    const incoming = lanes[direction]?.incoming || [];
    if (incoming.length === 0) return;
    signals[direction] = incoming.map(lane => ({
      id:          `SIG_${lane.id}`,
      state:       'red',
      timeInState: 0,
      direction,
      laneId:      lane.id,
    }));
  });
  return signals;
}
