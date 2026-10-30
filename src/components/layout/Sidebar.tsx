import React from 'react';
import { Home, Compass, Library, Heart, PlusCircle, Shield, Music, Disc } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Playlist } from '../../types/music';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  playlists: Playlist[];
  onSelectPlaylist?: (playlistId: string) => void;
  onCreatePlaylist?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  playlists,
  onSelectPlaylist,
  onCreatePlaylist
}) => {
  const { isAdmin, setShowAdminAuthModal } = useAuth();

  return (
    <>
      {/* Desktop Sidebar (Left column) */}
      <aside className="hidden md:flex flex-col w-64 bg-neutral-950/70 border-r border-neutral-800/70 p-4 gap-6 select-none shrink-0 h-[calc(100vh-65px-76px)] overflow-y-auto">
        {/* Navigation list */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onSelectTab('home')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'home'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Home className={`w-5 h-5 ${currentTab === 'home' ? 'text-emerald-400' : ''}`} />
            <span>Home</span>
          </button>

          <button
            onClick={() => onSelectTab('search')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'search'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Compass className={`w-5 h-5 ${currentTab === 'search' ? 'text-emerald-400' : ''}`} />
            <span>Discover & Search</span>
          </button>

          <button
            onClick={() => onSelectTab('library')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'library'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Library className={`w-5 h-5 ${currentTab === 'library' ? 'text-emerald-400' : ''}`} />
            <span>Your Library</span>
          </button>
        </div>

        {/* Playlists & Favorites Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800/60">
          <div className="flex items-center justify-between px-3 text-xs font-semibold text-neutral-400 tracking-wider">
            <span>COLLECTIONS</span>
            {onCreatePlaylist && (
              <button
                onClick={onCreatePlaylist}
                title="Create New Playlist"
                className="text-neutral-400 hover:text-emerald-400 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => onSelectTab('liked')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'liked'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center text-white">
              <Heart className="w-3.5 h-3.5 fill-white" />
            </div>
            <span>Liked Songs</span>
          </button>

          <button
            onClick={() => onSelectTab('albums')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'albums'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Disc className="w-5 h-5 text-neutral-400" />
            <span>Rabha Albums</span>
          </button>

          <button
            onClick={() => onSelectTab('artists')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'artists'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Music className="w-5 h-5 text-neutral-400" />
            <span>Indigenous Artists</span>
          </button>
        </div>

        {/* Custom Playlists list */}
        <div className="flex flex-col gap-1 pt-2 border-t border-neutral-800/60 flex-1 overflow-y-auto">
          <span className="px-3 text-xs font-semibold text-neutral-400 tracking-wider">
            PLAYLISTS
          </span>
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylist ? onSelectPlaylist(pl.id) : onSelectTab('playlists')}
              className="text-left px-3 py-1.5 text-xs text-neutral-400 hover:text-white truncate rounded-lg hover:bg-neutral-900/40 transition-colors"
            >
              {pl.name}
            </button>
          ))}
        </div>

        {/* Admin Dashboard Entry */}
        <div className="pt-2 border-t border-neutral-800/60">
          <button
            onClick={() => isAdmin ? onSelectTab('admin') : setShowAdminAuthModal(true)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium border transition-all ${
              currentTab === 'admin'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Admin Management</span>
            </div>
            {isAdmin && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                OWNER
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (Pattern 1 from §3 Mobile Reference) */}
      <nav className="md:hidden fixed bottom-[76px] left-0 right-0 z-30 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/80 px-4 py-1.5 grid grid-cols-4 items-center h-14">
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            currentTab === 'home' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Home</span>
        </button>

        <button
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            currentTab === 'search' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Discover</span>
        </button>

        <button
          onClick={() => onSelectTab('library')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            currentTab === 'library' || currentTab === 'liked' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Library</span>
        </button>

        <button
          onClick={() => isAdmin ? onSelectTab('admin') : setShowAdminAuthModal(true)}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            currentTab === 'admin' ? 'text-emerald-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Admin</span>
        </button>
      </nav>
    </>
  );
};
