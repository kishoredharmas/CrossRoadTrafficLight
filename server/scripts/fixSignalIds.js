const { sequelize } = require('../config/database');
const Crossroad = require('../models/Crossroad');

/**
 * Script to fix signal IDs and laneId references to match new lane IDs
 */

const fixSignalIds = async () => {
  try {
    
    // Get all crossroads
    const crossroads = await Crossroad.findAll();
    
    for (const crossroad of crossroads) {
      
      const lanes = crossroad.lanes;
      const signals = crossroad.signals;
      const updatedSignals = {};
      
      // Process each direction
      for (const direction of ['north', 'south', 'east', 'west']) {
        const incomingLanes = lanes[direction]?.incoming || [];
        const directionSignals = signals[direction];
        
        if (!directionSignals) {
          continue;
        }
        
        // Handle both array and single signal formats
        const signalArray = Array.isArray(directionSignals) ? directionSignals : [directionSignals];
        
        // Create updated signals array matching incoming lanes
        const updatedSignalArray = [];
        
        for (let i = 0; i < incomingLanes.length; i++) {
          const lane = incomingLanes[i];
          const oldSignal = signalArray[i] || signalArray[0] || { state: 'red', timeInState: 0 };
          
          const newSignal = {
            id: `SIG_${lane.id}`,
            state: oldSignal.state || 'red',
            timeInState: oldSignal.timeInState || 0,
            direction: direction,
            laneId: lane.id
          };
          
          updatedSignalArray.push(newSignal);
        }
        
        // Store as array if multiple signals, single object if one
        updatedSignals[direction] = updatedSignalArray.length === 1 ? updatedSignalArray[0] : updatedSignalArray;
      }
      
      // Update the crossroad
      await crossroad.update({ signals: updatedSignals });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing signal IDs:', error);
    process.exit(1);
  }
};

// Run the script
fixSignalIds();
