import React, { useState } from 'react';
import { X, Plus, ListMusic } from 'lucide-react';
import { Playlist } from '../../types/music';
import { api } from '../../services/api';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (playlist: Playlist) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const pl = await api.createPlaylist({
        name: name.trim(),
        description: description.trim(),
        coverUrl: '/src/assets/images/album_rabha_echoes_1793373855412.jpg'
      });
      onCreated(pl);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to create playlist', err);
    } finally {
      setIsSubmitting(false);
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

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">New Playlist</h3>
            <p className="text-xs text-neutral-400">Curate your personal selection</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Playlist Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goalpara Flute Melodies"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give your playlist a story..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Playlist</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
