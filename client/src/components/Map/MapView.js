import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function MapView({ crossroad, vehicles }) {
  const defaultCenter = crossroad?.location || { lat: 40.7128, lng: -74.0060 };
  const [mapProvider] = useState('openstreetmap');

  const getTileLayerUrl = () => {
    switch (mapProvider) {
      case 'openstreetmap':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'google':
        // Note: Google Maps requires API key setup
        return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 300 }}>
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={getTileLayerUrl()}
        />
        
        {crossroad?.location && (
          <Marker position={[crossroad.location.lat, crossroad.location.lng]}>
            <Popup>
              {crossroad.name || 'Crossroad'}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </Box>
  );
}

export default MapView;
