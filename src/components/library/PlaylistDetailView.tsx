import React, { useState } from 'react';
import { Play, Shuffle, Trash2, Edit3, X, Check, ArrowLeft, Plus } from 'lucide-react';
import { Playlist, Song } from '../../types/music';
import { useAudio } from '../../context/AudioContext';
import { api } from '../../services/api';
import { formatDuration } from '../../utils/format';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  allSongs: Song[];
  onBack: () => void;
  onUpdatePlaylist: (updated: Playlist) => void;
  onDeletePlaylist: (id: string) => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlist,
  allSongs,
  onBack,
  onUpdatePlaylist,
  onDeletePlaylist
}) => {
  const { playSong } = useAudio();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(playlist.name);
  const [editDesc, setEditDesc] = useState<string>(playlist.description || '');
  const [isAddSongOpen, setIsAddSongOpen] = useState<boolean>(false);

  // Retrieve full song objects for the IDs in this playlist
  const playlistSongs = playlist.songIds
    .map((id) => allSongs.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));

  const totalDuration = playlistSongs.reduce((acc, s) => acc + (s.duration || 0), 0);

  const handleSaveEdit = async () => {
    try {
      const updated = await api.updatePlaylist(playlist.id, {
        name: editName.trim(),
        description: editDesc.trim()
      });
      onUpdatePlaylist(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update playlist', err);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    try {
      const updated = await api.toggleSongInPlaylist(playlist.id, songId, 'remove');
      onUpdatePlaylist(updated);
    } catch (err) {
      console.error('Failed to remove song from playlist', err);
    }
  };

  const handleAddSong = async (songId: string) => {
    try {
      const updated = await api.toggleSongInPlaylist(playlist.id, songId, 'add');
      onUpdatePlaylist(updated);
    } catch (err) {
      console.error('Failed to add song to playlist', err);
    }
  };

  // Available songs to add
  const candidateSongs = allSongs.filter((s) => !playlist.songIds.includes(s.id));

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 pb-28">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Library</span>
      </button>

      {/* Playlist Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-neutral-900/40 p-6 rounded-3xl border border-neutral-800/60">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-neutral-800">
          <img
            src={playlist.coverUrl || '/src/assets/images/album_rabha_echoes_1793373855412.jpg'}
            alt={playlist.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
            PLAYLIST
          </span>

          {isEditing ? (
            <div className="space-y-3 mt-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full text-2xl font-bold bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                placeholder="Add an optional description"
                className="w-full text-xs bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-emerald-500 text-black rounded-lg"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-neutral-400 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 truncate">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="text-xs sm:text-sm text-neutral-400 mt-2 line-clamp-2">
                  {playlist.description}
                </p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-neutral-400 mt-3 font-mono">
                <span>{playlistSongs.length} songs</span>
                <span aria-hidden="true">·</span>
                <span>{formatDuration(totalDuration)} total</span>
              </div>
            </>
          )}

          {/* Action Row */}
          {!isEditing && (
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-5">
              {playlistSongs.length > 0 && (
                <button
                  onClick={() => playSong(playlistSongs[0], playlistSongs)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-transform transform active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Play All</span>
                </button>
              )}

              <button
                onClick={() => setIsAddSongOpen(!isAddSongOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tracks</span>
              </button>

              <button
                onClick={() => setIsEditing(true)}
                title="Edit Playlist Details"
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
                    onDeletePlaylist(playlist.id);
                  }
                }}
                title="Delete Playlist"
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Tracks drawer / section */}
      {isAddSongOpen && (
        <div className="p-4 bg-neutral-900/60 rounded-2xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white tracking-wider uppercase">
              Add Rabha Songs to this Playlist
            </h3>
            <button
              onClick={() => setIsAddSongOpen(false)}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {candidateSongs.length === 0 ? (
            <p className="text-xs text-neutral-400">All available songs are already in this playlist.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {candidateSongs.map((song) => (
                <div
                  key={'cand_' + song.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800/60 hover:border-neutral-700"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-8 h-8 rounded object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{song.artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddSong(song.id)}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-lg transition-colors shrink-0"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Songs Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-neutral-400 tracking-wider uppercase">
          TRACKLIST
        </h3>

        {playlistSongs.length === 0 ? (
          <div className="text-center py-12 bg-neutral-900/30 rounded-2xl border border-neutral-800/60 p-6">
            <p className="text-sm font-semibold text-white">This playlist has no tracks yet</p>
            <p className="text-xs text-neutral-400 mt-1">
              Click "Add Tracks" above or click the + icon on any song in the catalog.
            </p>
          </div>
        ) : (
          <div className="bg-neutral-900/40 rounded-2xl border border-neutral-800/60 divide-y divide-neutral-800/40 overflow-hidden">
            {playlistSongs.map((song, idx) => (
              <div
                key={song.id}
                className="group flex items-center justify-between p-3.5 hover:bg-neutral-900/80 transition-colors"
              >
                <div
                  onClick={() => playSong(song, playlistSongs)}
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                >
                  <span className="w-5 text-center text-xs font-mono text-neutral-400 group-hover:text-emerald-400 font-semibold">
                    {idx + 1}
                  </span>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
                  </div>
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
                  <span className="hidden sm:inline text-xs text-neutral-400 font-mono">
                    {song.genre}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {formatDuration(song.duration)}
                  </span>
                  <button
                    onClick={() => handleRemoveSong(song.id)}
                    title="Remove from playlist"
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
