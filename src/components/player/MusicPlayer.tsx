import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Maximize2,
  RotateCw
} from 'lucide-react';
import { useAudio } from '../../context/AudioContext';
import { formatDuration } from '../../utils/format';

interface MusicPlayerProps {
  onOpenPlaylistModal?: (songId: string) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ onOpenPlaylistModal }) => {
  const {
    currentSong,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    likedSongIds,
    isQueueOpen,
    errorMessage,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    setIsFullScreenPlayerOpen,
    setIsQueueOpen,
    retryPlayback
  } = useAudio();

  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-[76px] bg-neutral-950/95 border-t border-neutral-800/80 px-6 flex items-center justify-between text-neutral-400 z-40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
            <ListMusic className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="text-neutral-400 font-medium">Select any Rabha folk track to begin streaming</p>
            <p className="text-neutral-400 text-[11px]">Free, unlimited cloud audio streaming</p>
          </div>
        </div>
      </div>
    );
  }

  const isLiked = likedSongIds.has(currentSong.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[76px] bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/80 px-4 md:px-6 z-40 flex items-center justify-between gap-4">
      {/* Left: Track Information & Like */}
      <div className="flex items-center gap-3 min-w-0 max-w-[30%] md:max-w-[280px]">
        <div
          onClick={() => setIsFullScreenPlayerOpen(true)}
          className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer group shadow-md shadow-black/40 border border-neutral-800"
        >
          <img
            src={currentSong.coverUrl}
            alt={currentSong.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="min-w-0 flex flex-col">
          <button
            onClick={() => setIsFullScreenPlayerOpen(true)}
            className="text-left text-sm font-semibold text-white truncate hover:underline hover:text-emerald-400 transition-colors"
          >
            {currentSong.title}
          </button>
          <p className="text-xs text-neutral-400 truncate">
            {currentSong.artist}
          </p>
        </div>

        <button
          onClick={() => toggleLike(currentSong.id)}
          title={isLiked ? 'Unlike' : 'Like'}
          className="p-1.5 text-neutral-400 hover:text-emerald-400 transition-colors shrink-0"
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isLiked ? 'fill-emerald-500 text-emerald-500' : ''
            }`}
          />
        </button>
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
        {/* Playback action buttons */}
        <div className="flex items-center gap-4 md:gap-5">
          <button
            onClick={toggleShuffle}
            title={isShuffle ? 'Shuffle is On' : 'Shuffle is Off'}
            className={`p-1 transition-colors ${
              isShuffle ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={prevTrack}
            title="Previous Song"
            className="p-1 text-neutral-300 hover:text-white transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            disabled={isBuffering}
            className="w-9 h-9 rounded-full bg-white text-black hover:bg-emerald-400 flex items-center justify-center transition-all transform active:scale-95 shadow-md shadow-white/10"
          >
            {isBuffering ? (
              <RotateCw className="w-4 h-4 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black translate-x-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            title="Next Song"
            className="p-1 text-neutral-300 hover:text-white transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={cycleRepeat}
            title={`Repeat mode: ${repeatMode}`}
            className={`p-1 transition-colors ${
              repeatMode !== 'off' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Seek Bar with Time Stamps */}
        <div className="w-full flex items-center gap-2.5 text-[11px] text-neutral-400 font-mono tabular-nums">
          <span className="w-8 text-right">{formatDuration(currentTime)}</span>
          <div className="relative flex-1 flex items-center group py-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime || 0}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all focus:outline-none"
              style={{
                background: `linear-gradient(to right, #10b981 ${progressPercent}%, #262626 ${progressPercent}%)`
              }}
            />
          </div>
          <span className="w-8 text-left">{formatDuration(duration)}</span>
        </div>

        {/* Transient error/notice banner if stream delays */}
        {errorMessage && (
          <div className="text-[11px] text-amber-400 flex items-center gap-2">
            <span>{errorMessage}</span>
            <button
              onClick={retryPlayback}
              className="underline text-emerald-400 font-semibold"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Right: Volume, Queue & Fullscreen Trigger */}
      <div className="flex items-center gap-3 min-w-0 max-w-[25%] md:max-w-[220px] justify-end">
        {onOpenPlaylistModal && (
          <button
            onClick={() => onOpenPlaylistModal(currentSong.id)}
            title="Add to Playlist"
            className="hidden lg:block p-1.5 text-neutral-400 hover:text-white transition-colors"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          title="Play Queue"
          className={`p-1.5 transition-colors ${
            isQueueOpen ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 md:w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer focus:outline-none"
            style={{
              background: `linear-gradient(to right, #10b981 ${(isMuted ? 0 : volume) * 100}%, #262626 ${(isMuted ? 0 : volume) * 100}%)`
            }}
          />
        </div>

        <button
          onClick={() => setIsFullScreenPlayerOpen(true)}
          title="Full Screen Player"
          className="p-1.5 text-neutral-400 hover:text-white transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
