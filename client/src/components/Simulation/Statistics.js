import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

function Statistics({ simulationTime, vehicleCount }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Simulation Time
        </Typography>
        <Typography variant="h5">
          {formatTime(simulationTime || 0)}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Active Vehicles
        </Typography>
        <Typography variant="h5">
          {vehicleCount || 0}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Average Wait Time
        </Typography>
        <Typography variant="h5">
          -- s
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="body2" color="text.secondary">
          Throughput
        </Typography>
        <Typography variant="h5">
          -- veh/min
        </Typography>
      </Box>
    </Box>
  );
}

export default Statistics;
