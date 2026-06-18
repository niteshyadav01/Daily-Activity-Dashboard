import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Table = ({ columns, data, actions, loading, emptyMessage = 'No data available' }) => {
  if (loading) {
    return (
      <div className="py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((row, idx) => (
              <tr key={row._id || row.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 text-slate-700 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
                {actions && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {actions(row).map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={(e) => { e.stopPropagation(); action.onClick(row); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${action.className}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-slate-100">
        {data.map((row, idx) => (
          <div key={row._id || row.id || idx} className="p-4 space-y-2">
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0 w-28">
                  {col.label}
                </span>
                <span className="text-sm text-slate-700 text-right">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </span>
              </div>
            ))}
            {actions && (
              <div className="flex gap-2 pt-2">
                {actions(row).map((action, aIdx) => (
                  <button
                    key={aIdx}
                    onClick={() => action.onClick(row)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${action.className}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default Table;
