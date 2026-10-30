import React, { useState } from 'react';
import {
  ChevronDown,
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
  Share2,
  ListMusic,
  FileText,
  RotateCw
} from 'lucide-react';
import { useAudio } from '../../context/AudioContext';
import { formatDuration } from '../../utils/format';

export const FullScreenPlayer: React.FC = () => {
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
    queue,
    queueIndex,
    isFullScreenPlayerOpen,
    setIsFullScreenPlayerOpen,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    playSong
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics' | 'queue'>('cover');
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  if (!isFullScreenPlayerOpen || !currentSong) return null;

  const isLiked = likedSongIds.has(currentSong.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Dynamic blurred background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-125 pointer-events-none"
        style={{ backgroundImage: `url(${currentSong.coverUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-neutral-950/90 to-neutral-950 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={() => setIsFullScreenPlayerOpen(false)}
          className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          title="Minimize Player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] font-semibold text-emerald-400 tracking-wider">
            PLAYING FROM RABHA TUNES
          </span>
          <span className="text-xs text-neutral-300 font-medium truncate max-w-xs">
            {currentSong.album}
          </span>
        </div>

        <button
          onClick={handleShare}
          className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors relative"
          title="Share Song Link"
        >
          <Share2 className="w-5 h-5" />
          {copyFeedback && (
            <span className="absolute -bottom-8 right-0 text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded font-semibold whitespace-nowrap">
              Copied!
            </span>
          )}
        </button>
      </header>

      {/* Center Viewport */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('cover')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'cover' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Artwork
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'lyrics' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'queue' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Up Next ({queue.length})</span>
          </button>
        </div>

        {/* Tab 1: Large Artwork Display */}
        {activeTab === 'cover' && (
          <div className="flex flex-col items-center text-center w-full max-w-sm sm:max-w-md">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-950/40 border border-white/10 mb-6">
              <img
                src={currentSong.coverUrl}
                alt={currentSong.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="w-full flex items-center justify-between px-2 mb-2">
              <div className="text-left min-w-0 pr-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {currentSong.title}
                </h1>
                <p className="text-sm text-neutral-400 truncate mt-0.5">
                  {currentSong.artist}
                </p>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                  <span>{currentSong.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentSong.language}</span>
                </div>
              </div>

              <button
                onClick={() => toggleLike(currentSong.id)}
                className="p-2 text-neutral-400 hover:text-emerald-400 transition-colors shrink-0"
              >
                <Heart
                  className={`w-6 h-6 ${
                    isLiked ? 'fill-emerald-500 text-emerald-500' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Lyrics View */}
        {activeTab === 'lyrics' && (
          <div className="w-full h-80 sm:h-96 overflow-y-auto px-4 py-6 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
            {currentSong.lyrics ? (
              <div className="space-y-4 text-center">
                {currentSong.lyrics.split('\n').map((line, idx) => (
                  <p
                    key={idx}
                    className="text-base sm:text-lg font-medium text-neutral-300 hover:text-emerald-400 transition-colors select-text"
                  >
                    {line.replace(/^\[\d{2}:\d{2}\.\d{2}\]\s*/, '')}
                  </p>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-sm">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p>Lyrics are not available for this track yet.</p>
                <p className="text-xs text-neutral-400 mt-1">Administrator can add lyrics via Admin Studio.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Fullscreen Queue View */}
        {activeTab === 'queue' && (
          <div className="w-full h-80 sm:h-96 overflow-y-auto bg-black/40 rounded-2xl border border-white/5 p-4 divide-y divide-white/5">
            <h3 className="text-xs font-semibold text-neutral-400 tracking-wider mb-2">
              PLAYING QUEUE
            </h3>
            {queue.map((song, idx) => (
              <div
                key={song.id + idx}
                onClick={() => playSong(song)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${
                  idx === queueIndex ? 'bg-emerald-500/10 border border-emerald-500/20' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-xs text-neutral-400 font-mono">
                    {idx + 1}
                  </span>
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-9 h-9 rounded object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        idx === queueIndex ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {song.title}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">{song.artist}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {formatDuration(song.duration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Controls */}
      <footer className="relative z-10 px-6 py-6 max-w-2xl mx-auto w-full">
        {/* Scrubber */}
        <div className="w-full flex items-center gap-3 text-xs text-neutral-400 font-mono tabular-nums mb-4">
          <span>{formatDuration(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime || 0}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer focus:outline-none"
            style={{
              background: `linear-gradient(to right, #10b981 ${progressPercent}%, #262626 ${progressPercent}%)`
            }}
          />
          <span>{formatDuration(duration)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors ${
              isShuffle ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={prevTrack}
            className="p-2 text-white hover:text-emerald-400 transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isBuffering}
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition-all transform active:scale-95 shadow-xl shadow-emerald-500/25"
          >
            {isBuffering ? (
              <RotateCw className="w-6 h-6 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black translate-x-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-2 text-white hover:text-emerald-400 transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-2 transition-colors ${
              repeatMode !== 'off' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-center gap-3 text-neutral-400">
          <button onClick={toggleMute} className="p-1 hover:text-white">
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
            className="w-36 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer focus:outline-none"
            style={{
              background: `linear-gradient(to right, #10b981 ${(isMuted ? 0 : volume) * 100}%, #262626 ${(isMuted ? 0 : volume) * 100}%)`
            }}
          />
        </div>
      </footer>
    </div>
  );
};
