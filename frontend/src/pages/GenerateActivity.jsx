import React, { useEffect, useState } from 'react';
import {
  FiZap, FiCheckCircle, FiAlertCircle, FiRefreshCw,
  FiTrash2, FiUser, FiBriefcase, FiRotateCw
} from 'react-icons/fi';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { activityAPI } from '../utils/api';
import { formatDate, getCurrentDate } from '../utils/helpers';

const GenerateActivity = ({ onMenuClick }) => {
  const [todayActivities, setTodayActivities] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting]   = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  useEffect(() => { fetchToday(); }, []);

  const fetchToday = async () => {
    try { setLoading(true); const r = await activityAPI.getToday(); setTodayActivities(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const flash = (msg, isError = false) => {
    isError ? setError(msg) : setSuccess(msg);
    setTimeout(() => isError ? setError('') : setSuccess(''), 5000);
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true); setError(''); setSuccess('');
      const r = await activityAPI.generate();
      setTodayActivities(r.data.activities);
      flash(`Generated ${r.data.activities.length} activities for today!`);
    } catch (e) { flash(e.response?.data?.error || 'Error generating activities', true); }
    finally { setGenerating(false); }
  };

  const handleResetToday = async () => {
    if (!window.confirm("Clear today's activities?")) return;
    try {
      setResetting(true); setError(''); setSuccess('');
      await activityAPI.reset();
      setTodayActivities([]);
      flash("Today's activities cleared.");
    } catch (e) { flash(e.response?.data?.error || 'Error clearing', true); }
    finally { setResetting(false); }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear ALL activities? This cannot be undone!')) return;
    try {
      setResetting(true); setError(''); setSuccess('');
      await activityAPI.clearAll();
      setTodayActivities([]);
      flash('All activities cleared.');
    } catch (e) { flash(e.response?.data?.error || 'Error clearing', true); }
    finally { setResetting(false); }
  };

  const busy = generating || resetting;

  return (
    <div className="page-wrapper">
      <TopBar title="Generate Activity" onMenuClick={onMenuClick} />

      <div className="page-content max-w-3xl mx-auto">
        {/* Info banner */}
        <div className="alert-info mb-5">
          <FiZap size={16} className="flex-shrink-0 mt-0.5 text-indigo-500" />
          <div>
            <p className="font-semibold text-indigo-800">Daily Activity Generation</p>
            <p className="text-indigo-600 mt-0.5 text-xs">
              Selects employees using fair rotation — lowest selection count is prioritised.
              You can regenerate multiple times today. &nbsp;📅 {formatDate(getCurrentDate())}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert-error mb-4">
            <FiAlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="alert-success mb-4">
            <FiCheckCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="card p-4 sm:p-5 mb-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Actions</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleGenerate} disabled={busy}
              className="btn-primary flex-1 !py-3 text-sm">
              {generating ? <LoadingSpinner size="sm" /> : <FiZap size={18} />}
              {generating ? 'Generating…' : "Generate Today's Activity"}
            </button>
            <button onClick={handleResetToday} disabled={busy || todayActivities.length === 0}
              className="btn-warning sm:w-40 !py-3 text-sm">
              {resetting ? <LoadingSpinner size="sm" /> : <FiTrash2 size={16} />}
              Clear Today
            </button>
            <button onClick={handleClearAll} disabled={busy}
              className="btn-danger sm:w-40 !py-3 text-sm">
              {resetting ? <LoadingSpinner size="sm" /> : <FiTrash2 size={16} />}
              Clear All
            </button>
          </div>
        </div>

        {/* Today's activities */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Today's Selected Employees
                {todayActivities.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                    {todayActivities.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{formatDate(getCurrentDate())}</p>
            </div>
            <button onClick={fetchToday}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
              <FiRefreshCw size={15} />
            </button>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" className="py-16" />
          ) : todayActivities.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiZap size={28} className="text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No activity generated yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Generate Today's Activity" above</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {todayActivities.map((act, idx) => (
                <div key={act._id || idx}
                  className="flex items-center gap-4 px-5 sm:px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(act.employee_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{act.employee_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <FiBriefcase size={11} className="text-slate-400" />
                      <p className="text-xs text-slate-500 truncate">{act.department}</p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                    Cycle {act.cycle}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="card p-5 mt-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Selection Rules</h3>
          <ul className="space-y-2 text-xs text-slate-500">
            {[
              'Employees with the lowest selection count are always chosen first',
              'Random shuffle among equally eligible employees ensures fairness',
              'No employee is repeated on the same day',
              'Cycle number auto-increments when all employees reach the same count',
              'Only active employees participate in selection',
            ].map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <FiCheckCircle size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GenerateActivity;
