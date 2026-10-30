import React, { useState } from 'react';
import { User, X, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserAuthModal: React.FC = () => {
  const { showUserAuthModal, setShowUserAuthModal, loginAsListener } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showUserAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsSubmitting(true);
    try {
      await loginAsListener(email.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={() => setShowUserAuthModal(false)}
          className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Listener Profile
          </h2>
          <p className="text-xs text-neutral-400">
            Listening is 100% free with no registration required. Enter your email only if you want to sync your playlists and liked songs across devices.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Your Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="listener@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-transform transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Syncing...' : 'Sync Free Profile'}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowUserAuthModal(false)}
            className="text-xs text-neutral-400 hover:text-white"
          >
            Continue as Guest Listener
          </button>
        </div>
      </div>
    </div>
  );
};
