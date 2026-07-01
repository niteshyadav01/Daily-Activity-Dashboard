import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiBarChart2, FiTrendingUp, FiUsers, FiCalendar } from 'react-icons/fi';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { reportsAPI } from '../utils/api';
import { getCurrentMonth } from '../utils/helpers';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

const ChartCard = ({ title, subtitle, children }) => (
  <div className="card p-5 sm:p-6">
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const EmptyChart = ({ message = 'No data available for this period' }) => (
  <div className="h-64 flex flex-col items-center justify-center text-center">
    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
      <FiBarChart2 size={22} className="text-slate-300" />
    </div>
    <p className="text-sm text-slate-400 font-medium">{message}</p>
  </div>
);

const Reports = ({ onMenuClick }) => {
  const [monthlyData, setMonthlyData] = useState(null);
  const [allTimeData, setAllTimeData] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [month, setMonth]             = useState(getCurrentMonth());

  useEffect(() => { fetchData(); }, [month]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, aRes] = await Promise.all([reportsAPI.getMonthly(month), reportsAPI.getAllStats()]);
      setMonthlyData(mRes.data);
      setAllTimeData(aRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const totalMonthly = monthlyData?.stats?.reduce((s, i) => s + i.count, 0) || 0;

  return (
    <div className="page-wrapper">
      <TopBar title="Reports & Analytics" onMenuClick={onMenuClick} />
      <div className="page-content">

        {/* Month filter */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="input pl-9 w-auto" />
          </div>
          {loading && <LoadingSpinner size="sm" />}
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">
          {[
            { label: 'Total Employees', value: allTimeData?.totalStats?.total || 0,     sub: `${allTimeData?.totalStats?.active || 0} active`,    bg: 'bg-indigo-50',  text: 'text-indigo-700'  },
            { label: 'Monthly Activities',value: totalMonthly,                           sub: 'This month',                                         bg: 'bg-emerald-50', text: 'text-emerald-700' },
            { label: 'Depts Active',     value: monthlyData?.departmentStats?.length||0, sub: 'This month',                                         bg: 'bg-amber-50',   text: 'text-amber-700'   },
            { label: 'Top Employee',     value: monthlyData?.topParticipants?.[0]?.count||0, sub: monthlyData?.topParticipants?.[0]?.employee_name||'—', bg: 'bg-rose-50', text: 'text-rose-700' },
          ].map(s => (
            <div key={s.label} className={`card p-4 sm:p-5 ${s.bg}`}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl sm:text-3xl font-extrabold mt-1 ${s.text}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ChartCard title="Daily Activity Count" subtitle={`Activities per day — ${month}`}>
            {monthlyData?.stats?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyData.stats} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="activity_date" tickFormatter={v => new Date(v).getDate()} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip labelFormatter={v => `Day ${new Date(v).getDate()}`} />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Department Activity" subtitle="Activities by department this month">
            {monthlyData?.departmentStats?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData.departmentStats} margin={{ top: 4, right: 8, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="department" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Top Participants" subtitle="All-time activity count per employee">
            {allTimeData?.allTimeParticipation?.length > 0 ? (
              <div className="space-y-3">
                {allTimeData.allTimeParticipation.slice(0, 10).map((emp, i) => {
                  const max = allTimeData.allTimeParticipation[0]?.count || 1;
                  const pct = Math.round((emp.count / max) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <p className="text-xs font-semibold text-slate-700 truncate">{emp.employee_name}</p>
                          <p className="text-xs font-bold text-indigo-600 ml-2 flex-shrink-0">{emp.count}</p>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyChart message="No participation data yet" />}
          </ChartCard>

          <ChartCard title="Department Participation" subtitle="All-time distribution">
            {allTimeData?.departmentParticipation?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={allTimeData.departmentParticipation} cx="50%" cy="50%"
                    outerRadius={90} innerRadius={45} dataKey="count" nameKey="department"
                    label={({ department, percent }) => `${department.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {allTimeData.departmentParticipation.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No department data yet" />}
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default Reports;
