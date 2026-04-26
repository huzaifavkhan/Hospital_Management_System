import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Trash2, Plus } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import Table from '../../components/common/Table';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import PatientForm from '../../components/forms/PatientForm';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export default function PatientList() {
  const navigate = useNavigate();
  const { basePath } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'new');
  const [editPatient, setEditPatient] = useState(null);
  const LIMIT = 10;

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients', { params: { page, limit: LIMIT, search } });
      const data = res.data.data;
      setPatients(data.patients || []);
      const pg = data.pagination || {};
      setTotalPages(pg.pages || 1);
      setTotal(pg.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, [page, search]);

  const handleSearch = (val) => { setSearch(val); setPage(1); };

  const handleDelete = async (patient) => {
    const result = await Swal.fire({
      title: 'Delete Patient?',
      html: `<p>This will permanently delete <strong>${patient.name}</strong> and all their records.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/patients/${patient.id}`);
      Swal.fire({ icon: 'success', title: 'Patient deleted', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      fetchPatients();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to delete' });
    }
  };

  const columns = [
    { key: 'patientId', label: 'Patient ID', width: '100px' },
    { key: 'name', label: 'Name' },
    { key: 'age', label: 'Age', width: '60px' },
    { key: 'gender', label: 'Gender', render: (r) => <StatusBadge status={r.gender} /> },
    { key: 'contactNumber', label: 'Contact' },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`${basePath}/patients/${row.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-teal hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors" title="View">
            <Eye size={15} />
          </button>
          <button onClick={() => { setEditPatient(row); setShowForm(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Edit">
            <Pencil size={15} />
          </button>
          <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">Patients</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage all registered patients</p>
        </div>
        <button onClick={() => { setEditPatient(null); setShowForm(true); }} className="btn-primary">
          <Plus size={16} />
          Register Patient
        </button>
      </div>

      <div className="flex gap-3">
        <SearchInput value={search} onChange={handleSearch} placeholder="Search by name, ID, contact..." className="w-72" />
      </div>

      <Table
        columns={columns}
        data={patients}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={LIMIT}
        onPageChange={setPage}
        emptyTitle="No patients registered"
        emptyDescription="Start by registering your first patient in the system."
        emptyAction={() => setShowForm(true)}
        emptyActionLabel="Register First Patient"
      />

      {showForm && (
        <Modal
          title={editPatient ? 'Edit Patient' : 'Register New Patient'}
          onClose={() => { setShowForm(false); setEditPatient(null); }}
          size="lg"
        >
          <PatientForm
            patient={editPatient}
            onSuccess={() => { setShowForm(false); setEditPatient(null); fetchPatients(); }}
            onCancel={() => { setShowForm(false); setEditPatient(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
