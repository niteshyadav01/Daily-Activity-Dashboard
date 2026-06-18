import React, { useEffect, useState } from 'react';
import { FiSave, FiCheckCircle, FiAlertCircle, FiSettings, FiInfo } from 'react-icons/fi';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { settingsAPI } from '../utils/api';

const Settings = ({ onMenuClick }) => {
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [formData, setFormData] = useState({ daily_selection_count: '4' });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.getAll();
      const map = {};
      res.data.forEach(s => { map[s.setting_key] = s.setting_value; });
      setFormData({ daily_selection_count: map.daily_selection_count || '4' });
    } catch (e) { setError('Error loading settings'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    const count = parseInt(formData.daily_selection_count);
    if (isNaN(count) || count < 1 || count > 50) {
      setError('Daily selection count must be between 1 and 50.'); return;
    }
    try {
      setSaving(true); setError('');
      await settingsAPI.update('daily_selection_count', formData.daily_selection_count);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
      fetchSettings();
    } catch (e) { setError('Error saving settings'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="page-wrapper flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="page-wrapper">
      <TopBar title="Settings" onMenuClick={onMenuClick} />
      <div className="page-content">
        <div className="max-w-2xl mx-auto space-y-5">
          {error   && <div className="alert-error"><FiAlertCircle size={16} className="flex-shrink-0" />{error}</div>}
          {success && <div className="alert-success"><FiCheckCircle size={16} className="flex-shrink-0" />{success}</div>}

          {/* Main setting */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FiSettings size={18} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Activity Generation</h2>
                <p className="text-xs text-slate-400 mt-0.5">Configure daily selection behaviour</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="label">Employees Selected Per Day</label>
                <div className="flex items-center gap-4">
                  <input type="number" min="1" max="50" value={formData.daily_selection_count}
                    onChange={e => setFormData({ ...formData, daily_selection_count: e.target.value })}
                    className="input w-28 text-center text-lg font-bold" />
                  <p className="text-sm text-slate-500">employees per daily generation</p>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Default is 4. Accepted range: 1 – 50.</p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Configuration</p>
                {[
                  ['Daily Selection Count', `${formData.daily_selection_count} employees`],
                  ['Selection Method',      'Lowest selected count priority'],
                  ['Cycle Reset',           'When all employees reach equal count'],
                  ['Rotation',              'Continuous with automatic cycle tracking'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-700">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <LoadingSpinner size="sm" /> : <FiSave size={16} />}
                  {saving ? 'Saving…' : 'Save Settings'}
                </button>
                <button onClick={fetchSettings} className="btn-secondary">Reset</button>
              </div>
            </div>
          </div>

          {/* Info card */}
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <FiInfo size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-700">Selection Logic</p>
                {[
                  'Employees with the lowest selection count are always chosen first',
                  'Random shuffle among equally eligible employees',
                  'No employee is repeated on the same day',
                  'Cycle number increments when all active employees reach the same count',
                  'Only active employees participate in generation',
                ].map((r, i) => (
                  <p key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                    <FiCheckCircle size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />{r}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
