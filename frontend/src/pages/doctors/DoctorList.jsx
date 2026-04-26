import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Trash2, Plus } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import DoctorForm from '../../components/forms/DoctorForm';
import { useAuth } from '../../context/AuthContext';

export default function DoctorList() {
  const navigate = useNavigate();
  const { basePath, user } = useAuth();
  const [searchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'new');
  const [editDoctor, setEditDoctor] = useState(null);
  const LIMIT = 10;

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/admin/departments').then((r) => setDepartments(r.data.data || [])).catch(() => {});
    }
  }, [user]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors', {
        params: {
          page, limit: LIMIT, search,
          ...(deptFilter ? { departmentId: deptFilter } : {}),
          ...(specFilter ? { specialization: specFilter } : {}),
        },
      });
      const data = res.data.data;
      setDoctors(data.doctors || []);
      const pg = data.pagination || {};
      setTotalPages(pg.pages || 1);
      setTotal(pg.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, [page, search, deptFilter, specFilter]);

  const handleSearch = (val) => { setSearch(val); setPage(1); };

  const handleDelete = async (doctor) => {
    const result = await Swal.fire({
      title: 'Delete Doctor?',
      html: `<p>Delete <strong>${doctor.name}</strong>? This will remove all their records.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/doctors/${doctor.id}`);
      Swal.fire({ icon: 'success', title: 'Doctor deleted', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      fetchDoctors();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to delete' });
    }
  };

  const columns = [
    { key: 'doctorId', label: 'Doctor ID', width: '100px' },
    { key: 'name', label: 'Name' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'department', label: 'Department', render: (r) => r.department?.name || '—' },
    { key: 'contactNumber', label: 'Contact' },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`${basePath}/doctors/${row.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-teal hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors" title="View">
            <Eye size={15} />
          </button>
          <button onClick={() => { setEditDoctor(row); setShowForm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Edit">
            <Pencil size={15} />
          </button>
          {user?.role === 'ADMIN' ? (
            <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
              <Trash2 size={15} />
            </button>
          ) : (
            <button disabled title="Admin only" className="p-1.5 rounded-lg text-gray-200 dark:text-gray-600 cursor-not-allowed">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">Doctors</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage all registered doctors</p>
        </div>
        <button onClick={() => { setEditDoctor(null); setShowForm(true); }} className="btn-primary">
          <Plus size={16} />
          Register Doctor
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={handleSearch} placeholder="Search by name..." className="w-56" />
        <input
          type="text"
          value={specFilter}
          onChange={(e) => { setSpecFilter(e.target.value); setPage(1); }}
          placeholder="Filter by specialization..."
          className="input w-52"
        />
        {departments.length > 0 && (
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="input w-48"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>

      <Table
        columns={columns}
        data={doctors}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={LIMIT}
        onPageChange={setPage}
        emptyTitle="No doctors registered"
        emptyDescription="Register your first doctor to get started."
        emptyAction={() => setShowForm(true)}
        emptyActionLabel="Register First Doctor"
      />

      {showForm && (
        <Modal
          title={editDoctor ? 'Edit Doctor' : 'Register New Doctor'}
          onClose={() => { setShowForm(false); setEditDoctor(null); }}
          size="lg"
        >
          <DoctorForm
            doctor={editDoctor}
            onSuccess={() => { setShowForm(false); setEditDoctor(null); fetchDoctors(); }}
            onCancel={() => { setShowForm(false); setEditDoctor(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
