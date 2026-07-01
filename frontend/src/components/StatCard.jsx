import React from 'react';

const colorMap = {
  indigo:  { bg: 'bg-indigo-50',  icon: 'bg-indigo-100 text-indigo-600',  border: 'border-indigo-100',  value: 'text-indigo-700' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600',border: 'border-emerald-100', value: 'text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',    border: 'border-amber-100',   value: 'text-amber-700' },
  rose:    { bg: 'bg-rose-50',    icon: 'bg-rose-100 text-rose-600',      border: 'border-rose-100',    value: 'text-rose-700' },
  sky:     { bg: 'bg-sky-50',     icon: 'bg-sky-100 text-sky-600',        border: 'border-sky-100',     value: 'text-sky-700' },
  violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-600',  border: 'border-violet-100',  value: 'text-violet-700' },
  // legacy aliases
  blue:    { bg: 'bg-indigo-50',  icon: 'bg-indigo-100 text-indigo-600',  border: 'border-indigo-100',  value: 'text-indigo-700' },
  green:   { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600',border: 'border-emerald-100', value: 'text-emerald-700' },
  orange:  { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',    border: 'border-amber-100',   value: 'text-amber-700' },
  red:     { bg: 'bg-rose-50',    icon: 'bg-rose-100 text-rose-600',      border: 'border-rose-100',    value: 'text-rose-700' },
};

const StatCard = ({ title, value, icon: Icon, color = 'indigo', subtitle, trend }) => {
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="card h-full min-h-[92px] p-4 flex flex-col gap-2 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
            <Icon size={18} />
          </div>
        )}
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide leading-snug break-normal">
          {title}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <p className={`text-2xl font-extrabold leading-tight whitespace-nowrap text-center ${c.value}`}>
          {value ?? '—'}
        </p>
      </div>

      {trend !== undefined && (
        <div className="mt-auto pt-2 border-t border-slate-100">
          <p className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
          </p>
        </div>
      )}
    </div>
  );
};

export default StatCard;