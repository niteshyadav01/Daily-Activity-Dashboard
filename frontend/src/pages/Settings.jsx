import React, { useEffect, useState } from 'react';
import { FiSave } from 'react-icons/fi';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { settingsAPI } from '../utils/api';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    daily_selection_count: '4'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAll();
      const settingsMap = {};
      response.data.forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });
      setSettings(settingsMap);
      setFormData({
        daily_selection_count: settingsMap.daily_selection_count || '4'
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const count = parseInt(formData.daily_selection_count);
      if (isNaN(count) || count < 1 || count > 50) {
        setError('Daily selection count must be between 1 and 50');
        setSaving(false);
        return;
      }

      await settingsAPI.update('daily_selection_count', formData.daily_selection_count);

      setSuccess('Settings saved successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 5000);

      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-gray-100">
      <TopBar title="Settings" />

      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800">
              ✓ {success}
            </div>
          )}

          {/* Settings Form */}
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Activity Generation</h3>
              <p className="text-gray-600 text-sm">Configure how many employees are selected per day</p>
            </div>

            <div className="space-y-6">
              {/* Daily Selection Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employees per Day
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.daily_selection_count}
                    onChange={(e) => setFormData({ ...formData, daily_selection_count: e.target.value })}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-sm text-gray-600">
                    employees will be selected in each daily activity generation
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Default: 4 employees. Adjust based on your requirements.
                </p>
              </div>

              {/* Current Settings Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2">Current Settings</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Daily Selection Count: <strong>{formData.daily_selection_count}</strong> employees</p>
                  <p>• Selection Method: Lowest selected count priority</p>
                  <p>• Cycle Reset: When all employees have equal counts</p>
                  <p>• Rotation: Continuous with automatic cycle tracking</p>
                </div>
              </div>

              {/* Selection Logic Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Selection Logic</h4>
                <ul className="text-sm text-green-800 space-y-2">
                  <li>✓ Employees with lowest selection count are prioritized</li>
                  <li>✓ Random shuffle among eligible employees</li>
                  <li>✓ No duplicates on the same day</li>
                  <li>✓ Automatic cycle increment when all reach same count</li>
                  <li>✓ Only active employees participate</li>
                </ul>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {saving ? <LoadingSpinner size="sm" /> : <FiSave size={20} />}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={fetchSettings}
                className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
