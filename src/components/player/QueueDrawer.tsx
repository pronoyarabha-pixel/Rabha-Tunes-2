import React from 'react';
import { X, Trash2, Music, Play } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';
import { formatDuration } from '../../utils/format';

export const QueueDrawer: React.FC = () => {
  const {
    currentSong,
    queue,
    queueIndex,
    isQueueOpen,
    setIsQueueOpen,
    playSong,
    removeFromQueue,
    clearQueue
  } = useAudio();

  if (!isQueueOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 sm:w-96 bg-neutral-950/95 backdrop-blur-xl border-l border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Play Queue</h2>
          <span className="text-xs text-neutral-400 font-mono">({queue.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              title="Clear Queue"
              className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-900 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsQueueOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Now Playing */}
        {currentSong && (
          <div>
            <h3 className="text-xs font-semibold text-emerald-400 tracking-wider mb-2">
              NOW PLAYING
            </h3>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <img
                src={currentSong.coverUrl}
                alt={currentSong.title}
                className="w-11 h-11 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {currentSong.title}
                </p>
                <p className="text-xs text-neutral-400 truncate">{currentSong.artist}</p>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {formatDuration(currentSong.duration)}
              </span>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 tracking-wider mb-2">
            NEXT IN QUEUE
          </h3>
          {queue.length <= 1 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              <p>Queue is empty.</p>
              <p className="text-neutral-400 mt-1">Play songs from albums or discovery to fill up the queue.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {queue.map((song, idx) => {
                if (idx === queueIndex) return null; // Already shown in Now Playing
                return (
                  <div
                    key={song.id + idx}
                    className="group flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/60 transition-colors"
                  >
                    <div
                      onClick={() => playSong(song)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-medium text-white truncate group-hover:text-emerald-400">
                          {song.title}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {formatDuration(song.duration)}
                      </span>
                      <button
                        onClick={() => removeFromQueue(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 transition-opacity"
                        title="Remove from queue"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
