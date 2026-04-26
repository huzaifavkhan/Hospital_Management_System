import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Moon, Sun, ChevronDown, KeyRound, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import api from '../../api/axios';
import Swal from 'sweetalert2';

function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Required';
    if (!form.newPassword || form.newPassword.length < 6) e.newPassword = 'Min 6 characters';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      Swal.fire({ icon: 'success', title: 'Password changed!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      onClose();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'currentPassword', label: 'Current Password', type: 'password' },
          { key: 'newPassword', label: 'New Password', type: 'password' },
          { key: 'confirmPassword', label: 'Confirm New Password', type: 'password' },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className={`input ${errors[key] ? 'input-error' : ''}`}
              placeholder={label}
            />
            {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
          </div>
        ))}
        <div className="sticky bottom-0 -mx-6 px-6 py-4 mt-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Change Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Header({ collapsed, setMobileOpen, darkMode, setDarkMode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
  };

  return (
    <>
      <header
        className={`fixed top-0 right-0 h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 z-20 flex items-center px-4 gap-4 shadow-sm transition-all duration-200 ${
          collapsed ? 'lg:left-[64px]' : 'lg:left-[260px]'
        } left-0`}
      >
        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-gray-500 hover:text-gray-700"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>

        {/* Page breadcrumb spacer */}
        <div className="flex-1" />

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode((d) => !d)}
          className="btn-ghost p-2 rounded-lg text-gray-500 dark:text-gray-400"
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center text-teal font-bold text-sm">
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight">{user?.fullName}</p>
              <p className="text-xs text-gray-400 leading-tight">{user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50">
              <button
                onClick={() => { setShowChangePw(true); setDropdownOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <KeyRound size={15} />
                Change Password
              </button>
              <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </>
  );
}
