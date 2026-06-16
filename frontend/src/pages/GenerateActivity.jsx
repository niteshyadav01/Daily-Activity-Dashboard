import React, { useEffect, useState } from 'react';
import { FiZap, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import TopBar from '../components/TopBar';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';
import { activityAPI } from '../utils/api';
import { formatDate, getCurrentDate } from '../utils/helpers';

const GenerateActivity = () => {
  const [todayActivities, setTodayActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTodayActivities();
  }, []);

  const fetchTodayActivities = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await activityAPI.getToday();
      setTodayActivities(response.data);
    } catch (err) {
      console.error('Error fetching today activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');

      const response = await activityAPI.generate();
      setTodayActivities(response.data.activities);
      setSuccess(`Successfully generated ${response.data.activities.length} activities for today!`);

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error generating activities';
      setError(errorMsg);
      console.error('Error generating activities:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleResetToday = async () => {
    if (!window.confirm('Are you sure you want to clear today\'s activities?')) {
      return;
    }

    try {
      setResetting(true);
      setError('');
      setSuccess('');

      await activityAPI.reset();
      setTodayActivities([]);
      setSuccess('Today\'s activities cleared successfully!');

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error resetting activities';
      setError(errorMsg);
      console.error('Error resetting activities:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL activities? This cannot be undone!')) {
      return;
    }

    try {
      setResetting(true);
      setError('');
      setSuccess('');

      await activityAPI.clearAll();
      setTodayActivities([]);
      setSuccess('All activities cleared successfully!');

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error clearing activities';
      setError(errorMsg);
      console.error('Error clearing activities:', err);
    } finally {
      setResetting(false);
    }
  };

  const columns = [
    { key: 'activity_id', label: 'ID' },
    { key: 'employee_name', label: 'Employee Name' },
    { key: 'department', label: 'Department' },
    { key: 'cycle', label: 'Cycle' },
  ];

  return (
    <div className="ml-64 min-h-screen bg-gray-100">
      <TopBar title="Generate Daily Activity" />

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Info Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Daily Activity Generation</h3>
            <p className="text-gray-600">
              Generate or regenerate activity assignments. You can generate multiple times per day. 
              The system selects employees based on fair rotation (lowest selection count prioritized).
            </p>
            <p className="text-sm text-gray-500 mt-3">
              📅 Today: {formatDate(getCurrentDate())}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 mb-6">
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 mb-6">
              <FiCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={generating || resetting}
                className="flex-1 bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-3 transition-colors"
              >
                {generating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FiZap size={24} />
                    Generate Today's Activity
                  </>
                )}
              </button>

              <button
                onClick={handleResetToday}
                disabled={generating || resetting || todayActivities.length === 0}
                className="bg-orange-500 text-white py-4 px-6 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {resetting ? (
                  <>
                    <LoadingSpinner size="sm" />
                  </>
                ) : (
                  <>
                    <FiTrash2 size={20} />
                    Clear Today
                  </>
                )}
              </button>

              <button
                onClick={handleClearAll}
                disabled={generating || resetting}
                className="bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {resetting ? (
                  <>
                    <LoadingSpinner size="sm" />
                  </>
                ) : (
                  <>
                    <FiTrash2 size={20} />
                    Clear All
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Today's Activities */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">
                    Today's Selected Employees ({todayActivities.length})
                  </h3>
                  <button
                    onClick={fetchTodayActivities}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                  >
                    <FiRefreshCw size={18} />
                    Refresh
                  </button>
                </div>
              </div>

              {todayActivities.length > 0 ? (
                <Table columns={columns} data={todayActivities} />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No activities generated for today yet.</p>
                  <p className="text-sm mt-2">Click the generate button above to create today's assignment.</p>
                </div>
              )}
            </div>
          )}

          {/* Rules */}
         
        </div>
      </div>
    </div>
  );
};

export default GenerateActivity;
