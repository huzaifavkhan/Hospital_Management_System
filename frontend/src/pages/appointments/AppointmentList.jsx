import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, XCircle, CheckCircle, RefreshCcw, X } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import AppointmentForm from '../../components/forms/AppointmentForm';
import StatusBadge from '../../components/common/StatusBadge';

const STATUS_OPTIONS = ['', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'];

// Typeahead that resolves a name search to a numeric ID
function EntityPicker({ placeholder, endpoint, labelKey = 'name', subKey, onSelect, onClear, selected }) {
  const [query, setQuery] = useState(selected?.label || '');
  const [results, setResults] = useState([]);
  const timer = useRef(null);

  useEffect(() => {
    setQuery(selected?.label || '');
  }, [selected]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val) { onClear(); setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await api.get(endpoint, { params: { search: val, limit: 8 } });
        const items = res.data.data?.[Object.keys(res.data.data).find(k => Array.isArray(res.data.data[k]))] || [];
        setResults(items);
      } catch { setResults([]); }
    }, 300);
  };

  const handlePick = (item) => {
    setQuery(item[labelKey]);
    setResults([]);
    onSelect({ id: item.id, label: item[labelKey] });
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onClear();
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="input pr-7"
        />
        {query && (
          <button onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePick(item)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-50 dark:border-slate-700 last:border-0"
            >
              <span className="font-medium">{item[labelKey]}</span>
              {subKey && <span className="text-gray-400 ml-2 text-xs">{item[subKey]}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppointmentList() {
  const [searchParams] = useSearchParams();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  // Resolved IDs for filter — the API requires numeric patientId / doctorId
  const [patientFilter, setPatientFilter] = useState(null);   // { id, label }
  const [doctorFilter, setDoctorFilter] = useState(null);     // { id, label }
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'new');
  const [reschedule, setReschedule] = useState(null);
  const LIMIT = 10;

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments', {
        params: {
          page,
          limit: LIMIT,
          ...(patientFilter?.id ? { patientId: patientFilter.id } : {}),
          ...(doctorFilter?.id  ? { doctorId:  doctorFilter.id  } : {}),
          ...(statusFilter      ? { status: statusFilter }        : {}),
          ...(dateFrom          ? { from: dateFrom }              : {}),
          ...(dateTo            ? { to: dateTo }                  : {}),
        },
      });
      const data = res.data.data;
      setAppointments(data.appointments || []);
      const pg = data.pagination || {};
      setTotalPages(pg.pages ?? data.totalPages ?? 1);
      setTotal(pg.total ?? data.total ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [page, patientFilter, doctorFilter, statusFilter, dateFrom, dateTo]);

  const handleCancel = async (apt) => {
    const result = await Swal.fire({
      title: 'Cancel Appointment?',
      text: `Cancel appointment for ${apt.patient?.name} with Dr. ${apt.doctor?.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'Keep',
    });
    if (!result.isConfirmed) return;
    try {
      await api.patch(`/appointments/${apt.id}/cancel`);
      Swal.fire({ icon: 'success', title: 'Appointment cancelled', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      fetchAppointments();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const handleMarkComplete = async (apt) => {
    const result = await Swal.fire({
      title: 'Mark as Completed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      confirmButtonText: 'Mark Complete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.put(`/appointments/${apt.id}`, { status: 'COMPLETED' });
      Swal.fire({ icon: 'success', title: 'Marked as completed', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      fetchAppointments();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const columns = [
    { key: 'id', label: 'APT ID', width: '80px', render: (r) => <span className="text-xs font-mono text-gray-500">#{r.id}</span> },
    { key: 'patient', label: 'Patient', render: (r) => r.patient?.name || '—' },
    { key: 'doctor',  label: 'Doctor',  render: (r) => r.doctor?.name  || '—' },
    {
      key: 'dateTime',
      label: 'Date & Time',
      render: (r) => r.dateTime
        ? new Date(r.dateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—',
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'notes',  label: 'Notes',   render: (r) => r.notes ? <span className="text-xs text-gray-500 truncate max-w-[120px] block">{r.notes}</span> : <span className="text-gray-300">—</span> },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (row) => {
        const done = ['CANCELLED', 'COMPLETED'].includes(row.status);
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => { setReschedule(row); setShowForm(true); }} disabled={done}
              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Reschedule">
              <RefreshCcw size={14} />
            </button>
            <button onClick={() => handleMarkComplete(row)} disabled={done}
              className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Mark Complete">
              <CheckCircle size={14} />
            </button>
            <button onClick={() => handleCancel(row)} disabled={done}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Cancel">
              <XCircle size={14} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">Appointments</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage all scheduled appointments</p>
        </div>
        <button onClick={() => { setReschedule(null); setShowForm(true); }} className="btn-primary">
          <Plus size={16} />
          Book Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <EntityPicker
            placeholder="Filter by patient..."
            endpoint="/patients"
            labelKey="name"
            subKey="patientId"
            selected={patientFilter}
            onSelect={(v) => { setPatientFilter(v); setPage(1); }}
            onClear={() => { setPatientFilter(null); setPage(1); }}
          />
          <EntityPicker
            placeholder="Filter by doctor..."
            endpoint="/doctors"
            labelKey="name"
            subKey="specialization"
            selected={doctorFilter}
            onSelect={(v) => { setDoctorFilter(v); setPage(1); }}
            onClear={() => { setDoctorFilter(null); setPage(1); }}
          />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input" />
          <input type="date" value={dateTo}   onChange={(e) => { setDateTo(e.target.value);   setPage(1); }} className="input" />
        </div>
        {(patientFilter || doctorFilter || statusFilter || dateFrom || dateTo) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-400">Active filters:</span>
            {patientFilter && <span className="badge bg-blue-50 text-blue-700 ring-1 ring-blue-200">{patientFilter.label} <button onClick={() => { setPatientFilter(null); setPage(1); }} className="ml-1">×</button></span>}
            {doctorFilter  && <span className="badge bg-teal-50 text-teal-700 ring-1 ring-teal-200">{doctorFilter.label} <button onClick={() => { setDoctorFilter(null); setPage(1); }} className="ml-1">×</button></span>}
            {statusFilter  && <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">{statusFilter} <button onClick={() => { setStatusFilter(''); setPage(1); }} className="ml-1">×</button></span>}
          </div>
        )}
      </div>

      <Table
        columns={columns}
        data={appointments}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={LIMIT}
        onPageChange={setPage}
        emptyTitle="No appointments found"
        emptyDescription="Try adjusting your filters or book a new appointment."
        emptyAction={() => setShowForm(true)}
        emptyActionLabel="Book Appointment"
      />

      {showForm && (
        <Modal
          title={reschedule ? 'Reschedule Appointment' : 'Book New Appointment'}
          onClose={() => { setShowForm(false); setReschedule(null); }}
          size="lg"
        >
          <AppointmentForm
            appointment={reschedule}
            onSuccess={() => { setShowForm(false); setReschedule(null); fetchAppointments(); }}
            onCancel={() => { setShowForm(false); setReschedule(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
