import { useState, useEffect, useRef } from 'react';
import { Users, UserRound, Building2, CalendarDays, Stethoscope, Plus, CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { SkeletonCard } from '../components/common/SkeletonLoader';

function AnimatedCounter({ target, duration = 1200 }) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return <>{count.toLocaleString()}</>;
}

function StatCard({ icon: Icon, label, value, color, loading }) {
  if (loading) return <SkeletonCard />;
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-0.5">{label}</p>
        <p className="font-heading text-gray-900 dark:text-gray-100 text-2xl font-bold">
          <AnimatedCounter target={value || 0} />
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, basePath } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats')
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: UserRound, label: 'Total Patients', value: stats?.totalPatients, color: 'bg-blue-500' },
    { icon: Stethoscope, label: 'Total Doctors', value: stats?.totalDoctors, color: 'bg-teal' },
    { icon: Building2, label: 'Departments', value: stats?.totalDepartments, color: 'bg-purple-500' },
    { icon: Users, label: 'Total Users', value: stats?.totalUsers, color: 'bg-amber-500' },
    { icon: CalendarDays, label: "Today's Appointments", value: stats?.todaysAppointments ?? stats?.todayAppointments, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`${basePath}/patients?action=new`)} className="btn-secondary hidden sm:flex">
            <Plus size={16} />
            Register Patient
          </button>
          <button onClick={() => navigate(`${basePath}/appointments?action=new`)} className="btn-primary hidden sm:flex">
            <CalendarPlus size={16} />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Register Patient', path: `${basePath}/patients?action=new`, icon: UserRound, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Book Appointment', path: `${basePath}/appointments?action=new`, icon: CalendarPlus, color: 'text-teal bg-teal-50 dark:bg-teal-900/20' },
              { label: 'View Patients', path: `${basePath}/patients`, icon: Users, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
              { label: 'View Appointments', path: `${basePath}/appointments`, icon: CalendarDays, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
            ].map(({ label, path, icon: Icon, color }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-teal/30 hover:shadow-card-hover transition-all duration-150 text-center"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Department Breakdown */}
        {stats?.departmentBreakdown && (
          <div className="card p-5">
            <h2 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Department Doctors</h2>
            <div className="space-y-3">
              {stats.departmentBreakdown.slice(0, 5).map((dept) => (
                <div key={dept.id || dept.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400 truncate">{dept.name}</span>
                    <span className="text-gray-800 dark:text-gray-200 font-semibold ml-2">{dept._count?.doctors ?? dept.doctorCount ?? 0}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(5, ((dept._count?.doctors ?? dept.doctorCount ?? 0) / (stats?.totalDoctors || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
