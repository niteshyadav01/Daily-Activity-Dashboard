import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import pages
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Upload from './pages/Upload';
import GenerateActivity from './pages/GenerateActivity';
import History from './pages/History';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Import Sidebar
import Sidebar from './components/Sidebar';

export default function App() {
  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f3f4f6' }}>
        <Sidebar />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/generate" element={<GenerateActivity />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

