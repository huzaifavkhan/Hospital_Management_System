import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

export default function AppointmentForm({ appointment, initialPatient, initialDoctor, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    patientId: appointment?.patientId || initialPatient?.id || '',
    doctorId:  appointment?.doctorId  || initialDoctor?.id  || '',
    dateTime:  appointment?.dateTime ? appointment.dateTime.slice(0, 16) : '',
    notes:     appointment?.notes || '',
  });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientSearch, setPatientSearch] = useState(
    appointment?.patient?.name || initialPatient?.name || ''
  );
  const [doctorSearch, setDoctorSearch] = useState(
    appointment?.doctor?.name || initialDoctor?.name || ''
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Lock the pre-filled fields so they can't be cleared
  const patientLocked = !!initialPatient && !appointment;
  const doctorLocked  = !!initialDoctor  && !appointment;

  useEffect(() => {
    if (patientLocked) return;
    const timer = setTimeout(() => {
      if (patientSearch.length >= 1) {
        api.get(`/patients?search=${patientSearch}&limit=10`)
          .then((r) => setPatients(r.data.data?.patients || []))
          .catch(() => {});
      } else {
        setPatients([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, patientLocked]);

  useEffect(() => {
    if (doctorLocked) return;
    const timer = setTimeout(() => {
      if (doctorSearch.length >= 1) {
        api.get(`/doctors?search=${doctorSearch}&limit=10`)
          .then((r) => setDoctors(r.data.data?.doctors || []))
          .catch(() => {});
      } else {
        setDoctors([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [doctorSearch, doctorLocked]);

  const validate = () => {
    const e = {};
    if (!form.patientId) e.patientId = 'Select a patient';
    if (!form.doctorId)  e.doctorId  = 'Select a doctor';
    if (!form.dateTime)  e.dateTime  = 'Date and time required';
    else if (new Date(form.dateTime) < new Date()) e.dateTime = 'Cannot schedule in the past';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, patientId: Number(form.patientId), doctorId: Number(form.doctorId) };
      if (appointment?.id) {
        await api.put(`/appointments/${appointment.id}`, payload);
        Swal.fire({ icon: 'success', title: 'Appointment rescheduled!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/appointments', payload);
        Swal.fire({ icon: 'success', title: 'Appointment booked!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      }
      onSuccess?.();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Patient */}
      <div>
        <label className="label">Patient *</label>
        {patientLocked ? (
          <div className="input bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
            {patientSearch}
          </div>
        ) : (
          <>
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => { setPatientSearch(e.target.value); setForm((f) => ({ ...f, patientId: '' })); }}
              placeholder="Search patient by name..."
              className={`input ${errors.patientId ? 'input-error' : ''}`}
            />
            {patients.length > 0 && !form.patientId && (
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-md bg-white dark:bg-slate-800">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setForm((f) => ({ ...f, patientId: p.id })); setPatientSearch(p.name); setPatients([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-50 dark:border-slate-700 last:border-0"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">#{p.patientId}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId}</p>}
      </div>

      {/* Doctor */}
      <div>
        <label className="label">Doctor *</label>
        {doctorLocked ? (
          <div className="input bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 cursor-not-allowed">
            {doctorSearch}
          </div>
        ) : (
          <>
            <input
              type="text"
              value={doctorSearch}
              onChange={(e) => { setDoctorSearch(e.target.value); setForm((f) => ({ ...f, doctorId: '' })); }}
              placeholder="Search doctor by name..."
              className={`input ${errors.doctorId ? 'input-error' : ''}`}
            />
            {doctors.length > 0 && !form.doctorId && (
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-md bg-white dark:bg-slate-800">
                {doctors.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => { setForm((f) => ({ ...f, doctorId: d.id })); setDoctorSearch(d.name); setDoctors([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-50 dark:border-slate-700 last:border-0"
                  >
                    <span className="font-medium">{d.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{d.specialization}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {errors.doctorId && <p className="text-red-500 text-xs mt-1">{errors.doctorId}</p>}
      </div>

      <div>
        <label className="label">Date & Time *</label>
        <input
          type="datetime-local"
          value={form.dateTime}
          onChange={(e) => setForm((f) => ({ ...f, dateTime: e.target.value }))}
          className={`input ${errors.dateTime ? 'input-error' : ''}`}
        />
        {errors.dateTime && <p className="text-red-500 text-xs mt-1">{errors.dateTime}</p>}
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Optional notes..."
          className="input resize-none"
        />
      </div>

      <div className="sticky bottom-0 -mx-6 px-6 py-4 mt-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : appointment?.id ? 'Reschedule' : 'Book Appointment'}
        </button>
      </div>
    </form>
  );
}
