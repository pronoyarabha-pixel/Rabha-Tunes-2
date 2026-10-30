import { Song, Artist, Album, Playlist, User, AdminStats } from '../types/music';

const TOKEN_KEY = 'rabha_tunes_admin_token';
const USER_KEY = 'rabha_tunes_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Public songs
  async getSongs(params?: {
    search?: string;
    genre?: string;
    language?: string;
    artist?: string;
    album?: string;
  }): Promise<Song[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.genre) query.set('genre', params.genre);
    if (params?.language) query.set('language', params.language);
    if (params?.artist) query.set('artist', params.artist);
    if (params?.album) query.set('album', params.album);

    const res = await fetch(`/api/songs?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch songs');
    const data = await res.json();
    return data.songs || [];
  },

  async getSong(id: string): Promise<Song> {
    const res = await fetch(`/api/songs/${id}`);
    if (!res.ok) throw new Error('Failed to load song');
    const data = await res.json();
    return data.song;
  },

  async getArtists(): Promise<Artist[]> {
    const res = await fetch('/api/artists');
    if (!res.ok) throw new Error('Failed to fetch artists');
    const data = await res.json();
    return data.artists || [];
  },

  async getAlbums(): Promise<Album[]> {
    const res = await fetch('/api/albums');
    if (!res.ok) throw new Error('Failed to fetch albums');
    const data = await res.json();
    return data.albums || [];
  },

  // Playlists
  async getPlaylists(userId: string = 'guest'): Promise<Playlist[]> {
    const res = await fetch(`/api/playlists?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch playlists');
    const data = await res.json();
    return data.playlists || [];
  },

  async createPlaylist(playlist: { name: string; description?: string; coverUrl?: string; userId?: string }): Promise<Playlist> {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlist)
    });
    if (!res.ok) throw new Error('Failed to create playlist');
    const data = await res.json();
    return data.playlist;
  },

  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist> {
    const res = await fetch(`/api/playlists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update playlist');
    const data = await res.json();
    return data.playlist;
  },

  async deletePlaylist(id: string): Promise<boolean> {
    const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete playlist');
    const data = await res.json();
    return data.success;
  },

  async toggleSongInPlaylist(playlistId: string, songId: string, action: 'add' | 'remove'): Promise<Playlist> {
    const res = await fetch(`/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, action })
    });
    if (!res.ok) throw new Error('Failed to update playlist songs');
    const data = await res.json();
    return data.playlist;
  },

  // Likes & History
  async getLikedSongIds(userId: string = 'guest'): Promise<string[]> {
    const res = await fetch(`/api/liked?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.likedSongIds || [];
  },

  async toggleLike(songId: string, userId: string = 'guest'): Promise<{ liked: boolean; count: number }> {
    const res = await fetch('/api/liked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, userId })
    });
    if (!res.ok) throw new Error('Failed to toggle like');
    return res.json();
  },

  async getHistory(userId: string = 'guest'): Promise<Song[]> {
    const res = await fetch(`/api/history?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.history || [];
  },

  async recordHistory(songId: string, userId: string = 'guest'): Promise<void> {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId, userId })
      });
    } catch {
      // ignore
    }
  },

  // Auth
  async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    setStoredToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async setupAdmin(name: string, email: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/setup-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to initialize administrator');
    }
    const data = await res.json();
    setStoredToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async getMe(): Promise<{ user: User | null; role: string }> {
    const token = getStoredToken();
    if (!token) return { user: null, role: 'guest' };

    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return { user: null, role: 'guest' };
    return res.json();
  },

  logout() {
    setStoredToken(null);
    setStoredUser(null);
  },

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch('/api/admin/stats', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Unauthorized or failed to fetch admin stats');
    const data = await res.json();
    return data.stats;
  },

  async getAdminSongs(): Promise<Song[]> {
    const res = await fetch('/api/admin/songs', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Unauthorized or failed to fetch admin songs');
    const data = await res.json();
    return data.songs || [];
  },

  async uploadSong(formData: FormData): Promise<Song> {
    const token = getStoredToken();
    const res = await fetch('/api/admin/upload-song', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    const data = await res.json();
    return data.song;
  },

  async batchUpload(formData: FormData): Promise<{ uploadedCount: number; songs: Song[] }> {
    const token = getStoredToken();
    const res = await fetch('/api/admin/batch-upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Batch upload failed');
    }
    return res.json();
  },

  async updateSong(id: string, updates: Partial<Song>): Promise<Song> {
    const res = await fetch(`/api/admin/songs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update song');
    const data = await res.json();
    return data.song;
  },

  async replaceSongAudio(id: string, audioFile: File): Promise<Song> {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append('audio', audioFile);

    const res = await fetch(`/api/admin/songs/${id}/replace-audio`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) throw new Error('Failed to replace audio file');
    const data = await res.json();
    return data.song;
  },

  async replaceSongCover(id: string, coverFile: File): Promise<Song> {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append('cover', coverFile);

    const res = await fetch(`/api/admin/songs/${id}/replace-cover`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) throw new Error('Failed to replace album cover');
    const data = await res.json();
    return data.song;
  },

  async togglePublish(id: string, isPublished: boolean, publicationDate?: string): Promise<Song> {
    const res = await fetch(`/api/admin/songs/${id}/toggle-publish`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isPublished, publicationDate })
    });
    if (!res.ok) throw new Error('Failed to update publication status');
    const data = await res.json();
    return data.song;
  },

  async toggleFeatured(id: string, isFeatured?: boolean): Promise<Song> {
    const res = await fetch(`/api/admin/songs/${id}/toggle-featured`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isFeatured })
    });
    if (!res.ok) throw new Error('Failed to toggle featured status');
    const data = await res.json();
    return data.song;
  },

  async deleteSong(id: string): Promise<boolean> {
    const res = await fetch(`/api/admin/songs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete song');
    const data = await res.json();
    return data.success;
  }
};
