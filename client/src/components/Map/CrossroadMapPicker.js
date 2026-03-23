import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  MyLocation as MyLocationIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  Close as CloseIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, useMapEvents, useMap, CircleMarker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchIntersectionData, buildLanesFromArms, buildSignalsFromLanes } from '../../utils/overpassUtils';

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const DIRECTION_ICONS = {
  north: <ArrowUpward    fontSize="small" />,
  south: <ArrowDownward  fontSize="small" />,
  west:  <ArrowBack      fontSize="small" />,
  east:  <ArrowForward   fontSize="small" />,
};

const DIRECTION_COLORS = {
  north: '#1976d2',
  south: '#d32f2f',
  east:  '#388e3c',
  west:  '#f57c00',
};

/** Inner component: re-centres the map whenever mapCenter changes */
function SetViewOnChange({ center, zoom = 17 }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [center, zoom, map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Inner component that handles map click events */
function MapClickHandler({ onMapClick, isLoading }) {
  useMapEvents({
    click(e) {
      if (!isLoading) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * CrossroadMapPicker
 *
 * Props:
 *   open          {boolean}
 *   onClose       {() => void}
 *   onConfirm     {({ lanes, location, name }) => void}
 *   initialCenter {{ lat, lng }}
 */
function CrossroadMapPicker({ open, onClose, onConfirm, initialCenter }) {
  const [center]            = useState(initialCenter || { lat: 40.7128, lng: -74.006 });
  const [clickedPoint,    setClickedPoint]    = useState(null);  // { lat, lng }
  const [intersection,   setIntersection]   = useState(null);  // result from fetchIntersectionData
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [mapCenter,      setMapCenter]      = useState(center);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setClickedPoint(null);
      setIntersection(null);
      setError('');
      setSearchQuery('');
    }
  }, [open]);

  const handleMapClick = useCallback(async (lat, lng) => {
    setClickedPoint({ lat, lng });
    setIntersection(null);
    setError('');
    setLoading(true);
    try {
      const result = await fetchIntersectionData(lat, lng);
      setIntersection(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch intersection data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setError('');
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const results = await resp.json();
      if (results.length === 0) {
        setError('Location not found. Try a different search term.');
        return;
      }
      const { lat, lon } = results[0];
      setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setMapCenter({ lat: coords.latitude, lng: coords.longitude }),
      () => setError('Could not get your location.')
    );
  };

  const handleConfirm = () => {
    if (!intersection) return;
    const lanes    = buildLanesFromArms(intersection.arms);
    const signals  = buildSignalsFromLanes(lanes);
    const armNames = intersection.arms.map(a => a.wayName).filter(Boolean);
    const name     = armNames.length >= 2
      ? `${armNames[0]} & ${armNames[1]}`
      : armNames[0] || 'Imported Crossroad';

    onConfirm({
      lanes,
      signals,
      location: { lat: intersection.lat, lng: intersection.lng },
      name,
    });
  };

  const totalIncoming = intersection
    ? intersection.arms.reduce((s, a) => s + a.incomingCount, 0)
    : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { height: '90vh' } }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Select Crossroad from Map</Typography>
          <Typography variant="caption" color="text.secondary">
            Click on an intersection to automatically import its lane configuration
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
        {/* ── Left: map ───────────────────────────────────────────────────── */}
        <Box sx={{ flex: 1, position: 'relative', minWidth: 0 }}>
          {/* Search bar */}
          <Box sx={{
            position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1000,
            display: 'flex', gap: 1,
          }}>
            <TextField
              size="small"
              placeholder="Search for a location…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              sx={{ flex: 1, backgroundColor: 'white', borderRadius: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleSearch} disabled={searchLoading}>
                      {searchLoading ? <CircularProgress size={16} /> : <SearchIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Use my location">
              <IconButton
                size="small"
                onClick={handleUseMyLocation}
                sx={{ backgroundColor: 'white', '&:hover': { backgroundColor: '#f5f5f5' } }}
              >
                <MyLocationIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Loading overlay */}
          {loading && (
            <Box sx={{
              position: 'absolute', inset: 0, zIndex: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.6)',
            }}>
              <Box sx={{ textAlign: 'center', backgroundColor: 'white', p: 2, borderRadius: 2, boxShadow: 3 }}>
                <CircularProgress size={32} />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Querying OpenStreetMap…
                </Typography>
              </Box>
            </Box>
          )}

          {/* Hint overlay when nothing selected */}
          {!clickedPoint && !loading && (
            <Box sx={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              zIndex: 900, backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white', px: 2, py: 1, borderRadius: 2, whiteSpace: 'nowrap',
            }}>
              <Typography variant="caption">👆 Click on an intersection to import its lanes</Typography>
            </Box>
          )}

          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={16}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <SetViewOnChange center={mapCenter} />

            <MapClickHandler onMapClick={handleMapClick} isLoading={loading} />

            {/* Raw click point */}
            {clickedPoint && !intersection && (
              <CircleMarker
                center={[clickedPoint.lat, clickedPoint.lng]}
                radius={8} color="#1976d2" fillColor="#1976d2" fillOpacity={0.5}
              />
            )}

            {/* Detected intersection node */}
            {intersection && (
              <>
                <CircleMarker
                  center={[intersection.lat, intersection.lng]}
                  radius={10} color="#f57c00" fillColor="#f57c00" fillOpacity={0.85}
                >
                  <Popup>
                    <strong>Detected intersection</strong><br />
                    {intersection.arms.length} road arm(s) found
                  </Popup>
                </CircleMarker>

                {/* Arm polylines */}
                {intersection.arms.map(arm => {
                  const R = 0.0003; // ~33 m in degrees
                  const angleRad = (arm.bearing * Math.PI) / 180;
                  const endLat = intersection.lat + R * Math.cos(angleRad);
                  const endLng = intersection.lng + R * Math.sin(angleRad) / Math.cos((intersection.lat * Math.PI) / 180);
                  return (
                    <Polyline
                      key={arm.direction}
                      positions={[
                        [intersection.lat, intersection.lng],
                        [endLat, endLng],
                      ]}
                      color={DIRECTION_COLORS[arm.direction]}
                      weight={4}
                      opacity={0.85}
                    />
                  );
                })}
              </>
            )}
          </MapContainer>
        </Box>

        {/* ── Right: details panel ────────────────────────────────────────── */}
        <Box sx={{
          width: 320, flexShrink: 0, overflowY: 'auto',
          borderLeft: '1px solid #e0e0e0', p: 2, display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {/* Error */}
          {error && (
            <Alert severity="error" icon={<ErrorIcon />} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Idle state */}
          {!clickedPoint && !intersection && !error && (
            <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
              <Typography variant="body2" gutterBottom>
                <strong>How it works</strong>
              </Typography>
              <Typography variant="caption" display="block">
                1. Search for a city or address.<br />
                2. Navigate to an intersection on the map.<br />
                3. Click the intersection — OSM lane data is loaded automatically.<br />
                4. Confirm to apply the configuration.
              </Typography>
            </Box>
          )}

          {/* Loading */}
          {loading && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>Loading OSM data…</Typography>
            </Box>
          )}

          {/* Results */}
          {intersection && !loading && (
            <>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Intersection Found
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  OSM node #{intersection.nodeId} &nbsp;·&nbsp;
                  {intersection.lat.toFixed(5)}, {intersection.lng.toFixed(5)}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Detected Road Arms ({intersection.arms.length})
                </Typography>
                <List dense disablePadding>
                  {intersection.arms.map(arm => (
                    <ListItem key={arm.direction} disableGutters sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32, color: DIRECTION_COLORS[arm.direction] }}>
                        {DIRECTION_ICONS[arm.direction]}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                              {arm.direction}
                            </Typography>
                            {arm.wayName && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                – {arm.wayName}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.3 }}>
                            <Chip
                              label={`${arm.incomingCount} incoming`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                            <Chip
                              label={arm.highwayType}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                            {arm.isOneway && (
                              <Chip
                                label="one-way"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>Lane Summary</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`${intersection.arms.length} directions`} size="small" color="default" />
                  <Chip label={`${totalIncoming} incoming lanes`} size="small" color="primary" />
                </Box>
                {intersection.arms.some(a => a.turnLanes.some(t => t !== 'straight')) && (
                  <Alert severity="info" sx={{ mt: 1, py: 0 }}>
                    <Typography variant="caption">
                      Turn lanes detected from OSM data and pre-configured.
                    </Typography>
                  </Alert>
                )}
              </Box>

              <Alert severity="success" sx={{ py: 0.5 }}>
                <Typography variant="caption">
                  Click <strong>Import Configuration</strong> to apply these lanes to the designer.
                  You can adjust them manually afterwards.
                </Typography>
              </Alert>
            </>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 1.5, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Lane data sourced from OpenStreetMap via Overpass API
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={!intersection || loading}
            startIcon={<CheckCircleIcon />}
          >
            Import Configuration
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default CrossroadMapPicker;
