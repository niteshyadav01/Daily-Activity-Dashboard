import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiChevronLeft, FiChevronRight, FiSearch, FiX } from 'react-icons/fi';
import TopBar from '../components/TopBar';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';
import { employeeAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';

const EMPTY_FORM = { employee_name: '', department: '' };

const Employees = ({ onMenuClick }) => {
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [department, setDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeAPI.getAll(page, 10, department === 'all' ? '' : department, search);
      setEmployees(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, department]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => {
    employeeAPI.getDepartments().then(r => setDepartments(r.data)).catch(console.error);
  }, []);

  const openAdd = () => { setFormData(EMPTY_FORM); setEditingId(null); setFormError(''); setShowModal(true); };
  const openEdit = (emp) => {
    setFormData({ employee_name: emp.employee_name, department: emp.department });
    setEditingId(emp._id || emp.id);
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try { await employeeAPI.delete(id); fetchEmployees(); }
    catch (e) { alert('Error deleting employee'); }
  };

  const handleDisable = async (emp) => {
    try { await employeeAPI.disable(emp._id || emp.id); fetchEmployees(); }
    catch (e) { alert('Error updating employee status'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employee_name.trim() || !formData.department) {
      setFormError('Both name and department are required.');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      if (editingId) {
        await employeeAPI.update(editingId, formData);
      } else {
        await employeeAPI.create(formData);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (e) {
      setFormError(e.response?.status === 409 ? 'Employee already exists.' : 'Error saving employee.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'employee_name', label: 'Name', render: (v) => <span className="font-semibold text-slate-800">{v}</span> },
    { key: 'department',    label: 'Department' },
    { key: 'selected_count', label: 'Selected',
      render: (v) => <span className="font-bold text-indigo-600">{v}</span> },
    { key: 'cycle_number', label: 'Cycle',
      render: (v) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
          {v}
        </span>
      )},
    { key: 'last_selected_date', label: 'Last Selected', render: (v) => v ? formatDate(v) : <span className="text-slate-300">—</span> },
    { key: 'active', label: 'Status',
      render: (v) => v
        ? <span className="badge-active">● Active</span>
        : <span className="badge-inactive">● Inactive</span> },
  ];

  const actions = (row) => [
    { label: 'Edit',   onClick: () => openEdit(row),   className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
    { label: row.active ? 'Disable' : 'Enable', onClick: () => handleDisable(row),
      className: row.active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
    { label: 'Delete', onClick: () => handleDelete(row._id || row.id), className: 'bg-red-50 text-red-700 hover:bg-red-100' },
  ];

  return (
    <div className="page-wrapper">
      <TopBar title="Employee Management" onMenuClick={onMenuClick} />

      <div className="page-content">
        {/* Filters */}
        <div className="card p-4 sm:p-5 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input pl-9"
              />
            </div>
            {/* Department */}
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="input sm:w-56"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {/* Add */}
            <button onClick={openAdd} className="btn-primary whitespace-nowrap">
              <FiPlus size={16} /> Add Employee
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Employees</h3>
              <p className="text-xs text-slate-400 mt-0.5">{pagination.total} total records</p>
            </div>
          </div>

          <Table columns={columns} data={employees} actions={actions} loading={loading}
            emptyMessage="No employees found. Add your first employee above." />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Page <span className="font-semibold">{pagination.page}</span> of{' '}
                <span className="font-semibold">{pagination.totalPages}</span>
                <span className="hidden sm:inline"> · {pagination.total} employees</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-secondary !px-3 !py-2 text-xs">
                  <FiChevronLeft size={14} /> <span className="hidden sm:inline">Prev</span>
                </button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages} className="btn-secondary !px-3 !py-2 text-xs">
                  <span className="hidden sm:inline">Next</span> <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingId ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="alert-error">{formError}</div>}
              <div>
                <label className="label">Full Name</label>
                <input type="text" value={formData.employee_name} placeholder="Enter employee name"
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                  className="input" autoFocus />
              </div>
              <div>
                <label className="label">Department</label>
                <select value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="input">
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <LoadingSpinner size="sm" /> : null}
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Add Employee'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
