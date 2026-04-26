import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserRound, CalendarDays, Building2,
  ShieldCheck, ClipboardList, BarChart3, Settings, LogOut,
  ChevronDown, ChevronRight, Stethoscope, Activity, X, Menu,
  Cross,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const adminNav = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/admin/dashboard',
  },
  {
    label: 'Patients',
    icon: UserRound,
    children: [
      { label: 'All Patients', to: '/admin/patients' },
      { label: 'Register Patient', to: '/admin/patients?action=new' },
    ],
  },
  {
    label: 'Doctors',
    icon: Stethoscope,
    children: [
      { label: 'All Doctors', to: '/admin/doctors' },
      { label: 'Register Doctor', to: '/admin/doctors?action=new' },
    ],
  },
  {
    label: 'Appointments',
    icon: CalendarDays,
    children: [
      { label: 'All Appointments', to: '/admin/appointments' },
      { label: 'Book Appointment', to: '/admin/appointments?action=new' },
    ],
  },
  {
    label: 'Admin Panel',
    icon: ShieldCheck,
    children: [
      { label: 'Dashboard Stats', to: '/admin/dashboard' },
      { label: 'Departments', to: '/admin/departments' },
      { label: 'Users', to: '/admin/users' },
      { label: 'Audit Logs', to: '/admin/audit-logs' },
      { label: 'Reports', to: '/admin/reports' },
      { label: 'Settings', to: '/admin/settings' },
    ],
  },
];

const receptionistNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/receptionist/dashboard' },
  {
    label: 'Patients',
    icon: UserRound,
    children: [
      { label: 'All Patients', to: '/receptionist/patients' },
      { label: 'Register Patient', to: '/receptionist/patients?action=new' },
    ],
  },
  {
    label: 'Doctors',
    icon: Stethoscope,
    children: [
      { label: 'All Doctors', to: '/receptionist/doctors' },
    ],
  },
  {
    label: 'Appointments',
    icon: CalendarDays,
    children: [
      { label: 'All Appointments', to: '/receptionist/appointments' },
      { label: 'Book Appointment', to: '/receptionist/appointments?action=new' },
    ],
  },
];

function NavItem({ item, collapsed }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;

  if (!item.children) {
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'active' : ''}`
        }
        title={collapsed ? item.label : undefined}
      >
        <Icon size={18} className="flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="sidebar-link w-full justify-between"
        title={collapsed ? item.label : undefined}
      >
        <span className="flex items-center gap-3">
          <Icon size={18} className="flex-shrink-0" />
          {!collapsed && item.label}
        </span>
        {!collapsed && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
      </button>
      {open && !collapsed && (
        <div className="mt-0.5 space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                `sidebar-link-sub ${isActive ? 'active' : ''}`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role === 'ADMIN' ? adminNav : receptionistNav;

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'You will be signed out of the system.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00bcd4',
      cancelButtonText: 'Stay',
      confirmButtonText: 'Logout',
    });
    if (result.isConfirmed) {
      logout();
      navigate('/');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center flex-shrink-0">
          <Cross size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-heading text-white font-bold text-base leading-tight">HMS</p>
            <p className="text-white/50 text-xs">Hospital System</p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto text-white/40 hover:text-white/80 transition-colors hidden lg:block"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Collapse toggle when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center justify-center py-3 text-white/40 hover:text-white/80 transition-colors border-b border-white/10"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map((item) => (
          <NavItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-3 py-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-teal/30 flex items-center justify-center text-teal font-bold text-sm flex-shrink-0">
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-white/50 text-xs">{user?.role}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-navy fixed top-0 left-0 h-full z-30 transition-all duration-200 ${
          collapsed ? 'w-[64px]' : 'w-[260px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-[260px] bg-navy z-50 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
