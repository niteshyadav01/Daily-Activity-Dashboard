import React, { useEffect, useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiEyeOff } from 'react-icons/fi';
import TopBar from '../components/TopBar';
import Table from '../components/Table';
import LoadingSpinner from '../components/LoadingSpinner';
import { employeeAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ employee_name: '', department: '' });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [page, search, department]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getAll(page, 10, department === 'all' ? '' : department, search);
      setEmployees(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching employees:', error);
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

  const handleAdd = () => {
    setFormData({ employee_name: '', department: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (employee) => {
    setFormData({
      employee_name: employee.employee_name,
      department: employee.department
    });
    setEditingId(employee.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeAPI.delete(id);
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Error deleting employee');
      }
    }
  };

  const handleDisable = async (id) => {
    try {
      await employeeAPI.disable(id);
      fetchEmployees();
    } catch (error) {
      console.error('Error disabling employee:', error);
      alert('Error disabling employee');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.employee_name || !formData.department) {
        alert('Please fill in all fields');
        return;
      }

      if (editingId) {
        await employeeAPI.update(editingId, formData);
      } else {
        await employeeAPI.create(formData);
      }

      setShowForm(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      if (error.response?.status === 409) {
        alert('Employee already exists');
      } else {
        alert('Error saving employee');
      }
    }
  };

  const columns = [
    { key: 'employee_name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'selected_count', label: 'Selected Count' },
    { key: 'cycle_number', label: 'Cycle' },
    { key: 'last_selected_date', label: 'Last Selected', render: (val) => val ? formatDate(val) : '-' },
    { key: 'active', label: 'Status', render: (val) => val ? '✓ Active' : '✗ Inactive' },
  ];

  const actions = (row) => [
    {
      label: 'Edit',
      onClick: () => handleEdit(row),
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    {
      label: row.active ? 'Disable' : 'Enable',
      onClick: () => handleDisable(row.id),
      className: row.active ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
    },
    {
      label: 'Delete',
      onClick: () => handleDelete(row.id),
      className: 'bg-red-100 text-red-700 hover:bg-red-200'
    },
  ];

  return (
    <div className="ml-64 min-h-screen bg-gray-100">
      <TopBar title="Employee Management" />

      <div className="p-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Employee name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAdd}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
              >
                <FiPlus size={20} /> Add Employee
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                {editingId ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.employee_name}
                    onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Employee name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">
              Employees ({pagination.total})
            </h3>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <Table columns={columns} data={employees} actions={actions} loading={loading} />
              {/* Pagination */}
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

export default Employees;
