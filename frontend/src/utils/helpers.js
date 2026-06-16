import * as XLSX from 'xlsx';

export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

export const convertToCSV = (data, filename) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, filename);
};

export const createTableFromJSON = (data) => {
  if (!data || data.length === 0) return [];
  return data.map((item, index) => ({
    ...item,
    __rowIndex: index
  }));
};

export const pageTitle = {
  dashboard: 'Dashboard',
  employees: 'Employee Management',
  upload: 'Upload Employees',
  generate: 'Generate Daily Activity',
  history: 'Activity History',
  reports: 'Reports',
  settings: 'Settings'
};
