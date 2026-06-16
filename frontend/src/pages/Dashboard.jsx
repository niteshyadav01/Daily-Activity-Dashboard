import React, { useEffect, useState } from 'react';
import { FiUsers, FiCheckCircle, FiRotateCw, FiClock, FiTrendingUp, FiActivity } from 'react-icons/fi';
import TopBar from '../components/TopBar';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Table from '../components/Table';
import { reportsAPI } from '../utils/api';
import { formatDate, formatDateTime } from '../utils/helpers';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activityColumns = [
    { key: 'activity_date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'employee_name', label: 'Employee' },
    { key: 'department', label: 'Department' },
    { key: 'cycle', label: 'Cycle' },
  ];

  return (
    <div className="ml-64 min-h-screen bg-gray-100">
      <TopBar title="Dashboard" />

      <div className="p-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            icon={FiUsers}
            color="blue"
          />
          <StatCard
            title="Today's Selected"
            value={stats?.todaySelected || 0}
            icon={FiCheckCircle}
            color="green"
          />
          <StatCard
            title="Rotation Progress"
            value={`Cycle ${stats?.rotationProgress?.currentCycle || 1}`}
            icon={FiRotateCw}
            color="orange"
          />
          <StatCard
            title="Pending Rotation"
            value={stats?.pendingEmployees || 0}
            icon={FiClock}
            color="red"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiTrendingUp className="text-blue-600" size={24} />
              <h3 className="text-lg font-bold text-gray-800">Monthly Activity</h3>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats?.monthlyActivityCount || 0}</p>
            <p className="text-sm text-gray-500 mt-2">Activities this month</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiActivity className="text-green-600" size={24} />
              <h3 className="text-lg font-bold text-gray-800">System Status</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-600">All Systems Operational</p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Recent Activities</h3>
          </div>
          <Table
            columns={activityColumns}
            data={stats?.recentActivities || []}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
