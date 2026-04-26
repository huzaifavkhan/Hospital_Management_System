import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

export default function VisitForm({ patientId, visit, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    doctorId: visit?.doctorId || '',
    visitDate: visit?.visitDate ? visit.visitDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
    diagnosis: visit?.diagnosis || '',
    summary: visit?.summary || '',
  });
  const [doctors, setDoctors] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/doctors?limit=100').then((r) => setDoctors(r.data.data?.doctors || [])).catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.doctorId) e.doctorId = 'Select a doctor';
    if (!form.visitDate) e.visitDate = 'Visit date required';
    if (!form.diagnosis.trim()) e.diagnosis = 'Diagnosis is required';
    if (!form.summary.trim()) e.summary = 'Summary is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    className: `input ${errors[key] ? 'input-error' : ''}`,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, doctorId: Number(form.doctorId) };
      if (visit?.id) {
        await api.put(`/patients/${patientId}/visits/${visit.id}`, payload);
        Swal.fire({ icon: 'success', title: 'Visit updated!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      } else {
        await api.post(`/patients/${patientId}/visits`, payload);
        Swal.fire({ icon: 'success', title: 'Visit logged!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
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
      <div>
        <label className="label">Doctor *</label>
        <select {...field('doctorId')}>
          <option value="">Select doctor</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
          ))}
        </select>
        {errors.doctorId && <p className="text-red-500 text-xs mt-1">{errors.doctorId}</p>}
      </div>
      <div>
        <label className="label">Visit Date & Time *</label>
        <input type="datetime-local" {...field('visitDate')} />
        {errors.visitDate && <p className="text-red-500 text-xs mt-1">{errors.visitDate}</p>}
      </div>
      <div>
        <label className="label">Diagnosis *</label>
        <input type="text" placeholder="e.g. Acute bronchitis" {...field('diagnosis')} />
        {errors.diagnosis && <p className="text-red-500 text-xs mt-1">{errors.diagnosis}</p>}
      </div>
      <div>
        <label className="label">Summary *</label>
        <textarea
          rows={4}
          placeholder="Treatment notes, prescriptions, follow-up..."
          className={`input resize-none ${errors.summary ? 'input-error' : ''}`}
          value={form.summary}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
        />
        {errors.summary && <p className="text-red-500 text-xs mt-1">{errors.summary}</p>}
      </div>
      <div className="sticky bottom-0 -mx-6 px-6 py-4 mt-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : visit?.id ? 'Update Visit' : 'Log Visit'}
        </button>
      </div>
    </form>
  );
}
