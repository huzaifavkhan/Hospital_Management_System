import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Phone, Building2, Stethoscope, Users, UserRound, Plus, X, CalendarDays } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import Modal from '../../components/common/Modal';
import DoctorForm from '../../components/forms/DoctorForm';
import AppointmentForm from '../../components/forms/AppointmentForm';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

function AssignPatientModal({ doctorId, onSuccess, onClose }) {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.length >= 1) {
        api.get(`/patients?search=${search}&limit=10`).then((r) => setPatients(r.data.data?.patients || [])).catch(() => {});
      } else {
        setPatients([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await api.post(`/doctors/${doctorId}/assign-patient`, { patientId: Number(selectedId) });
      Swal.fire({ icon: 'success', title: 'Patient assigned!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      onSuccess();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to assign' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Assign Patient to Doctor" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Search Patient</label>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedId(''); setSelectedName(''); }}
            placeholder="Type patient name..."
            className="input"
            autoFocus
          />
          {patients.length > 0 && !selectedId && (
            <div className="border border-gray-200 dark:border-slate-600 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-md bg-white dark:bg-slate-800">
              {patients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedId(p.id); setSelectedName(p.name); setSearch(p.name); setPatients([]); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-50 dark:border-slate-700 last:border-0"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-400 ml-2 text-xs">#{p.patientId}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 -mx-6 px-6 py-4 mt-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleAssign} disabled={!selectedId || loading} className="btn-primary">
            {loading ? 'Assigning...' : 'Assign Patient'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { basePath } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showAptForm, setShowAptForm] = useState(false);

  const fetchDoctor = async () => {
    try {
      const [dRes, pRes, aRes] = await Promise.all([
        api.get(`/doctors/${id}`),
        api.get(`/doctors/${id}/patients`),
        api.get('/appointments', { params: { doctorId: id, limit: 10 } }),
      ]);
      setDoctor(dRes.data.data);
      setAssignedPatients(pRes.data.data || []);
      setAppointments(aRes.data.data?.appointments || []);
    } catch {
      navigate(`${basePath}/doctors`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctor(); }, [id]);

  const handleUnassign = async (patientId, patientName) => {
    const res = await Swal.fire({ title: 'Unassign patient?', text: `Remove ${patientName} from this doctor?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Unassign' });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/doctors/${id}/unassign-patient/${patientId}`);
      Swal.fire({ icon: 'success', title: 'Patient unassigned', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      fetchDoctor();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) return null;

  const schedule = doctor.availabilitySchedule || {};

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">{doctor.name}</h1>
          <p className="text-gray-400 text-sm">{doctor.specialization} · {doctor.department?.name}</p>
        </div>
        <button onClick={() => setShowEditForm(true)} className="btn-secondary">
          <Pencil size={15} />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor info */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center">
              <Stethoscope size={24} className="text-teal" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{doctor.name}</p>
              <p className="text-xs text-gray-400">{doctor.specialization}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Building2 size={14} className="text-gray-400" />
              <span>{doctor.department?.name || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Phone size={14} className="text-gray-400" />
              <span>{doctor.contactNumber}</span>
            </div>
          </div>

          {/* Availability grid */}
          <div>
            <p className="label mb-2">Availability</p>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day) => {
                const s = schedule[day];
                return (
                  <div
                    key={day}
                    className={`text-center rounded-lg py-1 ${s?.start ? 'bg-teal/10 text-teal' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}
                    title={s?.start ? `${s.start}–${s.end}` : 'Day off'}
                  >
                    <p className="text-xs font-semibold">{DAY_SHORT[day]}</p>
                    <p className="text-[9px] mt-0.5">{s?.start ? '✓' : '—'}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 space-y-1">
              {DAYS.filter((d) => schedule[d]?.start).map((day) => (
                <p key={day} className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{DAY_SHORT[day]}:</span> {schedule[day].start} – {schedule[day].end}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Assigned Patients */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Users size={16} className="text-teal" />
              Assigned Patients ({assignedPatients.length})
            </h2>
            <button onClick={() => setShowAssign(true)} className="btn-primary py-1.5 text-xs">
              <Plus size={14} />
              Assign Patient
            </button>
          </div>
          {assignedPatients.length === 0 ? (
            <p className="text-sm text-gray-400">No patients assigned yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {assignedPatients.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <UserRound size={15} className="text-blue-500" />
                    </div>
                    <div>
                      <button onClick={() => navigate(`${basePath}/patients/${p.id}`)} className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-teal">
                        {p.name}
                      </button>
                      <p className="text-xs text-gray-400">#{p.patientId} · {p.age}y · {p.gender}</p>
                    </div>
                  </div>
                  <button onClick={() => handleUnassign(p.id, p.name)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Appointments */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <CalendarDays size={16} className="text-teal" />
            Appointments
          </h2>
          <button
            onClick={() => setShowAptForm(true)}
            className="btn-primary py-1.5 text-xs"
          >
            <Plus size={14} />
            Book
          </button>
        </div>
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-400">No appointments scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{apt.patient?.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(apt.dateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <StatusBadge status={apt.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditForm && (
        <Modal title="Edit Doctor" onClose={() => setShowEditForm(false)} size="lg">
          <DoctorForm
            doctor={doctor}
            onSuccess={() => { setShowEditForm(false); fetchDoctor(); }}
            onCancel={() => setShowEditForm(false)}
          />
        </Modal>
      )}

      {showAssign && (
        <AssignPatientModal
          doctorId={id}
          onSuccess={() => { setShowAssign(false); fetchDoctor(); }}
          onClose={() => setShowAssign(false)}
        />
      )}

      {showAptForm && (
        <Modal title="Book Appointment" onClose={() => setShowAptForm(false)} size="lg">
          <AppointmentForm
            initialDoctor={{ id: doctor.id, name: doctor.name }}
            onSuccess={() => { setShowAptForm(false); fetchDoctor(); }}
            onCancel={() => setShowAptForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
