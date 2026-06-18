import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiUsers, FiUpload, FiZap,
  FiList, FiBarChart2, FiSettings, FiX, FiActivity
} from 'react-icons/fi';

const menuItems = [
  { path: '/',          label: 'Dashboard',        icon: FiHome,     color: 'text-indigo-400' },
  { path: '/employees', label: 'Employees',         icon: FiUsers,    color: 'text-sky-400' },
  { path: '/upload',    label: 'Upload Excel',      icon: FiUpload,   color: 'text-violet-400' },
  { path: '/generate',  label: 'Generate Activity', icon: FiZap,      color: 'text-amber-400' },
  { path: '/history',   label: 'History',           icon: FiList,     color: 'text-emerald-400' },
  { path: '/reports',   label: 'Reports',           icon: FiBarChart2,color: 'text-rose-400' },
  { path: '/settings',  label: 'Settings',          icon: FiSettings, color: 'text-slate-400' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo — clicking goes to home */}
      <div
        onClick={() => { navigate('/'); onClose(); }}
        className="flex items-center justify-between px-6 py-5 border-b border-slate-700/60 cursor-pointer hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <FiActivity size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Activity</p>
            <p className="text-xs text-slate-400 leading-tight">Dashboard</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Menu
        </p>
        {menuItems.map(({ path, label, icon: Icon, color }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);

          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon
                size={18}
                className={isActive ? 'text-white' : color + ' group-hover:text-white transition-colors'}
              />
              <span className="text-sm font-medium">{label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
            AD
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">Admin User</p>
            <p className="text-xs text-slate-500 truncate">Profile Data Center</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — fixed sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[260px] z-30 flex-col">
        {content}
      </aside>

      {/* Mobile — slide-in drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-[260px] z-30 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
};

export default Sidebar;
