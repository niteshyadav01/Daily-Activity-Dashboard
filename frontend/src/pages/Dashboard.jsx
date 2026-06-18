import React, { useEffect, useState } from 'react';
import {
  FiUsers, FiCheckCircle, FiRotateCw, FiClock,
  FiTrendingUp, FiActivity, FiRefreshCw
} from 'react-icons/fi';
import TopBar from '../components/TopBar';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Table from '../components/Table';
import { reportsAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';

const Dashboard = ({ onMenuClick }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getDashboard();
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activityColumns = [
    { key: 'activity_date', label: 'Date',       render: (v) => formatDate(v) },
    { key: 'employee_name', label: 'Employee' },
    { key: 'department',    label: 'Department' },
    {
      key: 'cycle', label: 'Cycle',
      render: (v) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
          Cycle {v}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-3" />
          <p className="text-sm text-slate-400 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <TopBar title="Dashboard" onMenuClick={onMenuClick} />

      <div className="page-content">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">
          <StatCard title="Total Employees" value={stats?.totalEmployees ?? 0}
            icon={FiUsers} color="indigo" subtitle="Active workforce" />
          <StatCard title="Today's Selected" value={stats?.todaySelected ?? 0}
            icon={FiCheckCircle} color="emerald" subtitle="On treadmill today" />
          <StatCard title="Current Cycle" value={`Cycle ${stats?.rotationProgress?.currentCycle ?? 1}`}
            icon={FiRotateCw} color="amber" subtitle="Rotation round" />
          <StatCard title="Pending Rotation" value={stats?.pendingEmployees ?? 0}
            icon={FiClock} color="rose" subtitle="Yet to be selected" />
        </div>

        {/* Secondary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
          <div className="card p-5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center flex-shrink-0">
              <FiTrendingUp size={22} className="text-sky-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Activity</p>
              <p className="text-3xl font-extrabold text-sky-700 mt-0.5">{stats?.monthlyActivityCount ?? 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Activities this month</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FiActivity size={22} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-sm font-semibold text-slate-700">All Systems Operational</p>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">MongoDB Atlas connected</p>
            </div>
          </div>
        </div>

        {/* Recent activities */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Activities</h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest treadmill assignments</p>
            </div>
            <button
              onClick={fetchStats}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Refresh"
            >
              <FiRefreshCw size={16} />
            </button>
          </div>
          <Table
            columns={activityColumns}
            data={stats?.recentActivities ?? []}
            emptyMessage="No activities yet — generate today's activity to get started"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
