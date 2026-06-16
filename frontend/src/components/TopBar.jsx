import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { formatDate, getCurrentDate } from '../utils/helpers';

const TopBar = ({ title, onSearch }) => {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
          <FiSearch className="text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="bg-transparent outline-none text-sm w-48"
          />
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-600">Today</p>
          <p className="font-semibold text-gray-800">{formatDate(getCurrentDate())}</p>
        </div>

        {/* <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">AD</span>
        </div> */}
      </div>
    </div>
  );
};

export default TopBar;
