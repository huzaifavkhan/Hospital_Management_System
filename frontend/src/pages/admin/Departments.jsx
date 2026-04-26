import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import Modal from '../../components/common/Modal';

function DeptForm({ dept, onSuccess, onCancel }) {
  const [form, setForm] = useState({ name: dept?.name || '', description: dept?.description || '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (dept?.id) {
        await api.put(`/admin/departments/${dept.id}`, form);
        Swal.fire({ icon: 'success', title: 'Department updated!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/admin/departments', form);
        Swal.fire({ icon: 'success', title: 'Department created!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      }
      onSuccess();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Department Name *</label>
        <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Cardiology" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="input resize-none" placeholder="Department description..." />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : dept?.id ? 'Update' : 'Create Department'}
        </button>
      </div>
    </form>
  );
}

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState(null);

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepts(); }, []);

  const handleDelete = async (dept) => {
    const res = await Swal.fire({
      title: 'Delete Department?',
      html: `<p>Delete <strong>${dept.name}</strong>? This fails if doctors are assigned.</p>`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete',
    });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/admin/departments/${dept.id}`);
      Swal.fire({ icon: 'success', title: 'Deleted!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      fetchDepts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Cannot delete (doctors may be assigned)' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">Departments</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage hospital departments</p>
        </div>
        <button onClick={() => { setEditDept(null); setShowForm(true); }} className="btn-primary">
          <Plus size={16} />
          Add Department
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-xl skeleton-shimmer" />)}
        </div>
      ) : departments.length === 0 ? (
        <div className="card p-10 text-center">
          <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No departments yet. Add the first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="card p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Building2 size={20} className="text-purple-500" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditDept(dept); setShowForm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(dept)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <h3 className="font-heading font-semibold text-gray-900 dark:text-gray-100">{dept.name}</h3>
              {dept.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{dept.description}</p>}
              <p className="text-xs text-teal font-medium mt-2">{dept._count?.doctors ?? dept.doctors?.length ?? 0} doctors</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editDept ? 'Edit Department' : 'Add Department'} onClose={() => { setShowForm(false); setEditDept(null); }}>
          <DeptForm
            dept={editDept}
            onSuccess={() => { setShowForm(false); setEditDept(null); fetchDepts(); }}
            onCancel={() => { setShowForm(false); setEditDept(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
