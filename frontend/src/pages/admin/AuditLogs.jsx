import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/common/Table';

const ENTITIES = ['', 'Patient', 'Doctor', 'Visit', 'Appointment', 'Department', 'User', 'HospitalSettings'];
const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'CANCEL', 'ASSIGN_PATIENT', 'UNASSIGN_PATIENT', 'DEACTIVATE'];

function JsonViewer({ data }) {
  const [open, setOpen] = useState(false);
  if (!data) return <span className="text-gray-400">—</span>;
  const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1 text-xs text-teal hover:text-teal-700 font-medium">
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? 'Hide' : 'View details'}
      </button>
      {open && (
        <pre className="mt-2 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 overflow-x-auto max-w-sm max-h-32 overflow-y-auto text-gray-600 dark:text-gray-400">
          {str}
        </pre>
      )}
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs', {
        params: {
          page, limit: LIMIT,
          ...(entityFilter ? { entity: entityFilter } : {}),
          ...(actionFilter ? { action: actionFilter } : {}),
        },
      });
      const data = res.data.data;
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, entityFilter, actionFilter]);

  const columns = [
    {
      key: 'createdAt',
      label: 'Time',
      width: '160px',
      render: (r) => new Date(r.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    },
    { key: 'user', label: 'User', render: (r) => r.user?.fullName || r.user?.username || '—' },
    {
      key: 'action',
      label: 'Action',
      render: (r) => (
        <span className={`badge ring-1 ${
          r.action === 'CREATE' ? 'bg-green-50 text-green-700 ring-green-200' :
          r.action === 'DELETE' || r.action === 'DEACTIVATE' || r.action === 'CANCEL' ? 'bg-red-50 text-red-600 ring-red-200' :
          'bg-amber-50 text-amber-700 ring-amber-200'
        }`}>
          {r.action}
        </span>
      ),
    },
    { key: 'entity', label: 'Entity' },
    { key: 'entityId', label: 'Entity ID', width: '80px' },
    { key: 'details', label: 'Details', render: (r) => <JsonViewer data={r.details} /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Complete system activity trail</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className="input w-44">
          {ENTITIES.map(e => <option key={e} value={e}>{e || 'All Entities'}</option>)}
        </select>
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="input w-44">
          {ACTIONS.map(a => <option key={a} value={a}>{a || 'All Actions'}</option>)}
        </select>
      </div>

      <Table
        columns={columns}
        data={logs}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={LIMIT}
        onPageChange={setPage}
        emptyTitle="No audit logs found"
        emptyDescription="Activity will appear here as users interact with the system."
      />
    </div>
  );
}
