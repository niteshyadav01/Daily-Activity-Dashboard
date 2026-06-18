import React from 'react';
import { FiMenu, FiCalendar } from 'react-icons/fi';
import { formatDate, getCurrentDate } from '../utils/helpers';

const TopBar = ({ title, onMenuClick, actions }) => {
  const today = formatDate(getCurrentDate());

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{title}</h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Optional page-level action buttons */}
          {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}

          {/* Date pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <FiCalendar size={14} className="text-indigo-500" />
            <span className="text-xs font-semibold text-slate-600">{today}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
