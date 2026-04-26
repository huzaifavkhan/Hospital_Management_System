import { useState, useEffect, useRef } from 'react';
import { Users, UserRound, Building2, CalendarDays, Stethoscope, Activity, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import StatusBadge from '../../components/common/StatusBadge';

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

function StatCard({ icon: Icon, label, value, color, sub, loading }) {
  if (loading) return <SkeletonCard />;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">
        <AnimatedCounter target={value || 0} />
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/audit-logs', { params: { limit: 5 } }),
    ])
      .then(([sRes, aRes]) => {
        setStats(sRes.data.data);
        setAuditLogs(aRes.data.data?.logs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: UserRound, label: 'Total Patients', value: stats?.totalPatients, color: 'bg-blue-500', sub: 'Registered in system' },
    { icon: Stethoscope, label: 'Total Doctors', value: stats?.totalDoctors, color: 'bg-teal', sub: 'Active medical staff' },
    { icon: Building2, label: 'Departments', value: stats?.totalDepartments, color: 'bg-purple-500', sub: 'Clinical units' },
    { icon: Users, label: 'System Users', value: stats?.totalUsers, color: 'bg-amber-500', sub: 'Admin & receptionists' },
    { icon: CalendarDays, label: "Today's Appointments", value: stats?.todaysAppointments ?? stats?.todayAppointments, color: 'bg-green-500', sub: 'Scheduled for today' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">System-wide overview and analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department breakdown */}
        {stats?.departmentBreakdown && (
          <div className="card p-5">
            <h2 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-teal" />
              Department Overview
            </h2>
            <div className="space-y-3">
              {stats.departmentBreakdown.map((dept) => {
                const count = dept._count?.doctors ?? dept.doctorCount ?? 0;
                const max = Math.max(...stats.departmentBreakdown.map((d) => d._count?.doctors ?? d.doctorCount ?? 0), 1);
                return (
                  <div key={dept.id || dept.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{dept.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">{count} doctor{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal to-teal-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(5, (count / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Audit Logs */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Activity size={16} className="text-teal" />
              Recent Activity
            </h2>
            <button onClick={() => navigate('/admin/audit-logs')} className="text-teal text-xs font-medium hover:text-teal-700">
              View all →
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg skeleton-shimmer" />)}
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-gray-400">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={13} className="text-teal" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      <span className="font-medium">{log.user?.fullName || log.user?.username}</span>
                      {' '}<span className="text-gray-400">{log.action}</span>{' '}
                      <span className="font-medium">{log.entity}</span>
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={11} />
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
