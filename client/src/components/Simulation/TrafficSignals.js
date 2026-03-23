import React from 'react';
import { Box, Typography } from '@mui/material';
import { Circle } from '@mui/icons-material';

function TrafficSignals({ signals }) {
  if (!signals) {
    return <Typography color="text.secondary">No signal data</Typography>;
  }

  const getSignalColor = (state) => {
    switch (state) {
      case 'green':
        return '#4caf50';
      case 'yellow':
        return '#ff9800';
      case 'red':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <Box>
      {Object.entries(signals).map(([direction, signal]) => (
        <Box
          key={direction}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            p: 1,
            borderRadius: 1,
            backgroundColor: '#f5f5f5'
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
              {direction}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round(signal.timeInState)}s in state
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Circle
              sx={{
                fontSize: 24,
                color: getSignalColor(signal.state)
              }}
            />
            <Typography
              variant="body2"
              sx={{
                textTransform: 'uppercase',
                fontWeight: 'bold',
                color: getSignalColor(signal.state)
              }}
            >
              {signal.state}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default TrafficSignals;
