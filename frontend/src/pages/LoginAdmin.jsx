import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ShieldCheck, Eye, EyeOff, Cross } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import api from '../api/axios';
import Swal from 'sweetalert2';

function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { username });
      setStep(2);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim() || !newPassword) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken: tokenInput, newPassword });
      Swal.fire({ icon: 'success', title: 'Password reset!', text: 'You can now sign in with your new password.', confirmButtonColor: '#00bcd4' });
      onClose();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Invalid or expired token' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={step === 1 ? 'Forgot Password' : 'Reset Password'} onClose={onClose} size="sm">
      {step === 1 ? (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Enter your username and we'll email you a reset token.</p>
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              className="input"
              autoFocus
            />
          </div>
          <div className="sticky bottom-0 -mx-6 px-6 py-4 mt-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading || !username.trim()} className="btn-primary">
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="bg-teal/10 border border-teal/20 rounded-xl p-3 text-sm text-teal">
            Check your email for the reset token and paste it below.
          </div>
          <div>
            <label className="label">Reset Token</label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste token from email"
              className="input font-mono text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </div>
          <div className="sticky bottom-0 -mx-6 px-6 py-4 mt-2 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading || !tokenInput.trim() || !newPassword} className="btn-primary">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function LoginAdmin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgot, setShowForgot] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/login/admin', form);
      const { token, user } = res.data.data;
      login(token, user);
      navigate('/admin/dashboard');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Login Failed', text: err.response?.data?.message || 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-navy to-navy-800 border-r border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center">
            <Cross size={18} className="text-white" />
          </div>
          <span className="font-heading text-white font-bold">HMS</span>
        </div>
        <div>
          <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center mb-6">
            <ShieldCheck size={32} className="text-teal" />
          </div>
          <h1 className="font-heading text-white text-3xl font-bold mb-3">Admin Portal</h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Full system control. Manage staff, review audit trails, configure hospital settings, and generate operational reports.
          </p>
        </div>
        <p className="text-white/20 text-sm">Authorized personnel only</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
              <Cross size={16} className="text-white" />
            </div>
            <span className="font-heading text-white font-bold">HMS</span>
          </div>

          <h2 className="font-heading text-white text-2xl font-bold mb-1">Sign in</h2>
          <p className="text-white/40 text-sm mb-8">Admin credentials required</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">Username</label>
              <input
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="admin_username"
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal transition-colors ${errors.username ? 'border-red-500' : 'border-white/10'}`}
              />
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal transition-colors pr-12 ${errors.password ? 'border-red-500' : 'border-white/10'}`}
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              <button type="button" onClick={() => setShowForgot(true)} className="mt-1.5 text-xs text-white/30 hover:text-teal transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-white/30 hover:text-white/60 text-sm transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}
