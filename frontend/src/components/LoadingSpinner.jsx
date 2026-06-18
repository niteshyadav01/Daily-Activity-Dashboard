import React from 'react';

const sizeMap = {
  xs: 'w-3 h-3 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

const LoadingSpinner = ({ size = 'md', className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div
      className={`${sizeMap[size] || sizeMap.md} border-slate-200 border-t-indigo-600 rounded-full animate-spin`}
    />
  </div>
);

export default LoadingSpinner;
