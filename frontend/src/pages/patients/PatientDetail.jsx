import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Plus, UserRound, Phone, MapPin,
  CalendarDays, FileText, Stethoscope, ClipboardList,
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import Modal from '../../components/common/Modal';
import PatientForm from '../../components/forms/PatientForm';
import VisitForm from '../../components/forms/VisitForm';
import AppointmentForm from '../../components/forms/AppointmentForm';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { basePath } = useAuth();

  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showAptForm, setShowAptForm] = useState(false);
  const [editVisit, setEditVisit] = useState(null);

  const fetchPatient = async () => {
    try {
      const [pRes, vRes, aRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/patients/${id}/visits`),
        api.get('/appointments', { params: { patientId: id, limit: 10 } }),
      ]);
      setPatient(pRes.data.data);
      setVisits(vRes.data.data || []);
      setAssignedDoctors((pRes.data.data?.doctors || []).map((d) => d.doctor ?? d));
      setAppointments(aRes.data.data?.appointments || []);
    } catch {
      navigate(`${basePath}/patients`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatient(); }, [id]);

  const handleUnassignDoctor = async (doctorId) => {
    const res = await Swal.fire({ title: 'Unassign doctor?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Unassign' });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/doctors/${doctorId}/unassign-patient/${id}`);
      Swal.fire({ icon: 'success', title: 'Doctor unassigned', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      fetchPatient();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const handleDeleteVisit = async (visit) => {
    const res = await Swal.fire({ title: 'Delete visit?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/patients/${id}/visits/${visit.id}`);
      Swal.fire({ icon: 'success', title: 'Visit deleted', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      fetchPatient();
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

  if (!patient) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">{patient.name}</h1>
          <p className="text-gray-400 text-sm">Patient ID: {patient.patientId}</p>
        </div>
        <button onClick={() => setShowEditForm(true)} className="btn-secondary">
          <Pencil size={15} />
          Edit
        </button>
        <button onClick={() => setShowAptForm(true)} className="btn-primary">
          <CalendarDays size={15} />
          Book Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Info Card */}
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <UserRound size={24} className="text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{patient.name}</p>
              <StatusBadge status={patient.gender} />
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            <InfoRow icon={CalendarDays} label="Age" value={`${patient.age} years`} />
            <InfoRow icon={Phone} label="Contact" value={patient.contactNumber} />
            <InfoRow icon={MapPin} label="Address" value={patient.address} />
            {patient.medicalHistory && (
              <InfoRow icon={FileText} label="Medical History" value={patient.medicalHistory} />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Registered {new Date(patient.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Doctors */}
          <div className="card p-5">
            <h2 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Stethoscope size={16} className="text-teal" />
              Assigned Doctors
            </h2>
            {assignedDoctors.length === 0 ? (
              <p className="text-sm text-gray-400">No doctors assigned.</p>
            ) : (
              <div className="space-y-2">
                {assignedDoctors.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.specialization}</p>
                    </div>
                    <button
                      onClick={() => handleUnassignDoctor(doc.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      Unassign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visit History */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <ClipboardList size={16} className="text-teal" />
                Visit History
              </h2>
              <button onClick={() => { setEditVisit(null); setShowVisitForm(true); }} className="btn-primary py-1.5 text-xs">
                <Plus size={14} />
                Log Visit
              </button>
            </div>
            {visits.length === 0 ? (
              <p className="text-sm text-gray-400">No visits recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {visits.map((visit) => (
                  <div key={visit.id} className="border border-gray-100 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{visit.diagnosis}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(visit.visitDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · Dr. {visit.doctor?.name}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditVisit(visit); setShowVisitForm(true); }} className="p-1 text-gray-400 hover:text-amber-500 rounded">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDeleteVisit(visit)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{visit.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appointments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
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
              <p className="text-sm text-gray-400">No appointments found.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {appointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Dr. {apt.doctor?.name}
                      </p>
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
        </div>
      </div>

      {showEditForm && (
        <Modal title="Edit Patient" onClose={() => setShowEditForm(false)} size="lg">
          <PatientForm
            patient={patient}
            onSuccess={() => { setShowEditForm(false); fetchPatient(); }}
            onCancel={() => setShowEditForm(false)}
          />
        </Modal>
      )}

      {showVisitForm && (
        <Modal title={editVisit ? 'Edit Visit' : 'Log New Visit'} onClose={() => { setShowVisitForm(false); setEditVisit(null); }}>
          <VisitForm
            patientId={id}
            visit={editVisit}
            onSuccess={() => { setShowVisitForm(false); setEditVisit(null); fetchPatient(); }}
            onCancel={() => { setShowVisitForm(false); setEditVisit(null); }}
          />
        </Modal>
      )}

      {showAptForm && (
        <Modal title="Book Appointment" onClose={() => setShowAptForm(false)} size="lg">
          <AppointmentForm
            initialPatient={{ id: patient.id, name: patient.name }}
            onSuccess={() => { setShowAptForm(false); fetchPatient(); }}
            onCancel={() => setShowAptForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
