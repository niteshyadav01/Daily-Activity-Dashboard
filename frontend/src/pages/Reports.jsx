import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { reportsAPI } from '../utils/api';
import { getCurrentMonth, formatDate } from '../utils/helpers';

const Reports = () => {
  const [monthlyData, setMonthlyData] = useState(null);
  const [allTimeData, setAllTimeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth());

  useEffect(() => {
    fetchData();
  }, [month]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [monthlyRes, allTimeRes] = await Promise.all([
        reportsAPI.getMonthly(month),
        reportsAPI.getAllStats()
      ]);
      setMonthlyData(monthlyRes.data);
      setAllTimeData(allTimeRes.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-gray-100">
      <TopBar title="Reports & Analytics" />

      <div className="p-8">
        {/* Filter */}
        <div className="mb-6">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Employees</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {allTimeData?.totalStats?.total || 0}
            </p>
            <p className="text-xs text-green-600 mt-2">
              {allTimeData?.totalStats?.active || 0} Active
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Activities</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {monthlyData?.stats?.reduce((sum, item) => sum + item.count, 0) || 0}
            </p>
            <p className="text-xs text-gray-600 mt-2">This month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Departments</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {monthlyData?.departmentStats?.length || 0}
            </p>
            <p className="text-xs text-gray-600 mt-2">Active this month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Top Employee</p>
            <p className="text-lg font-bold text-gray-800 mt-2 truncate">
              {monthlyData?.topParticipants?.[0]?.employee_name || '-'}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {monthlyData?.topParticipants?.[0]?.count || 0} activities
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Participation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Daily Activity Count</h3>
            {monthlyData?.stats && monthlyData.stats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData.stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="activity_date"
                    tickFormatter={(val) => new Date(val).getDate()}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No data available</p>
            )}
          </div>

          {/* Department Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Department Activity</h3>
            {monthlyData?.departmentStats && monthlyData.departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData.departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No data available</p>
            )}
          </div>
        </div>

        {/* All-Time Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Participants */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Participants (All Time)</h3>
            <div className="space-y-3">
              {allTimeData?.allTimeParticipation?.slice(0, 5).map((emp, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-800 truncate">{emp.employee_name}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800 ml-4">{emp.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Department Participation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Department Participation</h3>
            {allTimeData?.departmentParticipation && allTimeData.departmentParticipation.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={allTimeData.departmentParticipation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ department, count }) => `${department}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {allTimeData.departmentParticipation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
