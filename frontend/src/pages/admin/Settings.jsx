import { useState, useEffect } from 'react';
import { Save, Cross } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

export default function Settings() {
  const [form, setForm] = useState({ name: '', contact: '', address: '', email: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then((r) => {
        const s = r.data.data;
        if (s) setForm({
          name: s.hospital_name || '',
          contact: s.hospital_contact || '',
          address: s.hospital_address || '',
          email: s.hospital_email || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Hospital name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        hospital_name: form.name,
        hospital_contact: form.contact,
        hospital_address: form.address,
        hospital_email: form.email,
      });
      Swal.fire({ icon: 'success', title: 'Settings saved!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const field = (key, type = 'text') => ({
    type,
    value: form[key],
    onChange: (e) => setForm(f => ({ ...f, [key]: e.target.value })),
    className: `input ${errors[key] ? 'input-error' : ''}`,
    disabled: loading,
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">Hospital Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Configure hospital information and details</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
            <Cross size={20} className="text-teal" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">Hospital Information</p>
            <p className="text-xs text-gray-400">This information appears in reports and documents</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-10 rounded-lg skeleton-shimmer" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Hospital Name *</label>
              <input placeholder="City General Hospital" {...field('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Contact Number</label>
                <input placeholder="+92 21 12345678" {...field('contact')} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input placeholder="info@hospital.com" {...field('email', 'email')} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label className="label">Address</label>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                className="input resize-none"
                placeholder="123 Medical Center Road, City"
                disabled={loading}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving || loading} className="btn-primary">
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
