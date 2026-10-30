import React, { useState } from 'react';
import { X, Plus, Check, ListMusic } from 'lucide-react';
import { Playlist, Song } from '../../types/music';
import { api } from '../../services/api';

interface AddToPlaylistModalProps {
  songId: string | null;
  playlists: Playlist[];
  songs: Song[];
  onClose: () => void;
  onUpdatePlaylist: (updated: Playlist) => void;
  onCreateNewPlaylist: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  songId,
  playlists,
  songs,
  onClose,
  onUpdatePlaylist,
  onCreateNewPlaylist
}) => {
  const [successId, setSuccessId] = useState<string | null>(null);

  if (!songId) return null;

  const song = songs.find((s) => s.id === songId);

  const handleToggle = async (playlist: Playlist) => {
    const isAlreadyIn = playlist.songIds.includes(songId);
    const action = isAlreadyIn ? 'remove' : 'add';

    try {
      const updated = await api.toggleSongInPlaylist(playlist.id, songId, action);
      onUpdatePlaylist(updated);
      setSuccessId(playlist.id);
      setTimeout(() => setSuccessId(null), 1500);
    } catch (err) {
      console.error('Failed to update playlist', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Add to Playlist</h3>
          {song && (
            <p className="text-xs text-neutral-400 truncate">
              {song.title} · {song.artist}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            onClose();
            onCreateNewPlaylist();
          }}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-neutral-700 hover:border-emerald-500 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Create New Playlist</span>
        </button>

        <div className="space-y-1 max-h-60 overflow-y-auto">
          {playlists.map((pl) => {
            const isAdded = pl.songIds.includes(songId);
            return (
              <div
                key={pl.id}
                onClick={() => handleToggle(pl)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-900 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                    <ListMusic className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                    <p className="text-[10px] text-neutral-400">{pl.songIds.length} tracks</p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs transition-colors shrink-0 ${
                    isAdded
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'border-neutral-700 text-transparent hover:border-neutral-500'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
