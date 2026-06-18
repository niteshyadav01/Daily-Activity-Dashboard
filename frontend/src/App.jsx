import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Upload from './pages/Upload';
import GenerateActivity from './pages/GenerateActivity';
import History from './pages/History';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/employees" element={<Employees onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/upload" element={<Upload onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/generate" element={<GenerateActivity onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/history" element={<History onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/reports" element={<Reports onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/settings" element={<Settings onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}
