const { sequelize } = require('../config/database');
const Crossroad = require('../models/Crossroad');

/**
 * Script to fix lane IDs to use simple sequential format (N1, N2, E1, E2, etc.)
 */

const fixLaneIds = async () => {
  try {
    
    // Get all crossroads
    const crossroads = await Crossroad.findAll();
    
    for (const crossroad of crossroads) {
      
      const lanes = crossroad.lanes;
      const updatedLanes = {};
      
      // Process each direction
      for (const direction of ['north', 'south', 'east', 'west']) {
        const prefix = direction.charAt(0).toUpperCase();
        updatedLanes[direction] = {
          incoming: [],
          outgoing: []
        };
        
        let counter = 1;
        
        // Process incoming lanes
        const incomingLanes = lanes[direction]?.incoming || [];
        for (const lane of incomingLanes) {
          const newId = `${prefix}${counter}`;
          counter++;
          updatedLanes[direction].incoming.push({
            ...lane,
            id: newId
          });
        }
        
        // Process outgoing lanes
        const outgoingLanes = lanes[direction]?.outgoing || [];
        for (const lane of outgoingLanes) {
          const newId = `${prefix}${counter}`;
          counter++;
          updatedLanes[direction].outgoing.push({
            ...lane,
            id: newId
          });
        }
      }
      
      // Update the crossroad
      await crossroad.update({ lanes: updatedLanes });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing lane IDs:', error);
    process.exit(1);
  }
};

// Run the script
fixLaneIds();
