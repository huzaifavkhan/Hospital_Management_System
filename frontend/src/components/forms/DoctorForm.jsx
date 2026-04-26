import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// Convert API format { monday: { start, end } } → UI format { monday: { available, start, end } }
const apiToUi = (apiSchedule) =>
  Object.fromEntries(
    DAYS.map((d) => [
      d,
      apiSchedule?.[d]
        ? { available: true, start: apiSchedule[d].start || '09:00', end: apiSchedule[d].end || '17:00' }
        : { available: WEEKDAYS.includes(d), start: '09:00', end: '17:00' },
    ])
  );

// Convert UI format → API format (only include available days, use start/end keys)
const uiToApi = (uiSchedule) =>
  Object.fromEntries(
    DAYS.filter((d) => uiSchedule[d]?.available).map((d) => [
      d,
      { start: uiSchedule[d].start, end: uiSchedule[d].end },
    ])
  );

export default function DoctorForm({ doctor, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: doctor?.name || '',
    specialization: doctor?.specialization || '',
    contactNumber: doctor?.contactNumber || '',
    departmentId: doctor?.departmentId || '',
    availabilitySchedule: apiToUi(doctor?.availabilitySchedule),
  });
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/departments').then((r) => setDepartments(r.data.data || [])).catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.specialization.trim()) e.specialization = 'Specialization is required';
    if (!form.contactNumber.trim()) e.contactNumber = 'Contact is required';
    if (!form.departmentId) e.departmentId = 'Department is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    className: `input ${errors[key] ? 'input-error' : ''}`,
  });

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      availabilitySchedule: {
        ...f.availabilitySchedule,
        [day]: { ...f.availabilitySchedule[day], available: !f.availabilitySchedule[day].available },
      },
    }));
  };

  const setTime = (day, field, val) => {
    setForm((f) => ({
      ...f,
      availabilitySchedule: {
        ...f.availabilitySchedule,
        [day]: { ...f.availabilitySchedule[day], [field]: val },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        departmentId: Number(form.departmentId),
        availabilitySchedule: uiToApi(form.availabilitySchedule),
      };
      if (doctor?.id) {
        await api.put(`/doctors/${doctor.id}`, payload);
        Swal.fire({ icon: 'success', title: 'Doctor updated!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/doctors', payload);
        Swal.fire({ icon: 'success', title: 'Doctor registered!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      }
      onSuccess?.();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Full Name *</label>
          <input type="text" placeholder="Dr. Jane Smith" {...field('name')} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="label">Specialization *</label>
          <input type="text" placeholder="Cardiology" {...field('specialization')} />
          {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization}</p>}
        </div>
        <div>
          <label className="label">Contact Number *</label>
          <input type="text" placeholder="+92 300 1234567" {...field('contactNumber')} />
          {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
        </div>
        <div>
          <label className="label">Department *</label>
          <select {...field('departmentId')}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
        </div>
      </div>

      {/* Availability schedule */}
      <div>
        <label className="label">Availability Schedule</label>
        <div className="space-y-2 mt-2">
          {DAYS.map((day) => {
            const sched = form.availabilitySchedule[day] || {};
            return (
              <div key={day} className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-16 text-center text-xs font-semibold py-1.5 rounded-lg border transition-colors ${
                    sched.available
                      ? 'bg-teal text-white border-teal'
                      : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-slate-700 dark:border-slate-600'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
                {sched.available && (
                  <>
                    <input
                      type="time"
                      value={sched.start || '09:00'}
                      onChange={(e) => setTime(day, 'start', e.target.value)}
                      className="input w-auto text-xs py-1"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="time"
                      value={sched.end || '17:00'}
                      onChange={(e) => setTime(day, 'end', e.target.value)}
                      className="input w-auto text-xs py-1"
                    />
                  </>
                )}
                {!sched.available && <span className="text-xs text-gray-400">Day off</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-6 px-6 py-4 mt-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : doctor?.id ? 'Update Doctor' : 'Register Doctor'}
        </button>
      </div>
    </form>
  );
}
