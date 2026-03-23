/**
 * Traffic Signal Control Algorithms
 * Implements various traffic light control strategies
 */

class TrafficSignalAlgorithms {
  static create(type, params = {}) {
    // Currently only fixed-time algorithm is supported
    return new FixedTimeAlgorithm(params);
  }
}

/**
 * Fixed-Time Algorithm
 * Classic approach with predetermined cycle times
 * Cycles through each direction one at a time: North → East → South → West
 */
class FixedTimeAlgorithm {
  constructor(params = {}) {
    this.type = 'fixed-time';
    this.cycleTime = params.cycleTime || 120; // seconds (4 directions)
    this.greenTime = params.greenTime || 20; // seconds per direction
    this.yellowTime = params.yellowTime || 3; // seconds
    this.allRedTime = params.allRedTime || 2; // seconds
    this.currentPhase = 0; // 0: North, 1: East, 2: South, 3: West
    this.phaseTime = 0;
    this.directions = ['north', 'east', 'south', 'west'];
  }

  update(signals, deltaTime) {
    if (!signals) {
      return;
    }
    
    this.phaseTime += deltaTime;

    const phaseLength = this.greenTime + this.yellowTime + this.allRedTime;
    const cyclePosition = this.phaseTime % (phaseLength * 4);
    const currentPhaseIndex = Math.floor(cyclePosition / phaseLength);
    const timeInCurrentPhase = cyclePosition % phaseLength;

    // Determine signal states based on time in phase
    if (timeInCurrentPhase < this.greenTime) {
      // Green phase for current direction
      this.setSignalState(signals, currentPhaseIndex, 'green');
    } else if (timeInCurrentPhase < this.greenTime + this.yellowTime) {
      // Yellow phase for current direction
      this.setSignalState(signals, currentPhaseIndex, 'yellow');
    } else {
      // All red phase (safety clearance)
      this.setSignalState(signals, currentPhaseIndex, 'red');
    }

    // Safety check: verify no conflicting green signals
    this.verifySafetyConstraints(signals);

    // Update time in state for each signal
    Object.values(signals).forEach(signal => {
      if (Array.isArray(signal)) {
        signal.forEach(s => s.timeInState += deltaTime);
      } else if (signal && typeof signal === 'object') {
        signal.timeInState += deltaTime;
      }
    });
  }

  setSignalState(signals, phaseIndex, state) {
    // Set the specified phase to the given state, all others to red
    this.directions.forEach((direction, index) => {
      const targetState = (index === phaseIndex) ? state : 'red';
      const signal = signals[direction];
      
      if (!signal) {
        return;
      }
      
      if (Array.isArray(signal)) {
        signal.forEach(s => {
          if (s.state !== targetState) {
            s.state = targetState;
            s.timeInState = 0;
          }
        });
      } else if (typeof signal === 'object') {
        if (signal.state !== targetState) {
          signal.state = targetState;
          signal.timeInState = 0;
        }
      }
    });
  }

  /**
   * Safety verification: Ensures no conflicting green signals
   * Checks that only one direction has green at a time
   */
  verifySafetyConstraints(signals) {
    const greenDirections = [];
    
    this.directions.forEach(direction => {
      const signal = signals[direction];
      if (!signal) return;
      
      const hasGreen = Array.isArray(signal)
        ? signal.some(s => s.state === 'green')
        : signal.state === 'green';
      
      if (hasGreen) {
        greenDirections.push(direction);
      }
    });

    // Safety check: Only one direction should be green at a time
    if (greenDirections.length > 1) {
      
      // Emergency action: Set all signals to red
      this.directions.forEach(direction => {
        const signal = signals[direction];
        if (Array.isArray(signal)) {
          signal.forEach(s => {
            s.state = 'red';
            s.timeInState = 0;
          });
        } else if (signal && typeof signal === 'object') {
          signal.state = 'red';
          signal.timeInState = 0;
        }
      });
      
      // Reset cycle
      this.phaseTime = this.greenTime + this.yellowTime;
    }

    return greenDirections.length <= 1;
  }
}

module.exports = TrafficSignalAlgorithms;
