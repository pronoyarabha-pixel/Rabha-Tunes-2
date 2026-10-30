import React from 'react';
import { Shield, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const { user, isAdmin, setShowAdminAuthModal, setShowUserAuthModal, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-neutral-950/85 backdrop-blur-md border-b border-neutral-800/60">
      {/* Zone 1: Single Brand Wordmark */}
      <button
        onClick={() => onSelectTab('home')}
        className="flex items-center gap-2.5 text-left focus:outline-none group whitespace-nowrap shrink-0"
      >
        <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/30 flex items-center justify-center bg-emerald-950/40">
          <img
            src="/src/assets/images/rabha_tunes_logo_1793373855039.jpg"
            alt="Rabha Tunes"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
          Rabha Tunes
        </span>
      </button>

      {/* Zone 2: Concise single-line navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-400">
        <button
          onClick={() => onSelectTab('home')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'home' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Home
        </button>
        <button
          onClick={() => onSelectTab('search')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'search' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => onSelectTab('library')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'library' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Library
        </button>
        <button
          onClick={() => onSelectTab('playlists')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentTab === 'playlists' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          Playlists
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentTab === 'admin'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </button>
            <button
              onClick={logout}
              title="Sign Out Admin"
              className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdminAuthModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Login</span>
            </button>
            {user ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="max-w-[80px] truncate">{user.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowUserAuthModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Free Guest</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
