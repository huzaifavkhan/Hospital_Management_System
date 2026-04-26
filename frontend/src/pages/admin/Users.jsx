import { useState, useEffect } from 'react';
import { Plus, Pencil, UserX } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

const ROLES = ['', 'ADMIN', 'RECEPTIONIST', 'STAFF'];

function UserForm({ user, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    email: user?.email || '',
    role: user?.role || 'RECEPTIONIST',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username required';
    if (!form.fullName.trim()) e.fullName = 'Full name required';
    if (!form.role) e.role = 'Role required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!user && !form.password) e.password = 'Password required for new user';
    if (form.password && form.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { username: form.username, fullName: form.fullName, email: form.email || null, role: form.role };
      if (form.password) payload.password = form.password;
      if (user?.id) {
        await api.put(`/admin/users/${user.id}`, payload);
        Swal.fire({ icon: 'success', title: 'User updated!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      } else {
        await api.post('/admin/users', payload);
        Swal.fire({ icon: 'success', title: 'User created!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      }
      onSuccess();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  const field = (key, type = 'text') => ({
    type,
    value: form[key],
    onChange: (e) => setForm(f => ({ ...f, [key]: e.target.value })),
    className: `input ${errors[key] ? 'input-error' : ''}`,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Username *</label>
          <input placeholder="john_admin" {...field('username')} />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
        </div>
        <div>
          <label className="label">Full Name *</label>
          <input placeholder="John Doe" {...field('fullName')} />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>
        <div className="col-span-2">
          <label className="label">Email <span className="text-gray-400 font-normal">(for password reset)</span></label>
          <input type="email" placeholder="user@hospital.com" {...field('email', 'email')} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="label">Role *</label>
          <select {...field('role')}>
            {ROLES.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
        </div>
        <div>
          <label className="label">{user ? 'New Password (optional)' : 'Password *'}</label>
          <input placeholder="••••••••" {...field('password', 'password')} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>
      </div>
      <div className="sticky bottom-0 -mx-6 px-6 py-4 mt-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const LIMIT = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { page, limit: LIMIT, ...(search ? { search } : {}), ...(roleFilter ? { role: roleFilter } : {}) },
      });
      const data = res.data.data;
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]);

  const handleDeactivate = async (user) => {
    const res = await Swal.fire({
      title: 'Deactivate User?',
      text: `Deactivate ${user.fullName}? They will no longer be able to log in.`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Deactivate',
    });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      Swal.fire({ icon: 'success', title: 'User deactivated', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      fetchUsers();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'username', label: 'Username' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Email', render: (r) => r.email || <span className="text-gray-400 text-xs">—</span> },
    { key: 'role', label: 'Role', render: (r) => <StatusBadge status={r.role} /> },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive === false ? 'INACTIVE' : 'ACTIVE'} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '90px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditUser(row); setShowForm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Edit">
            <Pencil size={15} />
          </button>
          <button onClick={() => handleDeactivate(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Deactivate">
            <UserX size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage system users and roles</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowForm(true); }} className="btn-primary">
          <Plus size={16} />
          Create User
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by username, name..." className="w-64" />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="input w-40">
          {ROLES.map(r => <option key={r} value={r}>{r || 'All Roles'}</option>)}
        </select>
      </div>

      <Table
        columns={columns}
        data={users}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={LIMIT}
        onPageChange={setPage}
        emptyTitle="No users found"
        emptyDescription="Create the first system user."
        emptyAction={() => setShowForm(true)}
        emptyActionLabel="Create User"
      />

      {showForm && (
        <Modal title={editUser ? 'Edit User' : 'Create User'} onClose={() => { setShowForm(false); setEditUser(null); }} size="lg">
          <UserForm
            user={editUser}
            onSuccess={() => { setShowForm(false); setEditUser(null); fetchUsers(); }}
            onCancel={() => { setShowForm(false); setEditUser(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
