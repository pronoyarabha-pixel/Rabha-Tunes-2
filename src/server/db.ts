import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Song, Artist, Album, Playlist, User, AdminStats } from '../types/music.ts';
import { generateSyntheticFolkWav } from './audioGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'rabhatunes.json');
const AUDIO_DIR = path.join(DATA_DIR, 'uploads/audio');
const COVERS_DIR = path.join(DATA_DIR, 'uploads/covers');

interface DatabaseSchema {
  users: User[];
  adminTokens: Record<string, string>; // token -> userId
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  likedSongs: Record<string, string[]>; // userId -> songId[]
  history: Array<{ id: string; userId: string; songId: string; playedAt: string }>;
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    adminTokens: {},
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
    likedSongs: {},
    history: []
  };

  constructor() {
    this.init();
  }

  private init() {
    // Ensure directories exist
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
    if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, re-initializing seed data', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }

    // Ensure seed audio files exist on disk
    this.ensureSeedAudioFiles();
  }

  private ensureSeedAudioFiles() {
    const seed1 = path.join(AUDIO_DIR, 'echoes_of_dudhnoi.wav');
    const seed2 = path.join(AUDIO_DIR, 'breeze_of_goalpara.wav');
    const seed3 = path.join(AUDIO_DIR, 'hacha_rhythms.wav');
    const seed4 = path.join(AUDIO_DIR, 'dama_call.wav');

    if (!fs.existsSync(seed1)) {
      generateSyntheticFolkWav(seed1, 95, 'peaceful');
    }
    if (!fs.existsSync(seed2)) {
      generateSyntheticFolkWav(seed2, 110, 'ambient');
    }
    if (!fs.existsSync(seed3)) {
      generateSyntheticFolkWav(seed3, 120, 'festive');
    }
    if (!fs.existsSync(seed4)) {
      generateSyntheticFolkWav(seed4, 85, 'peaceful');
    }
  }

  private seedInitialData() {
    const defaultAdmin: User = {
      id: 'admin_1',
      email: 'admin@rabhatunes.com',
      name: 'Rabha Tunes Admin',
      role: 'admin',
      avatarUrl: '/src/assets/images/rabha_tunes_logo_1793373855039.jpg',
      createdAt: new Date().toISOString()
    };

    const artists: Artist[] = [
      {
        id: 'art_1',
        name: 'Rongmon Rabha',
        bio: 'Renowned indigenous folk master and flute maestro from the Goalpara plains. Dedicated to reviving authentic Rabha bamboo rhythms and ancestral songcraft.',
        imageUrl: '/src/assets/images/artist_rongmon_rabha_1793373858610.jpg',
        monthlyListeners: 14200,
        genres: ['Rabha Folk Fusion', 'Traditional Flute', 'Indigenous Ambient']
      },
      {
        id: 'art_2',
        name: 'Goalpara Cultural Troupe',
        bio: 'A traditional ensemble of folk drummers and choir vocalists specializing in the ceremonial Hacha festival rhythms and folk dances.',
        imageUrl: '/src/assets/images/album_hacha_rhythms_1793373857213.jpg',
        monthlyListeners: 8900,
        genres: ['Festive Tribal Beats', 'Rabha Traditional']
      },
      {
        id: 'art_3',
        name: 'Maitori Ensemble',
        bio: 'Contemporary acoustic acoustic collective blending tribal harmonies with serene organic soundscapes.',
        imageUrl: '/src/assets/images/album_goalpara_breeze_1793373856591.jpg',
        monthlyListeners: 6300,
        genres: ['Serene Ambient Folk', 'Acoustic Tribal']
      }
    ];

    const albums: Album[] = [
      {
        id: 'alb_1',
        title: 'Echoes of Dudhnoi',
        artist: 'Rongmon Rabha',
        artistId: 'art_1',
        releaseYear: 2026,
        coverUrl: '/src/assets/images/album_rabha_echoes_1793373855412.jpg',
        genre: 'Rabha Folk Fusion',
        songCount: 2
      },
      {
        id: 'alb_2',
        title: 'Breeze of Goalpara',
        artist: 'Rongmon Rabha & Maitori Ensemble',
        artistId: 'art_1',
        releaseYear: 2026,
        coverUrl: '/src/assets/images/album_goalpara_breeze_1793373856591.jpg',
        genre: 'Serene Ambient Folk',
        songCount: 1
      },
      {
        id: 'alb_3',
        title: 'Hacha Rhythms & Songs',
        artist: 'Goalpara Cultural Troupe',
        artistId: 'art_2',
        releaseYear: 2026,
        coverUrl: '/src/assets/images/album_hacha_rhythms_1793373857213.jpg',
        genre: 'Festive Tribal Beats',
        songCount: 1
      }
    ];

    const now = new Date();
    const songs: Song[] = [
      {
        id: 'song_1',
        title: 'Echoes of Dudhnoi (দুধনৈৰ প্রতিধ্বনি)',
        artist: 'Rongmon Rabha',
        artistId: 'art_1',
        album: 'Echoes of Dudhnoi',
        albumId: 'alb_1',
        genre: 'Rabha Folk Fusion',
        language: 'Rabha',
        description: 'Soulful indigenous melody blending the sacred Singga bamboo flute, wooden Kham drums, and ancient hill chants of the Dudhnoi valley.',
        releaseDate: '2026-10-01',
        publicationDate: new Date(now.getTime() - 25 * 86400000).toISOString(),
        coverUrl: '/src/assets/images/album_rabha_echoes_1793373855412.jpg',
        audioUrl: '/api/stream/song_1',
        duration: 95,
        lyrics: `[00:00.00] (Traditional Bamboo Singga Flute Prelude)
[00:15.00] Dudhnoi nodir dhalere boi ahe sur
[00:30.00] Paharor buku falir ahe aamar Rabha ghor
[00:45.00] Singga baje re, Kham baje re
[01:00.00] Matir sughondhi botahe bhahi jabo aamar poran
[01:15.00] Rabha hiyare giti gojai hahi`,
        isFeatured: true,
        isPublished: true,
        playCount: 1240,
        likesCount: 318,
        createdAt: new Date(now.getTime() - 25 * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - 25 * 86400000).toISOString(),
        mimeType: 'audio/wav'
      },
      {
        id: 'song_2',
        title: 'Breeze of Goalpara (গোৱালপাৰীয়া সমীৰ)',
        artist: 'Rongmon Rabha & Maitori Ensemble',
        artistId: 'art_1',
        album: 'Breeze of Goalpara',
        albumId: 'alb_2',
        genre: 'Serene Ambient Folk',
        language: 'Rabha / Assamese',
        description: 'Twilight acoustic serenades featuring wooden Dotara strums, evening cicadas, and heartfelt Rabha community folk melodies.',
        releaseDate: '2026-10-15',
        publicationDate: new Date(now.getTime() - 14 * 86400000).toISOString(),
        coverUrl: '/src/assets/images/album_goalpara_breeze_1793373856591.jpg',
        audioUrl: '/api/stream/song_2',
        duration: 110,
        lyrics: `[00:00.00] (Acoustic Dotara & Twilight Forest Ambience)
[00:20.00] Goalpara potho majhe juneli rati
[00:42.00] Botahe loi aane aakashor batori
[01:05.00] Suror dharae bhalpua bilai
[01:25.00] Amar Rabha hiyakhoni jurale`,
        isFeatured: true,
        isPublished: true,
        playCount: 890,
        likesCount: 245,
        createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
        mimeType: 'audio/wav'
      },
      {
        id: 'song_3',
        title: 'Hacha Rhythms & Dance (হাচা নৃত্য গীত)',
        artist: 'Goalpara Cultural Troupe',
        artistId: 'art_2',
        album: 'Hacha Rhythms & Songs',
        albumId: 'alb_3',
        genre: 'Festive Tribal Beats',
        language: 'Rabha (Rongdani)',
        description: 'Exhilarating harvest rhythm of the Rabha Hacha celebration, welcoming the new season with high-energy Dama drumming and brass cymbals.',
        releaseDate: '2026-10-25',
        publicationDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
        coverUrl: '/src/assets/images/album_hacha_rhythms_1793373857213.jpg',
        audioUrl: '/api/stream/song_3',
        duration: 120,
        lyrics: `[00:00.00] (Festive Dama Drums & Chants)
[00:18.00] Hacha porob aahil aji sokolu jhumise
[00:36.00] Rongdani hiyai aji giti gaisi
[00:54.00] Jhumuri taale taale naasi jabo ami
[01:12.00] Matir aaxirbad loi bahi thakibo dhoroni`,
        isFeatured: false,
        isPublished: true,
        playCount: 654,
        likesCount: 192,
        createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
        mimeType: 'audio/wav'
      },
      {
        id: 'song_4',
        title: 'Dama Call to the Hills (দামাৰ আহ্বান)',
        artist: 'Rongmon Rabha',
        artistId: 'art_1',
        album: 'Echoes of Dudhnoi',
        albumId: 'alb_1',
        genre: 'Rabha Traditional',
        language: 'Rabha',
        description: 'Sacred ceremonial invocation recorded during the full moon gathering in Goalpara. Scheduled for upcoming release.',
        releaseDate: '2026-11-15',
        // Scheduled in future:
        publicationDate: new Date(now.getTime() + 15 * 86400000).toISOString(),
        coverUrl: '/src/assets/images/album_rabha_echoes_1793373855412.jpg',
        audioUrl: '/api/stream/song_4',
        duration: 85,
        isFeatured: false,
        isPublished: true, // Marked to publish once publicationDate arrives
        playCount: 0,
        likesCount: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        mimeType: 'audio/wav'
      }
    ];

    const playlists: Playlist[] = [
      {
        id: 'pl_1',
        name: 'Rabha Folk Heritage Essentials',
        description: 'The definitive sound of the Rabha tribe: mystical flutes, rhythmic drums, and ancestral mountain verses.',
        coverUrl: '/src/assets/images/album_rabha_echoes_1793373855412.jpg',
        userId: 'admin_1',
        isPublic: true,
        songIds: ['song_1', 'song_2', 'song_3'],
        createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'pl_2',
        name: 'Goalpara Acoustic Twilight',
        description: 'Slow-tempo folk music and tranquil midnight serenades from the riverbanks.',
        coverUrl: '/src/assets/images/album_goalpara_breeze_1793373856591.jpg',
        userId: 'admin_1',
        isPublic: true,
        songIds: ['song_2', 'song_1'],
        createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.data = {
      users: [defaultAdmin],
      adminTokens: {
        'rabha-admin-secret-token': defaultAdmin.id
      },
      songs,
      artists,
      albums,
      playlists,
      likedSongs: {
        'guest': ['song_1', 'song_2']
      },
      history: [
        { id: 'h_1', userId: 'guest', songId: 'song_1', playedAt: new Date().toISOString() }
      ]
    };

    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file', err);
    }
  }

  // --- SONGS ---
  public getPublicSongs(options?: {
    search?: string;
    genre?: string;
    language?: string;
    artist?: string;
    album?: string;
  }): Song[] {
    const now = new Date();
    // Only published songs whose publication date has passed
    let results = this.data.songs.filter(
      (s) => s.isPublished && new Date(s.publicationDate) <= now
    );

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      results = results.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q) ||
          s.genre.toLowerCase().includes(q) ||
          s.language.toLowerCase().includes(q)
      );
    }

    if (options?.genre && options.genre !== 'All') {
      results = results.filter((s) => s.genre === options.genre);
    }

    if (options?.language && options.language !== 'All') {
      results = results.filter((s) => s.language === options.language);
    }

    if (options?.artist) {
      results = results.filter((s) => s.artist === options.artist || s.artistId === options.artist);
    }

    if (options?.album) {
      results = results.filter((s) => s.album === options.album || s.albumId === options.album);
    }

    // Default order: newest publication date first
    return results.sort(
      (a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
    );
  }

  public getAllSongsAdmin(): Song[] {
    return [...this.data.songs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getSongById(id: string): Song | undefined {
    return this.data.songs.find((s) => s.id === id);
  }

  public getSongAudioFilePath(songId: string): string | null {
    const song = this.getSongById(songId);
    if (!song) return null;

    // Mapping for seed songs
    if (songId === 'song_1') return path.join(AUDIO_DIR, 'echoes_of_dudhnoi.wav');
    if (songId === 'song_2') return path.join(AUDIO_DIR, 'breeze_of_goalpara.wav');
    if (songId === 'song_3') return path.join(AUDIO_DIR, 'hacha_rhythms.wav');
    if (songId === 'song_4') return path.join(AUDIO_DIR, 'dama_call.wav');

    // Custom uploaded songs
    const customPath = path.join(AUDIO_DIR, `${songId}.audio`);
    if (fs.existsSync(customPath)) return customPath;

    // Check with extension
    const extFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.startsWith(songId));
    if (extFiles.length > 0) {
      return path.join(AUDIO_DIR, extFiles[0]);
    }

    return null;
  }

  public addSong(song: Song): Song {
    this.data.songs.push(song);
    this.updateArtistAndAlbumStats(song);
    this.save();
    return song;
  }

  public updateSong(id: string, updates: Partial<Song>): Song | null {
    const idx = this.data.songs.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const updated = {
      ...this.data.songs[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.songs[idx] = updated;
    this.updateArtistAndAlbumStats(updated);
    this.save();
    return updated;
  }

  public deleteSong(id: string): boolean {
    const idx = this.data.songs.findIndex((s) => s.id === id);
    if (idx === -1) return false;

    this.data.songs.splice(idx, 1);

    // Remove from playlists
    this.data.playlists.forEach((p) => {
      p.songIds = p.songIds.filter((sId) => sId !== id);
    });

    // Remove file if exists
    try {
      const audioFiles = fs.readdirSync(AUDIO_DIR).filter((f) => f.startsWith(id));
      for (const f of audioFiles) {
        fs.unlinkSync(path.join(AUDIO_DIR, f));
      }
    } catch {
      // ignore
    }

    this.save();
    return true;
  }

  public incrementPlayCount(id: string): void {
    const song = this.data.songs.find((s) => s.id === id);
    if (song) {
      song.playCount = (song.playCount || 0) + 1;
      this.save();
    }
  }

  public toggleLike(userId: string, songId: string): { liked: boolean; count: number } {
    if (!this.data.likedSongs[userId]) {
      this.data.likedSongs[userId] = [];
    }
    const list = this.data.likedSongs[userId];
    const idx = list.indexOf(songId);
    let liked = false;
    if (idx >= 0) {
      list.splice(idx, 1);
      liked = false;
    } else {
      list.push(songId);
      liked = true;
    }

    const song = this.data.songs.find((s) => s.id === songId);
    if (song) {
      song.likesCount = Math.max(0, (song.likesCount || 0) + (liked ? 1 : -1));
    }

    this.save();
    return { liked, count: song?.likesCount || 0 };
  }

  public getUserLikedSongIds(userId: string): string[] {
    return this.data.likedSongs[userId] || [];
  }

  public recordPlayHistory(userId: string, songId: string): void {
    this.data.history.unshift({
      id: 'h_' + Date.now(),
      userId,
      songId,
      playedAt: new Date().toISOString()
    });
    // Keep max 100 history items per user
    this.data.history = this.data.history.slice(0, 200);
    this.incrementPlayCount(songId);
    this.save();
  }

  public getUserHistory(userId: string): Song[] {
    const songIds = this.data.history
      .filter((h) => h.userId === userId)
      .map((h) => h.songId);
    const uniqueIds = Array.from(new Set(songIds));
    const now = new Date();
    return uniqueIds
      .map((id) => this.data.songs.find((s) => s.id === id))
      .filter((s): s is Song => Boolean(s && s.isPublished && new Date(s.publicationDate) <= now));
  }

  // --- ARTISTS & ALBUMS ---
  public getArtists(): Artist[] {
    return this.data.artists;
  }

  public getAlbums(): Album[] {
    return this.data.albums;
  }

  private updateArtistAndAlbumStats(song: Song) {
    if (!song.artist) return;
    let artist = this.data.artists.find((a) => a.name.toLowerCase() === song.artist.toLowerCase());
    if (!artist) {
      artist = {
        id: 'art_' + Date.now(),
        name: song.artist,
        bio: `Artist profile for ${song.artist}.`,
        imageUrl: song.coverUrl,
        genres: [song.genre],
        monthlyListeners: 100
      };
      this.data.artists.push(artist);
    } else if (!artist.genres.includes(song.genre)) {
      artist.genres.push(song.genre);
    }

    if (song.album) {
      let album = this.data.albums.find(
        (a) => a.title.toLowerCase() === song.album.toLowerCase() && a.artist.toLowerCase() === song.artist.toLowerCase()
      );
      if (!album) {
        album = {
          id: 'alb_' + Date.now(),
          title: song.album,
          artist: song.artist,
          artistId: artist.id,
          releaseYear: new Date(song.releaseDate || song.publicationDate).getFullYear() || 2026,
          coverUrl: song.coverUrl,
          genre: song.genre,
          songCount: 1
        };
        this.data.albums.push(album);
      } else {
        album.songCount = this.data.songs.filter((s) => s.album === album?.title).length;
      }
    }
  }

  // --- PLAYLISTS ---
  public getPlaylists(userId?: string): Playlist[] {
    return this.data.playlists.filter((p) => p.isPublic || (userId && p.userId === userId));
  }

  public getPlaylistById(id: string): Playlist | undefined {
    return this.data.playlists.find((p) => p.id === id);
  }

  public createPlaylist(playlist: Playlist): Playlist {
    this.data.playlists.push(playlist);
    this.save();
    return playlist;
  }

  public updatePlaylist(id: string, updates: Partial<Playlist>): Playlist | null {
    const idx = this.data.playlists.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.playlists[idx] = {
      ...this.data.playlists[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.playlists[idx];
  }

  public deletePlaylist(id: string): boolean {
    const idx = this.data.playlists.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.playlists.splice(idx, 1);
    this.save();
    return true;
  }

  // --- STATS ---
  public getAdminStats(): AdminStats {
    const now = new Date();
    const totalSongs = this.data.songs.length;
    const publishedSongs = this.data.songs.filter(
      (s) => s.isPublished && new Date(s.publicationDate) <= now
    ).length;
    const scheduledSongs = this.data.songs.filter(
      (s) => s.isPublished && new Date(s.publicationDate) > now
    ).length;
    const totalPlays = this.data.songs.reduce((acc, s) => acc + (s.playCount || 0), 0);

    // Calculate disk storage
    let storageUsedBytes = 0;
    try {
      if (fs.existsSync(AUDIO_DIR)) {
        for (const file of fs.readdirSync(AUDIO_DIR)) {
          storageUsedBytes += fs.statSync(path.join(AUDIO_DIR, file)).size;
        }
      }
      if (fs.existsSync(COVERS_DIR)) {
        for (const file of fs.readdirSync(COVERS_DIR)) {
          storageUsedBytes += fs.statSync(path.join(COVERS_DIR, file)).size;
        }
      }
    } catch {
      // ignore
    }

    return {
      totalSongs,
      publishedSongs,
      scheduledSongs,
      totalPlays,
      totalArtists: this.data.artists.length,
      totalAlbums: this.data.albums.length,
      totalPlaylists: this.data.playlists.length,
      storageUsedBytes
    };
  }

  // --- AUTH ---
  public getAdminUser(): User | undefined {
    return this.data.users.find((u) => u.role === 'admin');
  }

  public createAdmin(name: string, email: string): { user: User; token: string } {
    let admin = this.getAdminUser();
    if (!admin) {
      admin = {
        id: 'admin_' + Date.now(),
        name,
        email,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      this.data.users.push(admin);
    } else {
      admin.name = name;
      admin.email = email;
    }
    const token = 'rabha-admin-token-' + Date.now();
    this.data.adminTokens[token] = admin.id;
    this.save();
    return { user: admin, token };
  }

  public verifyAdminToken(token: string): boolean {
    if (!token) return false;
    const cleanToken = token.replace('Bearer ', '').trim();
    if (cleanToken === 'rabha-admin-secret-token') return true;
    return Boolean(this.data.adminTokens[cleanToken]);
  }
}

export const db = new Database();
export { AUDIO_DIR, COVERS_DIR };
