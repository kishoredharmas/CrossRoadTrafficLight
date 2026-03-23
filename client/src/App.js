import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import SessionPage from './pages/SessionPage';
import CrossroadDesigner from './pages/CrossroadDesigner';
import SessionManager from './pages/SessionManager';
import RecordingManager from './pages/RecordingManager';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/session/:id" element={<SessionPage />} />
            <Route path="/designer" element={<CrossroadDesigner />} />
            <Route path="/designer/:id" element={<CrossroadDesigner />} />
            <Route path="/sessions" element={<SessionManager />} />
            <Route path="/recordings" element={<RecordingManager />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
