import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const EMPTY = { name: '', age: '', gender: 'Male', contactNumber: '', address: '', medicalHistory: '' };

export default function PatientForm({ patient, onSuccess, onCancel }) {
  const [form, setForm] = useState(patient ? {
    name: patient.name || '',
    age: patient.age || '',
    gender: patient.gender || 'Male',
    contactNumber: patient.contactNumber || '',
    address: patient.address || '',
    medicalHistory: patient.medicalHistory || '',
  } : EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    const age = Number(form.age);
    if (!form.age || isNaN(age) || age < 0 || age > 150) e.age = 'Valid age (0–150) required';
    if (!form.gender) e.gender = 'Gender is required';
    if (!form.contactNumber.trim()) e.contactNumber = 'Contact number is required';
    else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(form.contactNumber.trim())) e.contactNumber = 'Enter a valid contact number';
    if (!form.address.trim()) e.address = 'Address is required';
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
      const payload = { ...form, age: Number(form.age) };
      if (patient?.id) {
        await api.put(`/patients/${patient.id}`, payload);
        Swal.fire({ icon: 'success', title: 'Patient updated!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/patients', payload);
        Swal.fire({ icon: 'success', title: 'Patient registered!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Full Name *</label>
          <input type="text" placeholder="John Doe" {...field('name')} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="label">Age *</label>
          <input type="number" min="0" max="150" placeholder="25" {...field('age')} />
          {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
        </div>
        <div>
          <label className="label">Gender *</label>
          <select {...field('gender')}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
        </div>
        <div>
          <label className="label">Contact Number *</label>
          <input type="text" placeholder="+92 300 1234567" {...field('contactNumber')} />
          {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
        </div>
        <div>
          <label className="label">Address *</label>
          <input type="text" placeholder="123 Main Street, City" {...field('address')} />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Medical History</label>
          <textarea
            rows={3}
            placeholder="Previous conditions, allergies, surgeries..."
            className={`input resize-none ${errors.medicalHistory ? 'input-error' : ''}`}
            value={form.medicalHistory}
            onChange={(e) => setForm((f) => ({ ...f, medicalHistory: e.target.value }))}
          />
        </div>
      </div>
      <div className="sticky bottom-0 -mx-6 px-6 py-4 mt-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : patient?.id ? 'Update Patient' : 'Register Patient'}
        </button>
      </div>
    </form>
  );
}
