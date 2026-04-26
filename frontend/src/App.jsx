import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

import Landing from './pages/Landing';
import LoginAdmin from './pages/LoginAdmin';
import LoginReceptionist from './pages/LoginReceptionist';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

import PatientList from './pages/patients/PatientList';
import PatientDetail from './pages/patients/PatientDetail';
import DoctorList from './pages/doctors/DoctorList';
import DoctorDetail from './pages/doctors/DoctorDetail';
import AppointmentList from './pages/appointments/AppointmentList';

import AdminDashboard from './pages/admin/AdminDashboard';
import Departments from './pages/admin/Departments';
import Users from './pages/admin/Users';
import AuditLogs from './pages/admin/AuditLogs';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

function PrivateRoute({ children, role }) {
  const { token, user } = useAuth();
  if (!token || !user) return <Navigate to="/" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/receptionist/dashboard'} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login/admin" element={<LoginAdmin />} />
      <Route path="/login/receptionist" element={<LoginReceptionist />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <PrivateRoute role="ADMIN">
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="doctors" element={<DoctorList />} />
        <Route path="doctors/:id" element={<DoctorDetail />} />
        <Route path="appointments" element={<AppointmentList />} />
        <Route path="departments" element={<Departments />} />
        <Route path="users" element={<Users />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Receptionist routes */}
      <Route
        path="/receptionist"
        element={
          <PrivateRoute role="RECEPTIONIST">
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="doctors" element={<DoctorList />} />
        <Route path="doctors/:id" element={<DoctorDetail />} />
        <Route path="appointments" element={<AppointmentList />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
