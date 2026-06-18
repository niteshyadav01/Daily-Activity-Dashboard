import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiCheckCircle, FiAlertCircle, FiFile, FiX } from 'react-icons/fi';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { uploadAPI } from '../utils/api';

const Upload = ({ onMenuClick }) => {
  const fileInput  = useRef(null);
  const [loading, setLoading]     = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview]     = useState(null);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [dragOver, setDragOver]   = useState(false);

  const processFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Only .xlsx, .xls and .csv files are supported.'); return;
    }
    try {
      setLoading(true); setError(''); setPreview(null);
      const res = await uploadAPI.preview(file);
      setPreview(res.data);
    } catch (e) { setError(e.response?.data?.error || 'Error reading file'); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) processFile(f); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); };

  const handleImport = async () => {
    if (!preview?.data?.toAdd?.length) { setError('No new employees to import'); return; }
    try {
      setImporting(true); setError('');
      await uploadAPI.import(preview.data.toAdd);
      setSuccess(`Successfully imported ${preview.data.toAdd.length} employees!`);
      setPreview(null);
      if (fileInput.current) fileInput.current.value = '';
      setTimeout(() => setSuccess(''), 5000);
    } catch (e) { setError(e.response?.data?.error || 'Import failed'); }
    finally { setImporting(false); }
  };

  const reset = () => { setPreview(null); setError(''); if (fileInput.current) fileInput.current.value = ''; };

  return (
    <div className="page-wrapper">
      <TopBar title="Upload Employees" onMenuClick={onMenuClick} />
      <div className="page-content">
        <div className="max-w-2xl mx-auto space-y-5">
          {error   && <div className="alert-error"><FiAlertCircle size={16} className="flex-shrink-0" /><p>{error}</p></div>}
          {success && <div className="alert-success"><FiCheckCircle size={16} className="flex-shrink-0" /><p>{success}</p></div>}

          {/* Drop zone */}
          {!preview && !loading && (
            <div
              onClick={() => fileInput.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`card p-10 sm:p-14 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all duration-200
                ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40'}`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragOver ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                <FiUploadCloud size={32} className={dragOver ? 'text-indigo-500' : 'text-slate-400'} />
              </div>
              <p className="text-base font-bold text-slate-700 mb-1">
                {dragOver ? 'Drop your file here' : 'Upload Excel or CSV'}
              </p>
              <p className="text-sm text-slate-400 mb-4">Drag & drop or click to select</p>
              <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors">
                Choose File
              </span>
              <p className="text-xs text-slate-400 mt-3">Supported: .xlsx · .xls · .csv</p>
              <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            </div>
          )}

          {loading && (
            <div className="card py-16">
              <LoadingSpinner size="lg" />
              <p className="text-center text-sm text-slate-400 mt-3">Reading file…</p>
            </div>
          )}

          {/* Preview */}
          {preview && !loading && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Import Preview</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Review before importing</p>
                </div>
                <button onClick={reset} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><FiX size={16} /></button>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
                {[
                  { label: 'Total Records', value: preview.summary.total,      bg: 'bg-indigo-50',  text: 'text-indigo-700' },
                  { label: 'To Import',     value: preview.summary.toAdd,       bg: 'bg-emerald-50', text: 'text-emerald-700' },
                  { label: 'Already Exist', value: preview.summary.skipped,    bg: 'bg-amber-50',   text: 'text-amber-700' },
                  { label: 'Invalid',       value: preview.summary.duplicates, bg: 'bg-red-50',     text: 'text-red-700' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-extrabold ${s.text}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* New employees table */}
              {preview.data.toAdd.length > 0 && (
                <div className="px-5 pb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    New Employees ({preview.data.toAdd.length})
                  </p>
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">Name</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">Department</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {preview.data.toAdd.slice(0, 8).map((e, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium text-slate-700">{e.employee_name}</td>
                            <td className="px-4 py-2.5 text-slate-500">{e.department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.data.toAdd.length > 8 && (
                      <p className="px-4 py-2 text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                        + {preview.data.toAdd.length - 8} more employees
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 px-5 pb-5">
                <button onClick={handleImport} disabled={importing || preview.data.toAdd.length === 0}
                  className="btn-success flex-1">
                  {importing ? <LoadingSpinner size="sm" /> : <FiCheckCircle size={16} />}
                  {importing ? 'Importing…' : `Import ${preview.data.toAdd.length} Employees`}
                </button>
                <button onClick={reset} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          )}

          {/* Format guide */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Expected Excel Format</p>
            <div className="rounded-xl border border-slate-100 overflow-hidden text-sm">
              <table className="w-full">
                <thead><tr className="bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Employee Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Department</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {[['Salman Sir', 'Projects'], ['Abhishekh Bharti', 'Projects'], ['Dahesh', 'Accounts']].map(([n, d]) => (
                    <tr key={n}><td className="px-4 py-2.5 text-slate-600">{n}</td><td className="px-4 py-2.5 text-slate-400">{d}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-3">Column names are detected automatically — the tool looks for columns containing "name"/"employee" and "department"/"dept".</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
