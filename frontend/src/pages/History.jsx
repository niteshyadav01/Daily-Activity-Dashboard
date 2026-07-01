import React, { useEffect, useState, useCallback } from 'react';
import {
  FiDownload, FiSearch, FiChevronLeft, FiChevronRight,
  FiUserPlus, FiX, FiCheckCircle, FiAlertCircle, FiCalendar, FiSave
} from 'react-icons/fi';
import TopBar from '../components/TopBar';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';
import { activityAPI, employeeAPI } from '../utils/api';
import { formatDate, getCurrentMonth } from '../utils/helpers';
import * as XLSX from 'xlsx';

// ─── localStorage fallback ───────────────────────────────────────────────────
const STORAGE_KEY = 'activity_statuses';
const loadStatuses = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } };
const saveStatuses = (s) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} };

// ─── StatusCell ──────────────────────────────────────────────────────────────
// Saves status to MongoDB via API. Also mirrors to localStorage as fallback.
const StatusCell = ({ activityId, initialStatus, initialReason }) => {
  const [status, setStatus]   = useState(initialStatus || '');
  const [reason, setReason]   = useState(initialReason || '');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(!!initialStatus);
  const [error, setError]     = useState('');

  const persist = async (newStatus, newReason = '') => {
    try {
      setSaving(true); setError('');
      await activityAPI.updateStatus(activityId, newStatus, newReason);
      // Mirror to localStorage
      const statuses = loadStatuses();
      statuses[activityId] = { status: newStatus, reason: newReason };
      saveStatuses(statuses);
      setSaved(true);
    } catch (e) {
      setError('Save failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const onSelectChange = async (e) => {
    const v = e.target.value;
    setStatus(v); setReason(''); setSaved(false);
    // Save immediately for attended / not_attended / clear — only 'other' waits for reason
    if (v !== 'other') {
      await persist(v, '');
    }
  };

  const onReasonSave = async () => {
    if (!reason.trim()) return;
    await persist('other', reason.trim());
  };

  const colorClass =
    status === 'attended'     ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
    status === 'not_attended' ? 'border-red-300    bg-red-50    text-red-700'       :
    status === 'other'        ? 'border-amber-300  bg-amber-50  text-amber-700'     :
                                'border-slate-200  text-slate-500';

  return (
    <div className="flex flex-col gap-1 min-w-[180px]">
      <div className="flex items-center gap-1.5">
        <select value={status} onChange={onSelectChange} disabled={saving}
          className={`flex-1 px-2.5 py-1.5 border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors disabled:opacity-60 ${colorClass}`}>
          <option value="">— Select —</option>
          <option value="attended">✓ Attended</option>
          <option value="not_attended">✗ Not Attended</option>
          <option value="other">⚠ Other</option>
        </select>
        {saving && <LoadingSpinner size="xs" />}
        {saved && !saving && status && (
          <span title="Saved to database">
            <FiCheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
          </span>
        )}
      </div>

      {status === 'other' && (
        <div className="flex gap-1">
          <input type="text" placeholder="Enter reason…" value={reason}
            onChange={e => { setReason(e.target.value); setSaved(false); }}
            className="flex-1 px-2 py-1 border border-amber-300 rounded-lg text-xs bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-400" />
          <button onClick={onReasonSave} disabled={!reason.trim() || saving}
            className="px-2 py-1 bg-amber-500 text-white rounded-lg text-xs hover:bg-amber-600 disabled:opacity-40 font-semibold flex items-center gap-1">
            {saving ? <LoadingSpinner size="xs" /> : <FiSave size={11} />}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

// ─── AddEmployeeModal ────────────────────────────────────────────────────────
const AddEmployeeModal = ({ onClose, onAdded }) => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [search, setSearch]             = useState('');
  const [date, setDate]                 = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedEmp, setSelectedEmp]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');

  useEffect(() => {
    (async () => {
      try {
        setFetching(true);
        const res = await employeeAPI.getAll(1, 500, '', '');
        setAllEmployees(res.data.data.filter(e => e.active));
      } catch { setError('Could not load employees'); }
      finally { setFetching(false); }
    })();
  }, []);

  const filtered = allEmployees.filter(e =>
    e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedEmp || !date) { setError('Select a date and an employee'); return; }
    try {
      setLoading(true); setError(''); setSuccess('');
      await activityAPI.addManual(date, selectedEmp._id || selectedEmp.id);
      setSuccess(`${selectedEmp.employee_name} added to ${formatDate(date)}!`);
      setTimeout(() => { onAdded(); onClose(); }, 1400);
    } catch (e) {
      setError(e.response?.data?.error || 'Error adding employee to activity');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800">Add Employee to Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manually add a missed or deleted employee</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error   && <div className="alert-error text-xs"><FiAlertCircle size={14} className="flex-shrink-0" />{error}</div>}
          {success && <div className="alert-success text-xs"><FiCheckCircle size={14} className="flex-shrink-0" />{success}</div>}

          <div>
            <label className="label">Activity Date</label>
            <div className="relative">
              <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input pl-9" />
            </div>
          </div>

          <div>
            <label className="label">Search Employee</label>
            <div className="relative">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="text" placeholder="Name or department…" value={search}
                onChange={e => { setSearch(e.target.value); setSelectedEmp(null); }} className="input pl-9" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden max-h-52 overflow-y-auto">
            {fetching ? <div className="py-8"><LoadingSpinner size="md" /></div>
            : filtered.length === 0 ? <p className="text-center text-xs text-slate-400 py-6">No employees found</p>
            : filtered.map(emp => {
              const empId = emp._id || emp.id;
              const selId = selectedEmp?._id || selectedEmp?.id;
              const isSelected = empId === selId;
              return (
                <button key={empId} onClick={() => setSelectedEmp(emp)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 last:border-0 transition-colors
                    ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {emp.employee_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>{emp.employee_name}</p>
                    <p className="text-xs text-slate-400 truncate">{emp.department}</p>
                  </div>
                  {isSelected && <FiCheckCircle size={16} className="text-indigo-600 ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {selectedEmp && date && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-xs">
              <p className="font-semibold text-indigo-800">Ready to add:</p>
              <p className="text-indigo-600 mt-0.5">
                <span className="font-bold">{selectedEmp.employee_name}</span> ({selectedEmp.department})
                {' '}→ <span className="font-bold">{formatDate(date)}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-slate-100 flex-shrink-0">
          <button onClick={handleAdd} disabled={loading || !selectedEmp || !date} className="btn-primary flex-1">
            {loading ? <LoadingSpinner size="sm" /> : <FiUserPlus size={16} />}
            {loading ? 'Adding…' : 'Add to Activity'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── History page ────────────────────────────────────────────────────────────
const History = ({ onMenuClick }) => {
  const [activities, setActivities]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [filterMode, setFilterMode]     = useState('month');
  const [month, setMonth]               = useState(getCurrentMonth());
  const [date, setDate]                 = useState(new Date().toLocaleDateString('en-CA'));
  const [department, setDepartment]     = useState('all');
  const [departments, setDepartments]   = useState([]);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState({ total: 0, totalPages: 0 });
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const r = await activityAPI.getAll(
        page, 20,
        filterMode === 'month' ? month : '',
        department === 'all' ? '' : department,
        search,
        filterMode === 'date' ? date : ''
      );
      setActivities(r.data.data);
      setPagination(r.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, month, date, filterMode, department, search]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);
  useEffect(() => {
    employeeAPI.getDepartments().then(r => setDepartments(r.data)).catch(console.error);
  }, []);

  const handleExport = () => {
    try {
      const rows = activities.map(a => ({
        Date:       formatDate(a.activity_date),
        Employee:   a.employee_name,
        Department: a.department,
        Cycle:      a.cycle,
        Status:     a.status === 'attended' ? 'Attended' : a.status === 'not_attended' ? 'Not Attended' : a.status === 'other' ? 'Other' : '',
        Reason:     a.status === 'other' ? (a.status_reason || '') : '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 8 }, { wch: 15 }, { wch: 30 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Activities');
      XLSX.writeFile(wb, `activities_${new Date().toLocaleDateString('en-CA')}.xlsx`);
    } catch { alert('Export failed'); }
  };

  const columns = [
    { key: 'activity_date', label: 'Date',       render: v => formatDate(v) },
    { key: 'employee_name', label: 'Employee',   render: v => <span className="font-semibold text-slate-800">{v}</span> },
    { key: 'department',    label: 'Department' },
    { key: 'cycle',         label: 'Cycle',      render: v => <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">Cycle {v}</span> },
    {
      key: 'status', label: 'Status',
      render: (_, row) => (
        <StatusCell
          activityId={row._id || row.id}
          initialStatus={row.status || ''}
          initialReason={row.status_reason || ''}
        />
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <TopBar title="Activity History" onMenuClick={onMenuClick} />
      <div className="page-content">

        {/* Filters */}
        <div className="card p-4 sm:p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-slate-500">Filter by:</span>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
              <button onClick={() => { setFilterMode('month'); setPage(1); }}
                className={`px-3 py-1.5 transition-colors ${filterMode === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                Month
              </button>
              <button onClick={() => { setFilterMode('date'); setPage(1); }}
                className={`px-3 py-1.5 transition-colors ${filterMode === 'date' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                Specific Date
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              {filterMode === 'month' ? (
                <>
                  <label className="label">Month & Year</label>
                  <input type="month" value={month} onChange={e => { setMonth(e.target.value); setPage(1); }} className="input" />
                </>
              ) : (
                <>
                  <label className="label">Specific Date</label>
                  <div className="relative">
                    <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1); }} className="input pl-9" />
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="label">Department</label>
              <select value={department} onChange={e => { setDepartment(e.target.value); setPage(1); }} className="input">
                <option value="all">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Search Employee</label>
              <div className="relative">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Name…" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} className="input pl-9" />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button onClick={() => setShowAddModal(true)} className="btn-primary flex-1 !py-2.5 text-sm">
                <FiUserPlus size={15} /> Add Employee
              </button>
              <button onClick={handleExport} className="btn-success !px-3 !py-2.5" title="Export Excel">
                <FiDownload size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Info banner about status logic */}
       

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Activity Records</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {pagination.total} records
                {filterMode === 'date' && date && ` · ${formatDate(date)}`}
                {filterMode === 'month' && month && ` · ${new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}`}
              </p>
            </div>
          </div>

          <Table columns={columns} data={activities} loading={loading}
            emptyMessage="No activities found for the selected filters" />

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Page <span className="font-semibold">{pagination.page}</span> of{' '}
                <span className="font-semibold">{pagination.totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-secondary !px-3 !py-2 text-xs"><FiChevronLeft size={14} /></button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="btn-secondary !px-3 !py-2 text-xs"><FiChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} onAdded={fetchActivities} />
      )}
    </div>
  );
};

export default History;
