import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { uploadAPI } from '../utils/api';

const Upload = () => {
  const fileInput = useRef(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Only .xlsx, .xls, and .csv files are supported');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setPreview(null);

      const response = await uploadAPI.preview(file);
      setPreview(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error previewing file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview?.data?.toAdd || preview.data.toAdd.length === 0) {
      setError('No valid employees to import');
      return;
    }

    try {
      setImporting(true);
      setError('');

      await uploadAPI.import(preview.data.toAdd);
      setSuccess(`Successfully imported ${preview.data.toAdd.length} employees!`);
      setPreview(null);
      setFileInput.current.value = '';

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error importing employees');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="ml-64 min-h-screen bg-gray-100">
      <TopBar title="Upload Employees" />

      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Upload Area */}
          <div
            onClick={() => fileInput.current?.click()}
            className="bg-white rounded-lg shadow p-12 border-2 border-dashed border-gray-300 text-center cursor-pointer hover:border-blue-500 transition-colors"
          >
            <FiUploadCloud className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Excel File</h3>
            <p className="text-gray-600 mb-4">
              Drop your file here or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supported: .xlsx, .xls, .csv
            </p>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <FiCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Preview */}
          {loading ? (
            <div className="mt-8 bg-white rounded-lg shadow p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : preview ? (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Import Summary</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{preview.summary.total}</p>
                  <p className="text-sm text-gray-600">Total Records</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{preview.summary.toAdd}</p>
                  <p className="text-sm text-gray-600">To Import</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{preview.summary.skipped}</p>
                  <p className="text-sm text-gray-600">Duplicates</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{preview.summary.duplicates}</p>
                  <p className="text-sm text-gray-600">Invalid</p>
                </div>
              </div>

              {/* To Add Table */}
              {preview.data.toAdd.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">New Employees ({preview.data.toAdd.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.data.toAdd.slice(0, 10).map((emp, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{emp.employee_name}</td>
                            <td className="px-4 py-2">{emp.department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.data.toAdd.length > 10 && (
                      <p className="text-sm text-gray-600 mt-2">
                        ... and {preview.data.toAdd.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Skipped Table */}
              {preview.data.skipped.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 text-yellow-700">
                    Already Exists ({preview.data.skipped.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-yellow-50 border-b">
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.data.skipped.slice(0, 5).map((emp, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{emp.employee_name}</td>
                            <td className="px-4 py-2">{emp.department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleImport}
                  disabled={importing || preview.data.toAdd.length === 0}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {importing ? <LoadingSpinner size="sm" /> : <FiCheckCircle size={20} />}
                  {importing ? 'Importing...' : 'Import Now'}
                </button>
                <button
                  onClick={() => {
                    setPreview(null);
                    fileInput.current.value = '';
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {/* Expected Format */}
          <div className="mt-8 bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">📋 Expected Excel Format</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="px-4 py-2 text-left">Employee Name</th>
                  <th className="px-4 py-2 text-left">Department</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-4 py-2">Salman Sir</td>
                  <td className="px-4 py-2">Projects</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2">Abhishekh Bharti</td>
                  <td className="px-4 py-2">Projects</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2">Dahesh</td>
                  <td className="px-4 py-2">Accounts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
