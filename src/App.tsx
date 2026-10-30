import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MusicPlayer } from './components/player/MusicPlayer';
import { FullScreenPlayer } from './components/player/FullScreenPlayer';
import { QueueDrawer } from './components/player/QueueDrawer';
import { HomeView } from './components/home/HomeView';
import { SearchView } from './components/search/SearchView';
import { LibraryView } from './components/library/LibraryView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminAuthModal } from './components/auth/AdminAuthModal';
import { UserAuthModal } from './components/auth/UserAuthModal';
import { AddToPlaylistModal } from './components/library/AddToPlaylistModal';
import { CreatePlaylistModal } from './components/library/CreatePlaylistModal';
import { Song, Album, Artist, Playlist } from './types/music';
import { api } from './services/api';
import { useRealtimeCatalog } from './hooks/useRealtimeCatalog';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [historySongs, setHistorySongs] = useState<Song[]>([]);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');
  const [playlistSongModalId, setPlaylistSongModalId] = useState<string | null>(null);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Refresh public music catalog
  const loadPublicCatalog = useCallback(async () => {
    try {
      const [songsData, albumsData, artistsData, playlistsData, historyData] = await Promise.all([
        api.getSongs(),
        api.getAlbums(),
        api.getArtists(),
        api.getPlaylists(),
        api.getHistory()
      ]);
      setSongs(songsData);
      setAlbums(albumsData);
      setArtists(artistsData);
      setPlaylists(playlistsData);
      setHistorySongs(historyData);
    } catch (err) {
      console.warn('Notice: Catalog loading...', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time catalog updates via WebSockets
  const { notification, dismissNotification, isConnected } = useRealtimeCatalog(loadPublicCatalog);

  useEffect(() => {
    loadPublicCatalog();

    // Auto-refresh catalog every 30 seconds to automatically surface newly published scheduled songs
    const interval = setInterval(() => {
      loadPublicCatalog();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadPublicCatalog]);

  const handleSelectAlbum = (albumTitle: string) => {
    setSearchInitialQuery(albumTitle);
    setCurrentTab('search');
  };

  const handleSelectArtist = (artistName: string) => {
    setSearchInitialQuery(artistName);
    setCurrentTab('search');
  };

  const handleUpdatePlaylist = (updated: Playlist) => {
    setPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Bar Contract Header */}
      <Header currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar & Mobile Bottom Tabs */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          playlists={playlists}
          onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        />

        {/* Dynamic Main View Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-neutral-400 font-medium">Loading Rabha Tunes...</p>
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'home' && (
                <HomeView
                  songs={songs}
                  albums={albums}
                  artists={artists}
                  playlists={playlists}
                  historySongs={historySongs}
                  onSelectTab={setCurrentTab}
                  onSelectAlbum={handleSelectAlbum}
                  onSelectArtist={handleSelectArtist}
                  onSelectPlaylist={() => setCurrentTab('playlists')}
                />
              )}

              {currentTab === 'search' && (
                <SearchView
                  songs={songs}
                  albums={albums}
                  artists={artists}
                  initialQuery={searchInitialQuery}
                  onSelectAlbum={handleSelectAlbum}
                  onSelectArtist={handleSelectArtist}
                />
              )}

              {(currentTab === 'library' || currentTab === 'liked' || currentTab === 'playlists' || currentTab === 'albums' || currentTab === 'artists') && (
                <LibraryView
                  playlists={playlists}
                  songs={songs}
                  albums={albums}
                  artists={artists}
                  historySongs={historySongs}
                  initialTab={
                    currentTab === 'liked'
                      ? 'liked'
                      : currentTab === 'albums'
                      ? 'albums'
                      : currentTab === 'artists'
                      ? 'artists'
                      : 'playlists'
                  }
                  onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
                  onUpdatePlaylist={handleUpdatePlaylist}
                  onDeletePlaylist={handleDeletePlaylist}
                />
              )}

              {currentTab === 'admin' && <AdminDashboard onSongUpdated={loadPublicCatalog} />}
            </>
          )}
        </main>
      </div>

      {/* Real-time live catalog notification */}
      {notification && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 bg-neutral-900/95 text-white border border-emerald-500/50 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>{notification.message}</span>
          <button
            onClick={dismissNotification}
            className="text-neutral-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Persistent Bottom Music Player */}
      <MusicPlayer onOpenPlaylistModal={(songId) => setPlaylistSongModalId(songId)} />

      {/* Full Screen Player Modal */}
      <FullScreenPlayer />

      {/* Up Next Play Queue Drawer */}
      <QueueDrawer />

      {/* Modals */}
      <AdminAuthModal />
      <UserAuthModal />
      <AddToPlaylistModal
        songId={playlistSongModalId}
        playlists={playlists}
        songs={songs}
        onClose={() => setPlaylistSongModalId(null)}
        onUpdatePlaylist={handleUpdatePlaylist}
        onCreateNewPlaylist={() => setIsCreatePlaylistOpen(true)}
      />
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreated={(pl) => setPlaylists((prev) => [...prev, pl])}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </AuthProvider>
  );
}
