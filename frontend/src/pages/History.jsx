import React, { useEffect, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import TopBar from '../components/TopBar';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';
import { activityAPI, employeeAPI } from '../utils/api';
import { formatDate, getCurrentMonth } from '../utils/helpers';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'activity_statuses';

const loadStatusesFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStatusesToStorage = (statuses) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch {
    console.error('Failed to save statuses to localStorage');
  }
};

// Build a guaranteed unique key per row using multiple fields
const getRowKey = (activity) => {
  return [
    activity.id,
    activity.employee_name,
    activity.activity_date,
    activity.department,
    activity.cycle,
  ]
    .filter(Boolean)
    .join('_')
    .replace(/\s+/g, '-');
};

const StatusCell = ({ rowKey, initialStatus, initialReason, onStatusChange }) => {
  const [status, setStatus] = useState(initialStatus || '');
  const [reason, setReason] = useState(initialReason || '');
  const [saved, setSaved] = useState(!!initialStatus);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setReason('');
    setSaved(false);

    if (newStatus === '') {
      onStatusChange(rowKey, '', '');
      return;
    }

    if (newStatus !== 'other') {
      onStatusChange(rowKey, newStatus, '');
      setSaved(true);
    }
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
    setSaved(false);
  };

  const handleSave = () => {
    if (!reason.trim()) return;
    onStatusChange(rowKey, status, reason.trim());
    setSaved(true);
  };

  return (
    <div className="flex flex-col gap-1 min-w-[180px]">
      <select
        value={status}
        onChange={handleStatusChange}
        className={`px-2 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none
          ${status === 'attended'     ? 'border-green-400 bg-green-50 text-green-700'    :
            status === 'not_attended' ? 'border-red-400 bg-red-50 text-red-700'          :
            status === 'other'        ? 'border-yellow-400 bg-yellow-50 text-yellow-700' :
                                        'border-gray-300 text-gray-500'}`}
      >
        <option value="">-- Select --</option>
        <option value="attended">Attended</option>
        <option value="not_attended">Not Attended</option>
        <option value="other">Other</option>
      </select>

      {status === 'other' && (
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="Enter reason..."
            value={reason}
            onChange={handleReasonChange}
            className="flex-1 px-2 py-1 border border-yellow-400 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 outline-none bg-yellow-50"
          />
          <button
            onClick={handleSave}
            disabled={!reason.trim()}
            className="px-2 py-1 bg-yellow-500 text-white rounded-lg text-xs hover:bg-yellow-600 disabled:opacity-40"
          >
            {saved ? '✓' : 'Save'}
          </button>
        </div>
      )}

      {saved && (
        <span className="text-xs text-green-600 font-medium">✓ Saved</span>
      )}
    </div>
  );
};

const History = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth());
  const [department, setDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [activityStatuses, setActivityStatuses] = useState(loadStatusesFromStorage);

  useEffect(() => {
    fetchActivities();
    fetchDepartments();
  }, [page, month, department, search]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activityAPI.getAll(
        page, 20, month,
        department === 'all' ? '' : department,
        search
      );
      setActivities(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await employeeAPI.getDepartments();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleStatusChange = (rowKey, status, reason) => {
    setActivityStatuses((prev) => {
      const updated = { ...prev, [rowKey]: { status, reason } };
      saveStatusesToStorage(updated);
      return updated;
    });
  };

  const handleExport = () => {
    try {
      const enrichedActivities = activities.map((activity) => {
        // Use same key logic as StatusCell
        const rowKey = getRowKey(activity);
        const statusInfo = activityStatuses[rowKey];

        // Each row independently resolves its own status
        const statusValue = statusInfo?.status ?? '';
        const reasonValue = statusInfo?.reason ?? '';

        const statusLabel =
          statusValue === 'attended'     ? 'Attended'     :
          statusValue === 'not_attended' ? 'Not Attended' :
          statusValue === 'other'        ? 'Other'        : '';

        // Reason ONLY for this row if its own status is 'other'
        const reasonText = statusValue === 'other' ? reasonValue : '';

        return {
          Date:       formatDate(activity.activity_date),
          Employee:   activity.employee_name,
          Department: activity.department,
          Cycle:      activity.cycle,
          Status:     statusLabel,
          Reason:     reasonText,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(enrichedActivities);

      worksheet['!cols'] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 30 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities');
      XLSX.writeFile(
        workbook,
        `activities_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (error) {
      console.error('Error exporting activities:', error);
      alert('Error exporting activities');
    }
  };

  const columns = [
    { key: 'activity_date', label: 'Date',       render: (val) => formatDate(val) },
    { key: 'employee_name', label: 'Employee' },
    { key: 'department',    label: 'Department' },
    { key: 'cycle',         label: 'Cycle' },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const rowKey = getRowKey(row);
        const saved  = activityStatuses[rowKey] || {};
        return (
          <StatusCell
            rowKey={rowKey}
            initialStatus={saved.status || ''}
            initialReason={saved.reason || ''}
            onStatusChange={handleStatusChange}
          />
        );
      },
    },
  ];

  return (
    <div className="ml-64 min-h-screen bg-gray-100">
      <TopBar title="Activity History" />

      <div className="p-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => { setMonth(e.target.value); setPage(1); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Employee</label>
              <input
                type="text"
                placeholder="Employee name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExport}
                className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
              >
                <FiDownload size={20} /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">
              Activity Records ({pagination.total})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center"><LoadingSpinner /></div>
          ) : (
            <>
              <Table columns={columns} data={activities} loading={loading} />
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                      disabled={page === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;