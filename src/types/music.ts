export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  genre: string;
  language: string;
  description?: string;
  releaseDate: string; // ISO date or YYYY-MM-DD
  publicationDate: string; // ISO datetime when it goes live
  coverUrl: string;
  audioUrl: string;
  duration: number; // in seconds
  lyrics?: string;
  isFeatured: boolean;
  isPublished: boolean;
  playCount: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  fileSize?: number; // in bytes
  mimeType?: string;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  imageUrl: string;
  monthlyListeners?: number;
  genres: string[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  releaseYear: number;
  coverUrl: string;
  genre: string;
  songCount: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  userId: string;
  isPublic: boolean;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'listener';
  avatarUrl?: string;
  createdAt: string;
}

export interface AdminStats {
  totalSongs: number;
  publishedSongs: number;
  scheduledSongs: number;
  totalPlays: number;
  totalArtists: number;
  totalAlbums: number;
  totalPlaylists: number;
  storageUsedBytes: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayHistoryItem {
  id: string;
  songId: string;
  playedAt: string;
}
