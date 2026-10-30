import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Upload,
  Files,
  Music,
  Calendar,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Clock,
  Radio,
  FileAudio,
  Image as ImageIcon,
  HardDrive,
  RefreshCw,
  Search,
  Eye,
  Play,
  Star
} from 'lucide-react';
import { Song, AdminStats } from '../../types/music';
import { api } from '../../services/api';
import { formatDuration, formatDateTime, formatBytes } from '../../utils/format';
import { useAudio } from '../../context/AudioContext';

const GENRES = [
  'Rabha Traditional',
  'Rabha Folk Fusion',
  'Traditional Flute',
  'Festive Tribal Beats',
  'Serene Ambient Folk',
  'Acoustic Tribal',
  'Bodo-Rabha Melodies',
  'Goalparia Folk'
];

const LANGUAGES = [
  'Rabha',
  'Rabha (Rongdani)',
  'Rabha (Pati)',
  'Rabha (Maitori)',
  'Assamese',
  'Instrumental'
];

interface AdminDashboardProps {
  onSongUpdated?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSongUpdated }) => {
  const { playSong } = useAudio();

  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'batch' | 'catalog' | 'scheduled'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [adminSongs, setAdminSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Rongmon Rabha');
  const [album, setAlbum] = useState('Rabha Heritage Sessions');
  const [genre, setGenre] = useState(GENRES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreset, setCoverPreset] = useState<string>('/src/assets/images/album_rabha_echoes_1793373855412.jpg');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Batch Upload State
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchArtist, setBatchArtist] = useState('Rongmon Rabha');
  const [batchAlbum, setBatchAlbum] = useState('Rabha Heritage Collection');
  const [batchGenre, setBatchGenre] = useState(GENRES[1]);
  const [batchLanguage, setBatchLanguage] = useState(LANGUAGES[0]);
  const [batchPublishNow, setBatchPublishNow] = useState(true);
  const [batchProgress, setBatchProgress] = useState<number | null>(null);

  // Catalog Filter & Search State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState<'all' | 'published' | 'featured' | 'scheduled' | 'draft'>('all');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [replacingAudioSongId, setReplacingAudioSongId] = useState<string | null>(null);
  const [replacingCoverSongId, setReplacingCoverSongId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const replaceAudioInputRef = useRef<HTMLInputElement>(null);
  const replaceCoverInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sData, songsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminSongs()
      ]);
      setStats(sData);
      setAdminSongs(songsData);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load admin data' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearUploadForm = () => {
    setTitle('');
    setDescription('');
    setLyrics('');
    setAudioFile(null);
    setCoverFile(null);
    setIsFeatured(false);
    setIsScheduled(false);
    setScheduledDateTime('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  // Handle Single Song Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      setStatusMessage({ type: 'error', text: 'Song title and artist are required' });
      return;
    }
    if (!audioFile) {
      setStatusMessage({ type: 'error', text: 'Please select an audio file (MP3, WAV, or AAC)' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('artist', artist.trim());
      formData.append('album', album.trim());
      formData.append('genre', genre);
      formData.append('language', language);
      formData.append('description', description.trim());
      formData.append('releaseDate', releaseDate);
      formData.append('lyrics', lyrics.trim());
      formData.append('isFeatured', String(isFeatured));
      formData.append('isPublished', 'true');

      // Schedule logic
      if (isScheduled && scheduledDateTime) {
        formData.append('publicationDate', new Date(scheduledDateTime).toISOString());
      } else {
        formData.append('publicationDate', new Date().toISOString());
      }

      formData.append('audio', audioFile);

      if (coverFile) {
        formData.append('cover', coverFile);
      } else {
        formData.append('coverUrl', coverPreset);
      }

      const newSong = await api.uploadSong(formData);
      setStatusMessage({
        type: 'success',
        text: `Song "${newSong.title}" uploaded and ${isScheduled ? 'scheduled' : 'published'} successfully!`
      });
      clearUploadForm();
      await loadData();
      setActiveTab('catalog');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload song' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Batch Upload
  const handleBatchUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchFiles.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select one or more audio files for batch upload' });
      return;
    }

    setIsSubmitting(true);
    setBatchProgress(10);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('defaultArtist', batchArtist);
      formData.append('defaultAlbum', batchAlbum);
      formData.append('defaultGenre', batchGenre);
      formData.append('defaultLanguage', batchLanguage);
      formData.append('publishNow', String(batchPublishNow));

      for (const f of batchFiles) {
        formData.append('audioFiles', f);
      }

      setBatchProgress(50);
      const res = await api.batchUpload(formData);
      setBatchProgress(100);

      setStatusMessage({
        type: 'success',
        text: `Batch upload complete! Successfully added ${res.uploadedCount} tracks to the catalog.`
      });
      setBatchFiles([]);
      if (batchInputRef.current) batchInputRef.current.value = '';
      await loadData();
      setActiveTab('catalog');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Batch upload failed' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setBatchProgress(null), 1000);
    }
  };

  // Catalog Actions
  const handleTogglePublish = async (song: Song) => {
    try {
      const updated = await api.togglePublish(song.id, !song.isPublished);
      setAdminSongs((prev) => prev.map((s) => (s.id === song.id ? updated : s)));
      onSongUpdated?.();
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update publication status' });
    }
  };

  const handleToggleFeatured = async (song: Song) => {
    try {
      const updated = await api.toggleFeatured(song.id, !song.isFeatured);
      setAdminSongs((prev) => prev.map((s) => (s.id === song.id ? updated : s)));
      setStatusMessage({
        type: 'success',
        text: `"${song.title}" is now ${updated.isFeatured ? 'marked as Featured on Home' : 'removed from Featured'}.`
      });
      onSongUpdated?.();
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to toggle featured status' });
    }
  };

  const handleInstantPublish = async (song: Song) => {
    try {
      const updated = await api.togglePublish(song.id, true, new Date().toISOString());
      setAdminSongs((prev) => prev.map((s) => (s.id === song.id ? updated : s)));
      setStatusMessage({ type: 'success', text: `"${song.title}" is now published immediately!` });
      onSongUpdated?.();
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to publish song' });
    }
  };

  const handleDeleteSong = async (id: string, songTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${songTitle}"? This will permanently remove the audio file.`)) {
      return;
    }
    try {
      await api.deleteSong(id);
      setAdminSongs((prev) => prev.filter((s) => s.id !== id));
      setStatusMessage({ type: 'success', text: `Deleted "${songTitle}"` });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete song' });
    }
  };

  const handleReplaceAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingAudioSongId) return;

    try {
      const updated = await api.replaceSongAudio(replacingAudioSongId, file);
      setAdminSongs((prev) => prev.map((s) => (s.id === replacingAudioSongId ? updated : s)));
      setStatusMessage({ type: 'success', text: 'Audio file replaced successfully' });
      setReplacingAudioSongId(null);
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to replace audio' });
    }
  };

  const handleReplaceCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingCoverSongId) return;

    try {
      const updated = await api.replaceSongCover(replacingCoverSongId, file);
      setAdminSongs((prev) => prev.map((s) => (s.id === replacingCoverSongId ? updated : s)));
      setStatusMessage({ type: 'success', text: 'Album cover replaced successfully' });
      setReplacingCoverSongId(null);
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to replace cover' });
    }
  };

  const handleSaveEditModal = async () => {
    if (!editingSong) return;
    try {
      const updated = await api.updateSong(editingSong.id, editingSong);
      setAdminSongs((prev) => prev.map((s) => (s.id === editingSong.id ? updated : s)));
      setStatusMessage({ type: 'success', text: `Updated metadata for "${updated.title}"` });
      setEditingSong(null);
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update song' });
    }
  };

  // Filter catalog list
  const now = new Date();
  const filteredCatalog = adminSongs.filter((song) => {
    const isSongScheduled = song.isPublished && new Date(song.publicationDate) > now;
    const isSongPublished = song.isPublished && new Date(song.publicationDate) <= now;
    const isSongDraft = !song.isPublished;

    if (catalogStatusFilter === 'published' && !isSongPublished) return false;
    if (catalogStatusFilter === 'featured' && !song.isFeatured) return false;
    if (catalogStatusFilter === 'scheduled' && !isSongScheduled) return false;
    if (catalogStatusFilter === 'draft' && !isSongDraft) return false;

    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      return (
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        song.album.toLowerCase().includes(q) ||
        song.genre.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const scheduledSongs = adminSongs.filter(
    (s) => s.isPublished && new Date(s.publicationDate) > now
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 pb-32">
      {/* Hidden file inputs for replace operations */}
      <input
        type="file"
        ref={replaceAudioInputRef}
        onChange={handleReplaceAudio}
        accept="audio/*"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceCoverInputRef}
        onChange={handleReplaceCover}
        accept="image/*"
        className="hidden"
      />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Studio</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Upload, schedule, and manage high-fidelity Rabha folk audio and metadata.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'bg-emerald-500 text-black font-bold'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          Overview & Stats
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'upload'
              ? 'bg-emerald-500 text-black font-bold'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Song</span>
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'batch'
              ? 'bg-emerald-500 text-black font-bold'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          <Files className="w-3.5 h-3.5" />
          <span>Batch Upload</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'catalog'
              ? 'bg-emerald-500 text-black font-bold'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Manage Songs ({adminSongs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'scheduled'
              ? 'bg-emerald-500 text-black font-bold'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Scheduled Releases ({scheduledSongs.length})</span>
        </button>
      </div>

      {/* ---------------- TAB 1: OVERVIEW & STATS ---------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Songs</span>
                <Music className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-3 font-mono">
                {stats?.totalSongs || adminSongs.length}
              </p>
              <span className="text-[11px] text-neutral-400 mt-1">Uploaded in library</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Live Published</span>
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-3 font-mono">
                {stats?.publishedSongs || 0}
              </p>
              <span className="text-[11px] text-emerald-400 mt-1">Publicly streamable</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Featured</span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400 mt-3 font-mono">
                {adminSongs.filter((s) => s.isFeatured).length}
              </p>
              <span className="text-[11px] text-amber-400/80 mt-1">Spotlighted on Home</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Scheduled</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-3 font-mono">
                {stats?.scheduledSongs || scheduledSongs.length}
              </p>
              <span className="text-[11px] text-amber-400 mt-1">Upcoming releases</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Audio Storage</span>
                <HardDrive className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-3 font-mono">
                {formatBytes(stats?.storageUsedBytes || 0)}
              </p>
              <span className="text-[11px] text-neutral-400 mt-1">Local cloud audio</span>
            </div>
          </div>

          {/* Quick Actions & Policy Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">
                Publishing Quick Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 transition-colors text-left"
                >
                  <div>
                    <p className="text-xs font-bold text-white">Upload Single Song</p>
                    <p className="text-[11px] text-neutral-400">Add metadata, audio file, cover art, and lyrics</p>
                  </div>
                  <Upload className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => setActiveTab('batch')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 transition-colors text-left"
                >
                  <div>
                    <p className="text-xs font-bold text-white">Batch Upload Multiple Tracks</p>
                    <p className="text-[11px] text-neutral-400">Bulk upload an album or series of folk recordings</p>
                  </div>
                  <Files className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => setActiveTab('scheduled')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 transition-colors text-left"
                >
                  <div>
                    <p className="text-xs font-bold text-white">View Scheduled Pipeline</p>
                    <p className="text-[11px] text-neutral-400">Manage releases queued for automatic future publishing</p>
                  </div>
                  <Calendar className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">
                Music Rights & Storage Notice
              </h2>
              <div className="text-xs text-neutral-400 space-y-2">
                <p>
                  <strong className="text-neutral-200">Copyright Compliance:</strong> All music uploaded must be indigenous Rabha folk recordings owned, licensed, or authorized by you or the artist. Scraped or pirated audio is strictly prohibited.
                </p>
                <p>
                  <strong className="text-neutral-200">Streaming Delivery:</strong> Audio is delivered via HTTP Range partial content (206) with chunked byte-range requests for seamless seeking and low latency on mobile networks.
                </p>
                <p>
                  <strong className="text-neutral-200">Bandwidth & Hosting:</strong> Free unlimited playback is supported with server-side caching. Audio files are stored separately from public administrative folders to prevent direct leeching.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: UPLOAD SONG FORM ---------------- */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadSubmit} className="max-w-3xl space-y-6 bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800">
          <div className="border-b border-neutral-800 pb-4">
            <h2 className="text-base font-bold text-white">Upload New Rabha Track</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Provide track metadata, select audio file, and set immediate or scheduled publication.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Song Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Breeze of Goalpara"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Artist */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Artist Name *
              </label>
              <input
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g., Rongmon Rabha"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Album */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Album Name
              </label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="e.g., Echoes of Dudhnoi"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Release Date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Release Date
              </label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Song Description / Liner Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Background story about this traditional melody, cultural context, instruments used..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Audio File Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Audio File (MP3, WAV, AAC, up to 100MB) *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                required
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
              />
              {audioFile && (
                <span className="text-xs text-emerald-400 font-mono">
                  {formatBytes(audioFile.size)}
                </span>
              )}
            </div>
          </div>

          {/* Album Cover Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-300">
              Album Artwork
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
              />
            </div>
            {!coverFile && (
              <div className="pt-2">
                <span className="text-[11px] text-neutral-400 block mb-1">
                  Or select a curated Rabha album cover preset:
                </span>
                <div className="flex items-center gap-3">
                  {[
                    '/src/assets/images/album_rabha_echoes_1793373855412.jpg',
                    '/src/assets/images/album_goalpara_breeze_1793373856591.jpg',
                    '/src/assets/images/album_hacha_rhythms_1793373857213.jpg'
                  ].map((presetUrl) => (
                    <img
                      key={presetUrl}
                      src={presetUrl}
                      alt="Preset"
                      onClick={() => setCoverPreset(presetUrl)}
                      className={`w-12 h-12 rounded-lg object-cover cursor-pointer border-2 transition-all ${
                        coverPreset === presetUrl ? 'border-emerald-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Publication Date / Schedule */}
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Publication Mode</p>
                <p className="text-[11px] text-neutral-400">
                  {isScheduled
                    ? 'Song will become available automatically at the scheduled time'
                    : 'Song will go live on the public feed immediately upon saving'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduled(false)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    !isScheduled ? 'bg-emerald-500 text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Publish Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsScheduled(true)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    isScheduled ? 'bg-emerald-500 text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Schedule Later
                </button>
              </div>
            </div>

            {isScheduled && (
              <div className="pt-2 border-t border-neutral-800">
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Scheduled Publication Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required={isScheduled}
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Optional Lyrics */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Optional Lyrics / Chants
            </label>
            <textarea
              rows={3}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Paste synchronized lyrics [00:15.00] or verses..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Featured Song Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featuredToggle"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <label htmlFor="featuredToggle" className="text-xs font-medium text-neutral-300 cursor-pointer">
              Mark as Featured Track (Displays in prominent Home spotlight banner)
            </label>
          </div>

          {/* Submit button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-transform transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Upload...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{isScheduled ? 'Schedule Release' : 'Publish Song Immediately'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={clearUploadForm}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
            >
              Clear Form
            </button>
          </div>
        </form>
      )}

      {/* ---------------- TAB 3: BATCH UPLOAD ---------------- */}
      {activeTab === 'batch' && (
        <form onSubmit={handleBatchUploadSubmit} className="max-w-3xl space-y-6 bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800">
          <div className="border-b border-neutral-800 pb-4">
            <h2 className="text-base font-bold text-white">Batch Upload Multiple Songs</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Select up to 20 audio files at once. Titles are automatically derived from file names.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Default Artist Name
              </label>
              <input
                type="text"
                value={batchArtist}
                onChange={(e) => setBatchArtist(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Default Album Name
              </label>
              <input
                type="text"
                value={batchAlbum}
                onChange={(e) => setBatchAlbum(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Default Genre
              </label>
              <select
                value={batchGenre}
                onChange={(e) => setBatchGenre(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Default Language
              </label>
              <select
                value={batchLanguage}
                onChange={(e) => setBatchLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Select Multiple Audio Files (MP3, WAV, AAC) *
            </label>
            <input
              type="file"
              ref={batchInputRef}
              multiple
              required
              accept="audio/*"
              onChange={(e) => setBatchFiles(Array.from(e.target.files || []))}
              className="text-xs text-neutral-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
            />
          </div>

          {batchFiles.length > 0 && (
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 max-h-40 overflow-y-auto space-y-1">
              <span className="text-xs font-bold text-white block mb-1">
                Selected Tracks ({batchFiles.length}):
              </span>
              {batchFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="truncate pr-2">{i + 1}. {f.name}</span>
                  <span className="font-mono text-[11px] shrink-0">{formatBytes(f.size)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="batchPublishToggle"
              checked={batchPublishNow}
              onChange={(e) => setBatchPublishNow(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <label htmlFor="batchPublishToggle" className="text-xs font-medium text-neutral-300 cursor-pointer">
              Publish all tracks immediately upon upload
            </label>
          </div>

          {batchProgress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Uploading batch...</span>
                <span>{batchProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || batchFiles.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-transform transform active:scale-95 disabled:opacity-50"
          >
            <Files className="w-4 h-4" />
            <span>Upload {batchFiles.length} Tracks in Batch</span>
          </button>
        </form>
      )}

      {/* ---------------- TAB 4: MANAGE SONG CATALOG ---------------- */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Filter by title, artist, or album..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
              {(['all', 'published', 'featured', 'scheduled', 'draft'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCatalogStatusFilter(mode)}
                  className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors ${
                    catalogStatusFilter === mode
                      ? 'bg-neutral-800 text-white font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-neutral-900/40 rounded-2xl border border-neutral-800 overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Track Details</th>
                  <th className="py-3 px-4">Album & Genre</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Publication Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {filteredCatalog.map((song) => {
                  const isScheduledRelease = song.isPublished && new Date(song.publicationDate) > now;
                  const isLive = song.isPublished && new Date(song.publicationDate) <= now;

                  return (
                    <tr key={song.id} className="hover:bg-neutral-900/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-white truncate max-w-xs">{song.title}</p>
                              {song.isFeatured && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate">{song.artist}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="text-white truncate max-w-xs">{song.album}</p>
                        <p className="text-[11px] text-neutral-400">{song.genre}</p>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {formatDuration(song.duration)}
                      </td>

                      <td className="py-3 px-4">
                        {isLive && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Live
                          </span>
                        )}
                        {isScheduledRelease && (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Scheduled
                          </span>
                        )}
                        {!song.isPublished && (
                          <span className="text-neutral-400 font-semibold flex items-center gap-1">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                        {formatDateTime(song.publicationDate)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Star / Featured Toggle */}
                          <button
                            onClick={() => handleToggleFeatured(song)}
                            title={song.isFeatured ? 'Remove from Featured on Home' : 'Mark as Featured on Home'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              song.isFeatured
                                ? 'text-amber-400 bg-amber-400/15 border border-amber-400/30 hover:bg-amber-400/25'
                                : 'text-neutral-500 hover:text-amber-400 hover:bg-neutral-800'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${song.isFeatured ? 'fill-amber-400' : ''}`} />
                          </button>

                          {/* Play preview */}
                          <button
                            onClick={() => playSong(song)}
                            title="Preview Stream"
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Publish / Unpublish Toggle */}
                          <button
                            onClick={() => handleTogglePublish(song)}
                            title={song.isPublished ? 'Unpublish (hide from public)' : 'Publish'}
                            className={`px-2 py-1 text-[11px] rounded-md transition-colors ${
                              song.isPublished
                                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-semibold'
                            }`}
                          >
                            {song.isPublished ? 'Unpublish' : 'Publish'}
                          </button>

                          {/* Replace Audio */}
                          <button
                            onClick={() => {
                              setReplacingAudioSongId(song.id);
                              replaceAudioInputRef.current?.click();
                            }}
                            title="Replace Audio File"
                            className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg"
                          >
                            <FileAudio className="w-3.5 h-3.5" />
                          </button>

                          {/* Replace Cover */}
                          <button
                            onClick={() => {
                              setReplacingCoverSongId(song.id);
                              replaceCoverInputRef.current?.click();
                            }}
                            title="Replace Album Cover"
                            className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingSong(song)}
                            title="Edit Details"
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteSong(song.id, song.title)}
                            title="Delete Song"
                            className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- TAB 5: SCHEDULED RELEASES ---------------- */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <div className="p-4 bg-neutral-900/40 rounded-2xl border border-neutral-800">
            <h2 className="text-sm font-bold text-white tracking-wider uppercase mb-1">
              Automatic Scheduled Releases
            </h2>
            <p className="text-xs text-neutral-400">
              These tracks are uploaded and configured to go live automatically when their publication time arrives. Public visitors cannot stream or discover them until released.
            </p>
          </div>

          {scheduledSongs.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/20 rounded-2xl border border-neutral-800 p-6">
              <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No future releases scheduled</p>
              <p className="text-xs text-neutral-400 mt-1">
                When uploading a song, choose "Schedule Later" to queue it for a future date and time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledSongs.map((song) => {
                const pubDate = new Date(song.publicationDate);
                const diffMs = pubDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffMs / 86400000);

                return (
                  <div
                    key={song.id}
                    className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Release in ~{diffDays} days</span>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate mt-1">{song.title}</h3>
                        <p className="text-xs text-neutral-400 truncate">{song.artist} · {song.album}</p>
                        <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                          Goes live: {formatDateTime(song.publicationDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
                      <button
                        onClick={() => playSong(song)}
                        className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Preview Audio</span>
                      </button>

                      <button
                        onClick={() => handleInstantPublish(song)}
                        className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-colors"
                      >
                        Publish Now (Override)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingSong && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Edit Song Metadata</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={editingSong.title}
                  onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Artist</label>
                <input
                  type="text"
                  value={editingSong.artist}
                  onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Album</label>
                <input
                  type="text"
                  value={editingSong.album}
                  onChange={(e) => setEditingSong({ ...editingSong, album: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Genre</label>
                  <select
                    value={editingSong.genre}
                    onChange={(e) => setEditingSong({ ...editingSong, genre: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Language</label>
                  <select
                    value={editingSong.language}
                    onChange={(e) => setEditingSong({ ...editingSong, language: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editFeatured"
                  checked={editingSong.isFeatured}
                  onChange={(e) => setEditingSong({ ...editingSong, isFeatured: e.target.checked })}
                  className="accent-emerald-500 rounded"
                />
                <label htmlFor="editFeatured" className="text-neutral-300 cursor-pointer">
                  Featured song (Home banner)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setEditingSong(null)}
                className="px-4 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditModal}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-500 text-black rounded-lg hover:bg-emerald-400"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
