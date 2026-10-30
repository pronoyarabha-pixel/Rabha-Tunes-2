import React, { useState } from 'react';
import { Shield, X, Key, Mail, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminAuthModal: React.FC = () => {
  const { showAdminAuthModal, setShowAdminAuthModal, loginAsAdmin, setupAdmin } = useAuth();
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [email, setEmail] = useState('admin@rabhatunes.com');
  const [password, setPassword] = useState('rabha2026');
  const [name, setName] = useState('App Administrator');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showAdminAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await loginAsAdmin(email, password);
      } else {
        await setupAdmin(name, email);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={() => setShowAdminAuthModal(false)}
          className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Admin Portal Login' : 'Initialize Administrator'}
          </h2>
          <p className="text-xs text-neutral-400">
            {mode === 'login'
              ? 'Authorized dashboard access to upload, manage, and schedule music catalog.'
              : 'Create or update the primary administrator profile for Rabha Tunes.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'setup' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Admin Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rabha Tunes Admin"
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rabhatunes.com"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Admin Password
            </label>
            <div className="relative flex items-center">
              <Key className="absolute left-3 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {mode === 'login' && (
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 text-[11px] text-neutral-400">
              <p className="font-semibold text-neutral-300">Quick Credentials:</p>
              <p>Email: <code className="text-emerald-400 font-mono">admin@rabhatunes.com</code></p>
              <p>Password: <code className="text-emerald-400 font-mono">rabha2026</code></p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-transform transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Authenticating...'
              : mode === 'login'
              ? 'Access Admin Dashboard'
              : 'Save & Initialize Admin'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'setup' : 'login');
              setError(null);
            }}
            className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors"
          >
            {mode === 'login'
              ? 'Need to initialize a custom admin account? Click here'
              : 'Already have admin access? Return to login'}
          </button>
        </div>
      </div>
    </div>
  );
};
