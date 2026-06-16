import axios from 'axios';

const API_URL =
import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Employees
export const employeeAPI = {
  getAll: (page = 1, limit = 10, department = '', search = '') => 
    api.get('/employees', { params: { page, limit, department, search } }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  disable: (id) => api.patch(`/employees/${id}/disable`),
  getDepartments: () => api.get('/employees/data/departments'),
};

// Activities
export const activityAPI = {
  getToday: () => api.get('/activities/today'),
  getAll: (page = 1, limit = 20, month = '', department = '', search = '') =>
    api.get('/activities', { params: { page, limit, month, department, search } }),
  generate: () => api.post('/activities/generate'),
  reset: () => api.post('/activities/reset'),
  clearAll: () => api.post('/activities/clear-all'),
};

// Upload
export const uploadAPI = {
  preview: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  import: (employees) => api.post('/upload/import', { employees }),
  exportEmployees: () => api.get('/upload/export', { responseType: 'blob' }),
  exportActivities: () => api.get('/upload/export-activities', { responseType: 'blob' }),
};

// Settings
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  get: (key) => api.get(`/settings/${key}`),
  update: (key, value) => api.put(`/settings/${key}`, { setting_value: value }),
};

// Reports
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getMonthly: (yearMonth) => api.get(`/reports/monthly/${yearMonth}`),
  getAllStats: () => api.get('/reports/stats/all'),
};

export default api;
