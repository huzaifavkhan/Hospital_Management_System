import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserRound, Cross, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/receptionist/dashboard');
    }
  }, [token, user, navigate]);

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-8 py-6">
        <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center">
          <Cross size={22} className="text-white" />
        </div>
        <div>
          <p className="font-heading text-white font-bold text-xl leading-tight">HMS</p>
          <p className="text-white/40 text-xs">Hospital Management System</p>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-16">
        <div className="mb-3 inline-flex items-center gap-2 bg-teal/10 border border-teal/20 rounded-full px-4 py-1.5">
          <Activity size={14} className="text-teal" />
          <span className="text-teal text-xs font-semibold">Clinical Management Platform</span>
        </div>
        <h1 className="font-heading text-white text-4xl sm:text-5xl font-bold mb-4 leading-tight max-w-2xl">
          Medical-grade precision,<br />
          <span className="text-teal">modern efficiency.</span>
        </h1>
        <p className="text-white/50 text-lg mb-12 max-w-lg">
          Streamline patient care, doctor scheduling, and hospital operations from a single trusted platform.
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => navigate('/login/admin')}
            className="group relative bg-navy-800 border border-white/10 hover:border-teal/40 rounded-2xl p-8 text-left transition-all duration-200 hover:bg-white/5 hover:shadow-2xl hover:shadow-teal/10"
          >
            <div className="w-14 h-14 rounded-xl bg-teal/10 group-hover:bg-teal/20 border border-teal/20 flex items-center justify-center mb-5 transition-colors">
              <ShieldCheck size={28} className="text-teal" />
            </div>
            <h2 className="font-heading text-white text-xl font-bold mb-2">Admin Login</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Full system access — manage departments, users, audit logs, reports, and hospital settings.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-teal text-sm font-semibold">
              Sign in as Admin →
            </div>
          </button>

          <button
            onClick={() => navigate('/login/receptionist')}
            className="group relative bg-navy-800 border border-white/10 hover:border-teal/40 rounded-2xl p-8 text-left transition-all duration-200 hover:bg-white/5 hover:shadow-2xl hover:shadow-teal/10"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center mb-5 transition-colors">
              <UserRound size={28} className="text-blue-400" />
            </div>
            <h2 className="font-heading text-white text-xl font-bold mb-2">Receptionist Login</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Manage patient registrations, appointments, and day-to-day front-desk operations.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-blue-400 text-sm font-semibold">
              Sign in as Receptionist →
            </div>
          </button>
        </div>
      </main>

      <footer className="text-center py-6 text-white/20 text-xs">
        © {new Date().getFullYear()} Hospital Management System — University Project
      </footer>
    </div>
  );
}
