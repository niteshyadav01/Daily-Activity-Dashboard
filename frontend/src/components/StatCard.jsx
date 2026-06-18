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
    <div className={`card p-5 flex items-start gap-4 transition-shadow hover:shadow-md`}>
      {Icon && (
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${c.icon}`}>
          <Icon size={22} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{title}</p>
        <p className={`text-2xl sm:text-3xl font-extrabold mt-1 ${c.value} truncate`}>{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
