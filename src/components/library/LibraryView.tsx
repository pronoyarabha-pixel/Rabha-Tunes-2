import React, { useState } from 'react';
import { Heart, Plus, ListMusic, Clock, Disc, Music, Play, PlusCircle } from 'lucide-react';
import { Playlist, Song, Album, Artist } from '../../types/music';
import { useAudio } from '../../context/AudioContext';
import { PlaylistDetailView } from './PlaylistDetailView';
import { formatDuration } from '../../utils/format';

interface LibraryViewProps {
  playlists: Playlist[];
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  historySongs: Song[];
  initialTab?: 'playlists' | 'liked' | 'history' | 'albums' | 'artists';
  onCreatePlaylist: () => void;
  onUpdatePlaylist: (updated: Playlist) => void;
  onDeletePlaylist: (id: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  playlists,
  songs,
  albums,
  artists,
  historySongs,
  initialTab = 'playlists',
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist
}) => {
  const { playSong, likedSongIds, toggleLike } = useAudio();
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'history' | 'albums' | 'artists'>(
    initialTab
  );
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Liked songs list
  const likedSongs = songs.filter((s) => likedSongIds.has(s.id));

  // If a playlist is selected, render PlaylistDetailView
  if (selectedPlaylistId) {
    const pl = playlists.find((p) => p.id === selectedPlaylistId);
    if (pl) {
      return (
        <PlaylistDetailView
          playlist={pl}
          allSongs={songs}
          onBack={() => setSelectedPlaylistId(null)}
          onUpdatePlaylist={onUpdatePlaylist}
          onDeletePlaylist={(id) => {
            onDeletePlaylist(id);
            setSelectedPlaylistId(null);
          }}
        />
      );
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 pb-28">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Library
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Personal playlists, saved Rabha folk songs, and listening history.
          </p>
        </div>

        <button
          onClick={onCreatePlaylist}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'playlists'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span>Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('liked')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'liked'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-emerald-400" />
          <span>Liked Songs ({likedSongs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'history'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>History ({historySongs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('albums')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'albums'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>Albums ({albums.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('artists')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'artists'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Artists ({artists.length})</span>
        </button>
      </div>

      {/* Content depending on active tab */}
      {/* 1. PLAYLISTS */}
      {activeTab === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Create new card */}
          <div
            onClick={onCreatePlaylist}
            className="group p-5 rounded-2xl bg-neutral-900/30 hover:bg-neutral-900 border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col items-center justify-center text-center min-h-[190px]"
          >
            <PlusCircle className="w-10 h-10 text-neutral-400 group-hover:text-emerald-400 transition-colors mb-2" />
            <h3 className="text-sm font-bold text-white">Create New Playlist</h3>
            <p className="text-xs text-neutral-400 mt-1">Organize your favorite Rabha melodies</p>
          </div>

          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setSelectedPlaylistId(pl.id)}
              className="group p-4 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 cursor-pointer transition-all flex flex-col"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-md">
                <img
                  src={pl.coverUrl || '/src/assets/images/album_rabha_echoes_1793373855412.jpg'}
                  alt={pl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400">
                {pl.name}
              </h3>
              <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                {pl.description || 'Custom playlist'}
              </p>
              <p className="text-[11px] text-emerald-400 mt-2 font-mono">
                {pl.songIds.length} tracks
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 2. LIKED SONGS */}
      {activeTab === 'liked' && (
        <div className="space-y-4">
          {likedSongs.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => playSong(likedSongs[0], likedSongs)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Play All Liked Songs</span>
              </button>
            </div>
          )}

          {likedSongs.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900/30 rounded-2xl border border-neutral-800/60 p-8">
              <Heart className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-white">No liked songs yet</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Tap the heart icon on any track to save your favorite Rabha melodies here.
              </p>
            </div>
          ) : (
            <div className="bg-neutral-900/40 rounded-2xl border border-neutral-800/60 divide-y divide-neutral-800/40 overflow-hidden">
              {likedSongs.map((song, idx) => (
                <div
                  key={song.id}
                  className="group flex items-center justify-between p-3.5 hover:bg-neutral-900/80 transition-colors"
                >
                  <div
                    onClick={() => playSong(song, likedSongs)}
                    className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="w-5 text-center text-xs font-mono text-neutral-400 group-hover:text-emerald-400 font-semibold">
                      {idx + 1}
                    </span>
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400">
                        {song.title}
                      </p>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {song.artist} <span className="text-neutral-600">·</span> {song.album}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    <button
                      onClick={() => toggleLike(song.id)}
                      className="p-1 text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      <Heart className="w-4 h-4 fill-emerald-500" />
                    </button>
                    <span className="text-xs text-neutral-400 font-mono">
                      {formatDuration(song.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. LISTENING HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historySongs.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900/30 rounded-2xl border border-neutral-800/60 p-8">
              <Clock className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-white">No listening history yet</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Songs you stream will appear here in chronological order.
              </p>
            </div>
          ) : (
            <div className="bg-neutral-900/40 rounded-2xl border border-neutral-800/60 divide-y divide-neutral-800/40 overflow-hidden">
              {historySongs.map((song, idx) => (
                <div
                  key={'hist_list_' + song.id + idx}
                  className="group flex items-center justify-between p-3.5 hover:bg-neutral-900/80 transition-colors"
                >
                  <div
                    onClick={() => playSong(song, historySongs)}
                    className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="w-5 text-center text-xs font-mono text-neutral-400 group-hover:text-emerald-400">
                      {idx + 1}
                    </span>
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400">
                        {song.title}
                      </p>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-neutral-400 font-mono">
                      {formatDuration(song.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. ALBUMS */}
      {activeTab === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group p-3.5 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 cursor-pointer transition-all flex flex-col"
            >
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-full aspect-square rounded-xl object-cover mb-3"
                referrerPolicy="no-referrer"
              />
              <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-400">
                {album.title}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">{album.artist}</p>
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-2 font-mono">
                <span>{album.releaseYear}</span>
                <span aria-hidden="true">·</span>
                <span>{album.genre}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. ARTISTS */}
      {activeTab === 'artists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="group p-4 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 cursor-pointer transition-all flex flex-col items-center text-center"
            >
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-24 h-24 rounded-full object-cover mb-3 border border-neutral-800"
                referrerPolicy="no-referrer"
              />
              <h3 className="text-xs font-bold text-white truncate w-full group-hover:text-emerald-400">
                {artist.name}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate w-full mt-0.5">
                {artist.genres[0]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
