import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Song, RepeatMode } from '../types/music';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  queueIndex: number;
  likedSongIds: Set<string>;
  isFullScreenPlayerOpen: boolean;
  isQueueOpen: boolean;
  errorMessage: string | null;

  // Actions
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  seekTo: (timeInSeconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleLike: (songId: string) => Promise<void>;
  setIsFullScreenPlayerOpen: (open: boolean) => void;
  setIsQueueOpen: (open: boolean) => void;
  retryPlayback: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('rabha_volume');
    return saved !== null ? parseFloat(saved) : 0.85;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
      setIsBuffering(false);
    };
    const onError = (e: Event) => {
      console.warn('Audio streaming notice:', e);
      setIsBuffering(false);
      setIsPlaying(false);
      setErrorMessage('Audio stream loading... Tap retry if connection is slow.');
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // Fetch initial liked songs
  useEffect(() => {
    async function loadLikes() {
      try {
        const liked = await api.getLikedSongIds(user?.id || 'guest');
        setLikedSongIds(new Set(liked));
      } catch {
        // ignore
      }
    }
    loadLikes();
  }, [user]);

  // Handle track ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
      } else {
        nextTrack();
      }
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [queue, queueIndex, repeatMode, isShuffle]);

  const playSong = useCallback((song: Song, newQueue?: Song[]) => {
    setErrorMessage(null);
    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(song.duration || 0);

    let activeQueue = queue;
    let newIndex = 0;

    if (newQueue && newQueue.length > 0) {
      activeQueue = newQueue;
      setQueue(newQueue);
      newIndex = newQueue.findIndex((s) => s.id === song.id);
      setQueueIndex(newIndex >= 0 ? newIndex : 0);
    } else if (!queue.some((s) => s.id === song.id)) {
      activeQueue = [song, ...queue];
      setQueue(activeQueue);
      setQueueIndex(0);
    } else {
      newIndex = queue.findIndex((s) => s.id === song.id);
      setQueueIndex(newIndex);
    }

    if (audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.currentTime = 0;
      setIsBuffering(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
          // Record history in backend
          api.recordHistory(song.id, user?.id || 'guest');
        })
        .catch((err) => {
          console.warn('Autoplay prevented or network error:', err);
          setIsPlaying(false);
          setIsBuffering(false);
        });
    }
  }, [queue, user]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (!currentSong && queue.length > 0) {
        playSong(queue[0]);
      } else if (audio.src) {
        setErrorMessage(null);
        audio.play().catch((err) => {
          console.warn('Playback error:', err);
          setErrorMessage('Tap play to start audio stream.');
        });
      }
    }
  }, [isPlaying, currentSong, queue, playSong]);

  const seekTo = useCallback((timeInSeconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
    }
  }, []);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (isShuffle && queue.length > 1) {
      let randomIndex = queueIndex;
      while (randomIndex === queueIndex) {
        randomIndex = Math.floor(Math.random() * queue.length);
      }
      setQueueIndex(randomIndex);
      playSong(queue[randomIndex]);
      return;
    }

    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      setQueueIndex(nextIdx);
      playSong(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      playSong(queue[0]);
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex, isShuffle, repeatMode, playSong]);

  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;
    const prevIdx = queueIndex - 1;
    if (prevIdx >= 0) {
      setQueueIndex(prevIdx);
      playSong(queue[prevIdx]);
    } else if (repeatMode === 'all') {
      const lastIdx = queue.length - 1;
      setQueueIndex(lastIdx);
      playSong(queue[lastIdx]);
    }
  }, [queue, queueIndex, repeatMode, playSong]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    localStorage.setItem('rabha_volume', clamped.toString());
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      if (clamped > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      audioRef.current.muted = nextMuted;
    }
  }, [isMuted]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => [...prev, song]);
    if (!currentSong) {
      playSong(song);
    }
  }, [currentSong, playSong]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  }, [queueIndex]);

  const clearQueue = useCallback(() => {
    setQueue(currentSong ? [currentSong] : []);
    setQueueIndex(currentSong ? 0 : -1);
  }, [currentSong]);

  const toggleLike = useCallback(async (songId: string) => {
    const userId = user?.id || 'guest';
    try {
      const { liked } = await api.toggleLike(songId, userId);
      setLikedSongIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(songId);
        else next.delete(songId);
        return next;
      });
      // Also update currently playing song likes count if matching
      if (currentSong && currentSong.id === songId) {
        setCurrentSong((prev) =>
          prev ? { ...prev, likesCount: prev.likesCount + (liked ? 1 : -1) } : null
        );
      }
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  }, [user, currentSong]);

  const retryPlayback = useCallback(() => {
    if (currentSong && audioRef.current) {
      setErrorMessage(null);
      audioRef.current.src = currentSong.audioUrl + `?retry=${Date.now()}`;
      audioRef.current.play().catch(console.warn);
    }
  }, [currentSong]);

  // Keyboard shortcut controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        nextTrack();
      } else if (e.code === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        prevTrack();
      } else if (e.code === 'KeyM') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextTrack, prevTrack, toggleMute]);

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        isPlaying,
        isBuffering,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        queue,
        queueIndex,
        likedSongIds,
        isFullScreenPlayerOpen,
        isQueueOpen,
        errorMessage,
        playSong,
        togglePlay,
        seekTo,
        nextTrack,
        prevTrack,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleLike,
        setIsFullScreenPlayerOpen,
        setIsQueueOpen,
        retryPlayback
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
}
