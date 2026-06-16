import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiUpload, 
  FiZap, 
  FiList,
  FiBarChart2, 
  FiSettings 
} from 'react-icons/fi';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/employees', label: 'Employees', icon: FiUsers },
    { path: '/upload', label: 'Upload Excel', icon: FiUpload },
    { path: '/generate', label: 'Generate Activity', icon: FiZap },
    { path: '/history', label: 'History', icon: FiList },
    { path: '/reports', label: 'Reports', icon: FiBarChart2 },
    { path: '/settings', label: 'Settings', icon: FiSettings },
  ];

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white p-6 fixed left-0 top-0 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Activity Dashboard</h1>
        <p className="text-blue-200 text-sm mt-1">Employee Treadmill</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-white bg-opacity-20 border-l-4 border-white'
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* <div className="mt-12 pt-6 border-t border-blue-700">
        <p className="text-xs text-blue-200">© 2024 Activity Dashboard</p>
        <p className="text-xs text-blue-300 mt-2">Production Ready</p>
      </div> */}
    </div>
  );
};

export default Sidebar;
