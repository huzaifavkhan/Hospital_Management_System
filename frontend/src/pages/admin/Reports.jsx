import { useState } from 'react';
import { BarChart3, Download, FileText } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const REPORT_TYPES = [
  { value: 'patients', label: 'Patients Report', icon: FileText, color: 'bg-blue-500' },
  { value: 'doctors', label: 'Doctors Report', icon: FileText, color: 'bg-teal' },
  { value: 'summary', label: 'Summary Report', icon: BarChart3, color: 'bg-purple-500' },
];

export default function Reports() {
  const [reportType, setReportType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!reportType) {
      Swal.fire({ icon: 'warning', title: 'Select a report type first' });
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const res = await api.get('/admin/reports', {
        params: { type: reportType, ...(dateFrom ? { from: dateFrom } : {}), ...(dateTo ? { to: dateTo } : {}) },
      });
      setResults(res.data.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to generate report' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hms_${reportType}_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTable = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return <p className="text-gray-400 text-sm">No data returned for this report.</p>;
    }
    const keys = Object.keys(data[0]);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              {keys.map(k => (
                <th key={k} className="table-header capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                {keys.map(k => (
                  <td key={k} className="table-cell">
                    {typeof row[k] === 'object' && row[k] !== null
                      ? JSON.stringify(row[k])
                      : row[k] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Generate and export operational reports</p>
      </div>

      {/* Report type selector */}
      <div className="card p-5">
        <h2 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Select Report Type</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {REPORT_TYPES.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => setReportType(value)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                reportType === value
                  ? 'border-teal bg-teal-50 dark:bg-teal-900/20'
                  : 'border-gray-100 dark:border-slate-700 hover:border-teal/30'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={18} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div>
            <label className="label">From Date</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-44" />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-44" />
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading || !reportType} className="btn-primary">
          {loading && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
          )}
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Results */}
      {results !== null && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-200">
              {REPORT_TYPES.find(r => r.value === reportType)?.label} Results
            </h2>
            <button onClick={handleExport} className="btn-secondary">
              <Download size={15} />
              Export JSON
            </button>
          </div>
          <div className="p-5">
            {Array.isArray(results)
              ? renderTable(results)
              : typeof results === 'object'
              ? (
                <div className="space-y-4">
                  {Object.entries(results).map(([key, val]) => (
                    <div key={key}>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300 capitalize mb-2">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {Array.isArray(val) ? renderTable(val) : <p className="text-sm text-gray-600 dark:text-gray-400">{JSON.stringify(val)}</p>}
                    </div>
                  ))}
                </div>
              )
              : <p className="text-sm text-gray-600 dark:text-gray-400">{String(results)}</p>
            }
          </div>
        </div>
      )}
    </div>
  );
}
