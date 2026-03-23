const TrafficSignalAlgorithms = require('../../server/simulation/algorithms/TrafficSignalAlgorithms');

describe('TrafficSignalAlgorithms', () => {
  describe('FixedTimeAlgorithm', () => {
    let algorithm;
    let mockSignals;

    beforeEach(() => {
      algorithm = TrafficSignalAlgorithms.create('fixed-time', {
        greenTime: 20,
        yellowTime: 3,
        allRedTime: 2,
        cycleTime: 100
      });

      mockSignals = {
        north: [{ id: 'n1', state: 'red', timeInState: 0 }],
        east: [{ id: 'e1', state: 'red', timeInState: 0 }],
        south: [{ id: 's1', state: 'red', timeInState: 0 }],
        west: [{ id: 'w1', state: 'red', timeInState: 0 }]
      };
    });

    it('should initialize with correct parameters', () => {
      expect(algorithm.type).toBe('fixed-time');
      expect(algorithm.greenTime).toBe(20);
      expect(algorithm.yellowTime).toBe(3);
      expect(algorithm.allRedTime).toBe(2);
    });

    it('should use default parameters if not provided', () => {
      const defaultAlgorithm = TrafficSignalAlgorithms.create('fixed-time');
      
      expect(defaultAlgorithm.greenTime).toBe(20);
      expect(defaultAlgorithm.yellowTime).toBe(3);
      expect(defaultAlgorithm.allRedTime).toBe(2);
    });

    describe('update', () => {
      it('should start with north direction green', () => {
        algorithm.update(mockSignals, 1);
        
        expect(mockSignals.north[0].state).toBe('green');
        expect(mockSignals.east[0].state).toBe('red');
        expect(mockSignals.south[0].state).toBe('red');
        expect(mockSignals.west[0].state).toBe('red');
      });

      it('should start with north direction green after first update', () => {
        algorithm.update(mockSignals, 1);
        
        expect(mockSignals.north[0].state).toBe('green');
        expect(mockSignals.east[0].state).toBe('red');
        expect(mockSignals.south[0].state).toBe('red');
        expect(mockSignals.west[0].state).toBe('red');
      });

      it('should cycle through phases correctly', () => {
        const phaseLength = 20 + 3 + 2; // green + yellow + all-red

        // North phase
        algorithm.update(mockSignals, 10);
        expect(mockSignals.north[0].state).toBe('green');

        // Fast forward to east phase
        algorithm.update(mockSignals, phaseLength);
        expect(mockSignals.east[0].state).toBe('green');
        expect(mockSignals.north[0].state).toBe('red');

        // Fast forward to south phase
        algorithm.update(mockSignals, phaseLength);
        expect(mockSignals.south[0].state).toBe('green');
        expect(mockSignals.east[0].state).toBe('red');

        // Fast forward to west phase
        algorithm.update(mockSignals, phaseLength);
        expect(mockSignals.west[0].state).toBe('green');
        expect(mockSignals.south[0].state).toBe('red');
      });

      it('should cycle through all four directions', () => {
        const phaseLength = 20 + 3 + 2; // green + yellow + all-red

        // North phase
        algorithm.update(mockSignals, 1);
        expect(mockSignals.north[0].state).toBe('green');

        // Fast forward to east phase
        algorithm.update(mockSignals, phaseLength - 1);
        algorithm.update(mockSignals, 1);
        expect(mockSignals.east[0].state).toBe('green');
        expect(mockSignals.north[0].state).toBe('red');

        // Fast forward to south phase
        algorithm.update(mockSignals, phaseLength - 1);
        algorithm.update(mockSignals, 1);
        expect(mockSignals.south[0].state).toBe('green');
        expect(mockSignals.east[0].state).toBe('red');

        // Fast forward to west phase
        algorithm.update(mockSignals, phaseLength - 1);
        algorithm.update(mockSignals, 1);
        expect(mockSignals.west[0].state).toBe('green');
        expect(mockSignals.south[0].state).toBe('red');
      });

      it('should handle multiple signals per direction', () => {
        mockSignals.north = [
          { id: 'n1', state: 'red', timeInState: 0 },
          { id: 'n2', state: 'red', timeInState: 0 }
        ];

        algorithm.update(mockSignals, 1);

        expect(mockSignals.north[0].state).toBe('green');
        expect(mockSignals.north[1].state).toBe('green');
      });

      it('should update timeInState for all signals', () => {
        const deltaTime = 5;
        algorithm.update(mockSignals, deltaTime);

        Object.values(mockSignals).forEach(signalArray => {
          signalArray.forEach(signal => {
            expect(signal.timeInState).toBeGreaterThanOrEqual(deltaTime);
          });
        });
      });

      it('should not crash with null signals', () => {
        expect(() => algorithm.update(null, 1)).not.toThrow();
      });

      it('should handle missing direction signals gracefully', () => {
        const partialSignals = {
          north: [{ id: 'n1', state: 'red', timeInState: 0 }],
          east: [{ id: 'e1', state: 'red', timeInState: 0 }]
          // Missing south and west
        };

        expect(() => algorithm.update(partialSignals, 1)).not.toThrow();
      });
    });

    describe('setSignalState', () => {
      it('should set specified phase to green and others to red', () => {
        algorithm.setSignalState(mockSignals, 0, 'green'); // North green
        
        expect(mockSignals.north[0].state).toBe('green');
        expect(mockSignals.east[0].state).toBe('red');
        expect(mockSignals.south[0].state).toBe('red');
        expect(mockSignals.west[0].state).toBe('red');
      });

      it('should set specified phase to yellow and others to red', () => {
        algorithm.setSignalState(mockSignals, 1, 'yellow'); // East yellow
        
        expect(mockSignals.north[0].state).toBe('red');
        expect(mockSignals.east[0].state).toBe('yellow');
        expect(mockSignals.south[0].state).toBe('red');
        expect(mockSignals.west[0].state).toBe('red');
      });

      it('should reset timeInState when state changes', () => {
        mockSignals.north[0].timeInState = 10;
        
        algorithm.setSignalState(mockSignals, 0, 'green');
        
        expect(mockSignals.north[0].timeInState).toBe(0);
      });
    });

    describe('verifySafetyConstraints', () => {
      it('should allow only one direction to be green', () => {
        algorithm.update(mockSignals, 1);
        
        const greenDirections = Object.keys(mockSignals).filter(dir => 
          mockSignals[dir].some(s => s.state === 'green')
        );

        expect(greenDirections.length).toBeLessThanOrEqual(1);
      });
    });
  });
});
