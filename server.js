// server.ts
import express from "express";
import http from "http";
import fs3 from "fs";
import path3 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import multer from "multer";
import { WebSocketServer, WebSocket } from "ws";

// src/server/db.ts
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath } from "url";

// src/server/audioGenerator.ts
import fs from "fs";
import path from "path";
function generateSyntheticFolkWav(filePath, durationSec = 60, melodyMood = "peaceful") {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sampleRate = 22050;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataByteLength = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataByteLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataByteLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataByteLength, 40);
  const pentatonic = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];
  let noteDuration = melodyMood === "festive" ? 0.35 : 0.75;
  let melodySeq = [];
  if (melodyMood === "peaceful") {
    melodySeq = [0, 1, 2, 4, 3, 2, 0, 2, 4, 5, 4, 2, 1, 0, -1, 2];
  } else if (melodyMood === "ambient") {
    melodySeq = [4, 3, 2, 0, 1, 2, 4, 6, 5, 4, 2, 1, 0, -1, 0, 2];
    noteDuration = 1.1;
  } else {
    melodySeq = [0, 2, 4, 5, 4, 2, 4, 5, 7, 5, 4, 2, 1, 2, 0, 0];
    noteDuration = 0.3;
  }
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const drone1 = Math.sin(2 * Math.PI * 130.81 * t) * 0.15;
    const drone2 = Math.sin(2 * Math.PI * 196 * t) * 0.08;
    const droneShimmer = Math.sin(2 * Math.PI * 0.2 * t) * 0.04;
    const currentNoteIndex = Math.floor(t / noteDuration) % melodySeq.length;
    const noteStep = melodySeq[currentNoteIndex];
    let fluteSample = 0;
    if (noteStep >= 0 && noteStep < pentatonic.length) {
      const noteTime = t % noteDuration;
      const freq = pentatonic[noteStep];
      const vibrato = Math.sin(2 * Math.PI * 5 * noteTime) * (noteTime > 0.3 ? 4 : 1);
      const actualFreq = freq + vibrato;
      let envelope = 1;
      if (noteTime < 0.08) {
        envelope = noteTime / 0.08;
      } else if (noteTime > noteDuration - 0.08) {
        envelope = (noteDuration - noteTime) / 0.08;
      }
      const breath = (Math.random() * 2 - 1) * 0.015;
      const h1 = Math.sin(2 * Math.PI * actualFreq * t);
      const h2 = Math.sin(2 * Math.PI * (actualFreq * 2) * t) * 0.25;
      const h3 = Math.sin(2 * Math.PI * (actualFreq * 3) * t) * 0.1;
      fluteSample = (h1 + h2 + h3 + breath) * envelope * 0.45;
    }
    const beatInterval = melodyMood === "festive" ? 0.3 : 0.6;
    const beatPhase = t % beatInterval / beatInterval;
    let drumSample = 0;
    if (beatPhase < 0.15) {
      const drumT = beatPhase * beatInterval;
      const drumPitch = 90 * Math.exp(-drumT * 25);
      drumSample = Math.sin(2 * Math.PI * drumPitch * drumT) * Math.exp(-drumT * 18) * 0.35;
    }
    let cymbalSample = 0;
    const offBeatPhase = (t + beatInterval * 0.5) % beatInterval / beatInterval;
    if (offBeatPhase < 0.04) {
      cymbalSample = (Math.random() * 2 - 1) * Math.exp(-offBeatPhase * 40) * 0.08;
    }
    const mix = drone1 + drone2 + droneShimmer + fluteSample + drumSample + cymbalSample;
    const clamped = Math.max(-1, Math.min(1, mix));
    const sampleInt16 = Math.floor(clamped * 32767);
    buffer.writeInt16LE(sampleInt16, offset);
    offset += 2;
  }
  fs.writeFileSync(filePath, buffer);
}

// src/server/db.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var DATA_DIR = path2.resolve(__dirname, "../../data");
var DB_FILE = path2.join(DATA_DIR, "rabhatunes.json");
var AUDIO_DIR = path2.join(DATA_DIR, "uploads/audio");
var COVERS_DIR = path2.join(DATA_DIR, "uploads/covers");
var Database = class {
  constructor() {
    this.data = {
      users: [],
      adminTokens: {},
      songs: [],
      artists: [],
      albums: [],
      playlists: [],
      likedSongs: {},
      history: []
    };
    this.init();
  }
  init() {
    if (!fs2.existsSync(DATA_DIR)) fs2.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs2.existsSync(AUDIO_DIR)) fs2.mkdirSync(AUDIO_DIR, { recursive: true });
    if (!fs2.existsSync(COVERS_DIR)) fs2.mkdirSync(COVERS_DIR, { recursive: true });
    if (fs2.existsSync(DB_FILE)) {
      try {
        const raw = fs2.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error("Failed to parse database file, re-initializing seed data", err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
    this.ensureSeedAudioFiles();
  }
  ensureSeedAudioFiles() {
    const seed1 = path2.join(AUDIO_DIR, "echoes_of_dudhnoi.wav");
    const seed2 = path2.join(AUDIO_DIR, "breeze_of_goalpara.wav");
    const seed3 = path2.join(AUDIO_DIR, "hacha_rhythms.wav");
    const seed4 = path2.join(AUDIO_DIR, "dama_call.wav");
    if (!fs2.existsSync(seed1)) {
      generateSyntheticFolkWav(seed1, 95, "peaceful");
    }
    if (!fs2.existsSync(seed2)) {
      generateSyntheticFolkWav(seed2, 110, "ambient");
    }
    if (!fs2.existsSync(seed3)) {
      generateSyntheticFolkWav(seed3, 120, "festive");
    }
    if (!fs2.existsSync(seed4)) {
      generateSyntheticFolkWav(seed4, 85, "peaceful");
    }
  }
  seedInitialData() {
    const defaultAdmin = {
      id: "admin_1",
      email: "admin@rabhatunes.com",
      name: "Rabha Tunes Admin",
      role: "admin",
      avatarUrl: "/src/assets/images/rabha_tunes_logo_1793373855039.jpg",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const artists = [
      {
        id: "art_1",
        name: "Rongmon Rabha",
        bio: "Renowned indigenous folk master and flute maestro from the Goalpara plains. Dedicated to reviving authentic Rabha bamboo rhythms and ancestral songcraft.",
        imageUrl: "/src/assets/images/artist_rongmon_rabha_1793373858610.jpg",
        monthlyListeners: 14200,
        genres: ["Rabha Folk Fusion", "Traditional Flute", "Indigenous Ambient"]
      },
      {
        id: "art_2",
        name: "Goalpara Cultural Troupe",
        bio: "A traditional ensemble of folk drummers and choir vocalists specializing in the ceremonial Hacha festival rhythms and folk dances.",
        imageUrl: "/src/assets/images/album_hacha_rhythms_1793373857213.jpg",
        monthlyListeners: 8900,
        genres: ["Festive Tribal Beats", "Rabha Traditional"]
      },
      {
        id: "art_3",
        name: "Maitori Ensemble",
        bio: "Contemporary acoustic acoustic collective blending tribal harmonies with serene organic soundscapes.",
        imageUrl: "/src/assets/images/album_goalpara_breeze_1793373856591.jpg",
        monthlyListeners: 6300,
        genres: ["Serene Ambient Folk", "Acoustic Tribal"]
      }
    ];
    const albums = [
      {
        id: "alb_1",
        title: "Echoes of Dudhnoi",
        artist: "Rongmon Rabha",
        artistId: "art_1",
        releaseYear: 2026,
        coverUrl: "/src/assets/images/album_rabha_echoes_1793373855412.jpg",
        genre: "Rabha Folk Fusion",
        songCount: 2
      },
      {
        id: "alb_2",
        title: "Breeze of Goalpara",
        artist: "Rongmon Rabha & Maitori Ensemble",
        artistId: "art_1",
        releaseYear: 2026,
        coverUrl: "/src/assets/images/album_goalpara_breeze_1793373856591.jpg",
        genre: "Serene Ambient Folk",
        songCount: 1
      },
      {
        id: "alb_3",
        title: "Hacha Rhythms & Songs",
        artist: "Goalpara Cultural Troupe",
        artistId: "art_2",
        releaseYear: 2026,
        coverUrl: "/src/assets/images/album_hacha_rhythms_1793373857213.jpg",
        genre: "Festive Tribal Beats",
        songCount: 1
      }
    ];
    const now = /* @__PURE__ */ new Date();
    const songs = [
      {
        id: "song_1",
        title: "Echoes of Dudhnoi (\u09A6\u09C1\u09A7\u09A8\u09C8\u09F0 \u09AA\u09CD\u09B0\u09A4\u09BF\u09A7\u09CD\u09AC\u09A8\u09BF)",
        artist: "Rongmon Rabha",
        artistId: "art_1",
        album: "Echoes of Dudhnoi",
        albumId: "alb_1",
        genre: "Rabha Folk Fusion",
        language: "Rabha",
        description: "Soulful indigenous melody blending the sacred Singga bamboo flute, wooden Kham drums, and ancient hill chants of the Dudhnoi valley.",
        releaseDate: "2026-10-01",
        publicationDate: new Date(now.getTime() - 25 * 864e5).toISOString(),
        coverUrl: "/src/assets/images/album_rabha_echoes_1793373855412.jpg",
        audioUrl: "/api/stream/song_1",
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
        createdAt: new Date(now.getTime() - 25 * 864e5).toISOString(),
        updatedAt: new Date(now.getTime() - 25 * 864e5).toISOString(),
        mimeType: "audio/wav"
      },
      {
        id: "song_2",
        title: "Breeze of Goalpara (\u0997\u09CB\u09F1\u09BE\u09B2\u09AA\u09BE\u09F0\u09C0\u09AF\u09BC\u09BE \u09B8\u09AE\u09C0\u09F0)",
        artist: "Rongmon Rabha & Maitori Ensemble",
        artistId: "art_1",
        album: "Breeze of Goalpara",
        albumId: "alb_2",
        genre: "Serene Ambient Folk",
        language: "Rabha / Assamese",
        description: "Twilight acoustic serenades featuring wooden Dotara strums, evening cicadas, and heartfelt Rabha community folk melodies.",
        releaseDate: "2026-10-15",
        publicationDate: new Date(now.getTime() - 14 * 864e5).toISOString(),
        coverUrl: "/src/assets/images/album_goalpara_breeze_1793373856591.jpg",
        audioUrl: "/api/stream/song_2",
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
        createdAt: new Date(now.getTime() - 14 * 864e5).toISOString(),
        updatedAt: new Date(now.getTime() - 14 * 864e5).toISOString(),
        mimeType: "audio/wav"
      },
      {
        id: "song_3",
        title: "Hacha Rhythms & Dance (\u09B9\u09BE\u099A\u09BE \u09A8\u09C3\u09A4\u09CD\u09AF \u0997\u09C0\u09A4)",
        artist: "Goalpara Cultural Troupe",
        artistId: "art_2",
        album: "Hacha Rhythms & Songs",
        albumId: "alb_3",
        genre: "Festive Tribal Beats",
        language: "Rabha (Rongdani)",
        description: "Exhilarating harvest rhythm of the Rabha Hacha celebration, welcoming the new season with high-energy Dama drumming and brass cymbals.",
        releaseDate: "2026-10-25",
        publicationDate: new Date(now.getTime() - 5 * 864e5).toISOString(),
        coverUrl: "/src/assets/images/album_hacha_rhythms_1793373857213.jpg",
        audioUrl: "/api/stream/song_3",
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
        createdAt: new Date(now.getTime() - 5 * 864e5).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 864e5).toISOString(),
        mimeType: "audio/wav"
      },
      {
        id: "song_4",
        title: "Dama Call to the Hills (\u09A6\u09BE\u09AE\u09BE\u09F0 \u0986\u09B9\u09CD\u09AC\u09BE\u09A8)",
        artist: "Rongmon Rabha",
        artistId: "art_1",
        album: "Echoes of Dudhnoi",
        albumId: "alb_1",
        genre: "Rabha Traditional",
        language: "Rabha",
        description: "Sacred ceremonial invocation recorded during the full moon gathering in Goalpara. Scheduled for upcoming release.",
        releaseDate: "2026-11-15",
        // Scheduled in future:
        publicationDate: new Date(now.getTime() + 15 * 864e5).toISOString(),
        coverUrl: "/src/assets/images/album_rabha_echoes_1793373855412.jpg",
        audioUrl: "/api/stream/song_4",
        duration: 85,
        isFeatured: false,
        isPublished: true,
        // Marked to publish once publicationDate arrives
        playCount: 0,
        likesCount: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        mimeType: "audio/wav"
      }
    ];
    const playlists = [
      {
        id: "pl_1",
        name: "Rabha Folk Heritage Essentials",
        description: "The definitive sound of the Rabha tribe: mystical flutes, rhythmic drums, and ancestral mountain verses.",
        coverUrl: "/src/assets/images/album_rabha_echoes_1793373855412.jpg",
        userId: "admin_1",
        isPublic: true,
        songIds: ["song_1", "song_2", "song_3"],
        createdAt: new Date(now.getTime() - 20 * 864e5).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "pl_2",
        name: "Goalpara Acoustic Twilight",
        description: "Slow-tempo folk music and tranquil midnight serenades from the riverbanks.",
        coverUrl: "/src/assets/images/album_goalpara_breeze_1793373856591.jpg",
        userId: "admin_1",
        isPublic: true,
        songIds: ["song_2", "song_1"],
        createdAt: new Date(now.getTime() - 10 * 864e5).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    this.data = {
      users: [defaultAdmin],
      adminTokens: {
        "rabha-admin-secret-token": defaultAdmin.id
      },
      songs,
      artists,
      albums,
      playlists,
      likedSongs: {
        "guest": ["song_1", "song_2"]
      },
      history: [
        { id: "h_1", userId: "guest", songId: "song_1", playedAt: (/* @__PURE__ */ new Date()).toISOString() }
      ]
    };
    this.save();
  }
  save() {
    try {
      fs2.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write database file", err);
    }
  }
  // --- SONGS ---
  getPublicSongs(options) {
    const now = /* @__PURE__ */ new Date();
    let results = this.data.songs.filter(
      (s) => s.isPublished && new Date(s.publicationDate) <= now
    );
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      results = results.filter(
        (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.album.toLowerCase().includes(q) || s.genre.toLowerCase().includes(q) || s.language.toLowerCase().includes(q)
      );
    }
    if (options?.genre && options.genre !== "All") {
      results = results.filter((s) => s.genre === options.genre);
    }
    if (options?.language && options.language !== "All") {
      results = results.filter((s) => s.language === options.language);
    }
    if (options?.artist) {
      results = results.filter((s) => s.artist === options.artist || s.artistId === options.artist);
    }
    if (options?.album) {
      results = results.filter((s) => s.album === options.album || s.albumId === options.album);
    }
    return results.sort(
      (a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
    );
  }
  getAllSongsAdmin() {
    return [...this.data.songs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  getSongById(id) {
    return this.data.songs.find((s) => s.id === id);
  }
  getSongAudioFilePath(songId) {
    const song = this.getSongById(songId);
    if (!song) return null;
    if (songId === "song_1") return path2.join(AUDIO_DIR, "echoes_of_dudhnoi.wav");
    if (songId === "song_2") return path2.join(AUDIO_DIR, "breeze_of_goalpara.wav");
    if (songId === "song_3") return path2.join(AUDIO_DIR, "hacha_rhythms.wav");
    if (songId === "song_4") return path2.join(AUDIO_DIR, "dama_call.wav");
    const customPath = path2.join(AUDIO_DIR, `${songId}.audio`);
    if (fs2.existsSync(customPath)) return customPath;
    const extFiles = fs2.readdirSync(AUDIO_DIR).filter((f) => f.startsWith(songId));
    if (extFiles.length > 0) {
      return path2.join(AUDIO_DIR, extFiles[0]);
    }
    return null;
  }
  addSong(song) {
    this.data.songs.push(song);
    this.updateArtistAndAlbumStats(song);
    this.save();
    return song;
  }
  updateSong(id, updates) {
    const idx = this.data.songs.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.data.songs[idx],
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.songs[idx] = updated;
    this.updateArtistAndAlbumStats(updated);
    this.save();
    return updated;
  }
  deleteSong(id) {
    const idx = this.data.songs.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.data.songs.splice(idx, 1);
    this.data.playlists.forEach((p) => {
      p.songIds = p.songIds.filter((sId) => sId !== id);
    });
    try {
      const audioFiles = fs2.readdirSync(AUDIO_DIR).filter((f) => f.startsWith(id));
      for (const f of audioFiles) {
        fs2.unlinkSync(path2.join(AUDIO_DIR, f));
      }
    } catch {
    }
    this.save();
    return true;
  }
  incrementPlayCount(id) {
    const song = this.data.songs.find((s) => s.id === id);
    if (song) {
      song.playCount = (song.playCount || 0) + 1;
      this.save();
    }
  }
  toggleLike(userId, songId) {
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
  getUserLikedSongIds(userId) {
    return this.data.likedSongs[userId] || [];
  }
  recordPlayHistory(userId, songId) {
    this.data.history.unshift({
      id: "h_" + Date.now(),
      userId,
      songId,
      playedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.data.history = this.data.history.slice(0, 200);
    this.incrementPlayCount(songId);
    this.save();
  }
  getUserHistory(userId) {
    const songIds = this.data.history.filter((h) => h.userId === userId).map((h) => h.songId);
    const uniqueIds = Array.from(new Set(songIds));
    const now = /* @__PURE__ */ new Date();
    return uniqueIds.map((id) => this.data.songs.find((s) => s.id === id)).filter((s) => Boolean(s && s.isPublished && new Date(s.publicationDate) <= now));
  }
  // --- ARTISTS & ALBUMS ---
  getArtists() {
    return this.data.artists;
  }
  getAlbums() {
    return this.data.albums;
  }
  updateArtistAndAlbumStats(song) {
    if (!song.artist) return;
    let artist = this.data.artists.find((a) => a.name.toLowerCase() === song.artist.toLowerCase());
    if (!artist) {
      artist = {
        id: "art_" + Date.now(),
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
          id: "alb_" + Date.now(),
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
  getPlaylists(userId) {
    return this.data.playlists.filter((p) => p.isPublic || userId && p.userId === userId);
  }
  getPlaylistById(id) {
    return this.data.playlists.find((p) => p.id === id);
  }
  createPlaylist(playlist) {
    this.data.playlists.push(playlist);
    this.save();
    return playlist;
  }
  updatePlaylist(id, updates) {
    const idx = this.data.playlists.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.playlists[idx] = {
      ...this.data.playlists[idx],
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.save();
    return this.data.playlists[idx];
  }
  deletePlaylist(id) {
    const idx = this.data.playlists.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.playlists.splice(idx, 1);
    this.save();
    return true;
  }
  // --- STATS ---
  getAdminStats() {
    const now = /* @__PURE__ */ new Date();
    const totalSongs = this.data.songs.length;
    const publishedSongs = this.data.songs.filter(
      (s) => s.isPublished && new Date(s.publicationDate) <= now
    ).length;
    const scheduledSongs = this.data.songs.filter(
      (s) => s.isPublished && new Date(s.publicationDate) > now
    ).length;
    const totalPlays = this.data.songs.reduce((acc, s) => acc + (s.playCount || 0), 0);
    let storageUsedBytes = 0;
    try {
      if (fs2.existsSync(AUDIO_DIR)) {
        for (const file of fs2.readdirSync(AUDIO_DIR)) {
          storageUsedBytes += fs2.statSync(path2.join(AUDIO_DIR, file)).size;
        }
      }
      if (fs2.existsSync(COVERS_DIR)) {
        for (const file of fs2.readdirSync(COVERS_DIR)) {
          storageUsedBytes += fs2.statSync(path2.join(COVERS_DIR, file)).size;
        }
      }
    } catch {
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
  getAdminUser() {
    return this.data.users.find((u) => u.role === "admin");
  }
  createAdmin(name, email) {
    let admin = this.getAdminUser();
    if (!admin) {
      admin = {
        id: "admin_" + Date.now(),
        name,
        email,
        role: "admin",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.data.users.push(admin);
    } else {
      admin.name = name;
      admin.email = email;
    }
    const token = "rabha-admin-token-" + Date.now();
    this.data.adminTokens[token] = admin.id;
    this.save();
    return { user: admin, token };
  }
  verifyAdminToken(token) {
    if (!token) return false;
    const cleanToken = token.replace("Bearer ", "").trim();
    if (cleanToken === "rabha-admin-secret-token") return true;
    return Boolean(this.data.adminTokens[cleanToken]);
  }
};
var db = new Database();

// server.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path3.dirname(__filename2);
var isProduction = process.env.NODE_ENV === "production";
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var app = express();
var server = http.createServer(app);
var wss = new WebSocketServer({ server, path: "/ws" });
function broadcastCatalogEvent(event, payload) {
  const message = JSON.stringify({
    event,
    data: payload,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
wss.on("connection", (ws) => {
  ws.send(JSON.stringify({
    event: "connected",
    data: { message: "Connected to Rabha Tunes Realtime Gateway" },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }));
});
var publishedScheduledIds = /* @__PURE__ */ new Set();
setInterval(() => {
  const now = /* @__PURE__ */ new Date();
  const allSongs = db.getAllSongsAdmin();
  for (const s of allSongs) {
    if (s.isPublished && new Date(s.publicationDate) <= now && !publishedScheduledIds.has(s.id)) {
      publishedScheduledIds.add(s.id);
      broadcastCatalogEvent("song:published", {
        song: s,
        message: `Scheduled track "${s.title}" is now available!`
      });
    }
  }
}, 1e4);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads/covers", express.static(COVERS_DIR));
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "audio") {
      cb(null, AUDIO_DIR);
    } else if (file.fieldname === "cover") {
      cb(null, COVERS_DIR);
    } else {
      cb(null, AUDIO_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = path3.extname(file.originalname) || "";
    const safeName = "upload_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, safeName);
  }
});
var upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
    // 100MB limit for high-res audio
  }
});
var requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!db.verifyAdminToken(authHeader)) {
    return res.status(401).json({ error: "Unauthorized. Admin credentials required." });
  }
  next();
};
app.get("/api/stream/:id", (req, res) => {
  const { id } = req.params;
  const song = db.getSongById(id);
  if (!song) {
    return res.status(404).json({ error: "Song not found" });
  }
  const now = /* @__PURE__ */ new Date();
  const isScheduled = new Date(song.publicationDate) > now;
  const authHeader = req.headers.authorization || "";
  const isAdmin = db.verifyAdminToken(authHeader);
  if ((!song.isPublished || isScheduled) && !isAdmin) {
    return res.status(403).json({ error: "This song has not yet been published." });
  }
  const filePath = db.getSongAudioFilePath(id);
  if (!filePath || !fs3.existsSync(filePath)) {
    return res.status(404).json({ error: "Audio file not found on server" });
  }
  const stat = fs3.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const ext = path3.extname(filePath).toLowerCase();
  let contentType = "audio/mpeg";
  if (ext === ".wav") contentType = "audio/wav";
  else if (ext === ".aac") contentType = "audio/aac";
  else if (ext === ".ogg") contentType = "audio/ogg";
  else if (ext === ".mp3") contentType = "audio/mpeg";
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=86400");
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    if (start >= fileSize || end >= fileSize) {
      res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
      return res.end();
    }
    const chunksize = end - start + 1;
    const fileStream = fs3.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType
    });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": contentType
    });
    fs3.createReadStream(filePath).pipe(res);
  }
});
app.get("/api/songs", (req, res) => {
  const { search, genre, language, artist, album } = req.query;
  const songs = db.getPublicSongs({
    search,
    genre,
    language,
    artist,
    album
  });
  res.json({ songs });
});
app.get("/api/songs/:id", (req, res) => {
  const song = db.getSongById(req.params.id);
  if (!song) {
    return res.status(404).json({ error: "Song not found" });
  }
  res.json({ song });
});
app.get("/api/artists", (_req, res) => {
  res.json({ artists: db.getArtists() });
});
app.get("/api/albums", (_req, res) => {
  res.json({ albums: db.getAlbums() });
});
app.get("/api/playlists", (req, res) => {
  const userId = req.query.userId || "guest";
  res.json({ playlists: db.getPlaylists(userId) });
});
app.post("/api/playlists", (req, res) => {
  const { name, description, coverUrl, userId = "guest", isPublic = true } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Playlist name is required" });
  }
  const newPl = {
    id: "pl_" + Date.now(),
    name: name.trim(),
    description: description || "",
    coverUrl: coverUrl || "/src/assets/images/album_rabha_echoes_1793373855412.jpg",
    userId,
    isPublic,
    songIds: [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const created = db.createPlaylist(newPl);
  res.json({ playlist: created });
});
app.put("/api/playlists/:id", (req, res) => {
  const updated = db.updatePlaylist(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Playlist not found" });
  res.json({ playlist: updated });
});
app.delete("/api/playlists/:id", (req, res) => {
  const success = db.deletePlaylist(req.params.id);
  res.json({ success });
});
app.post("/api/playlists/:id/songs", (req, res) => {
  const { songId, action } = req.body;
  const pl = db.getPlaylistById(req.params.id);
  if (!pl) return res.status(404).json({ error: "Playlist not found" });
  let updatedSongs = [...pl.songIds];
  if (action === "remove") {
    updatedSongs = updatedSongs.filter((id) => id !== songId);
  } else {
    if (!updatedSongs.includes(songId)) {
      updatedSongs.push(songId);
    }
  }
  const updated = db.updatePlaylist(pl.id, { songIds: updatedSongs });
  res.json({ playlist: updated });
});
app.get("/api/liked", (req, res) => {
  const userId = req.query.userId || "guest";
  res.json({ likedSongIds: db.getUserLikedSongIds(userId) });
});
app.post("/api/liked", (req, res) => {
  const { songId, userId = "guest" } = req.body;
  const result = db.toggleLike(userId, songId);
  res.json(result);
});
app.get("/api/history", (req, res) => {
  const userId = req.query.userId || "guest";
  res.json({ history: db.getUserHistory(userId) });
});
app.post("/api/history", (req, res) => {
  const { songId, userId = "guest" } = req.body;
  db.recordPlayHistory(userId, songId);
  res.json({ success: true });
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const admin = db.getAdminUser();
  if (email === (admin?.email || "admin@rabhatunes.com") && (password === "rabha2026" || password === "admin123")) {
    const token = "rabha-admin-secret-token";
    return res.json({
      user: admin || {
        id: "admin_1",
        name: "Rabha Tunes Admin",
        email: "admin@rabhatunes.com",
        role: "admin"
      },
      token
    });
  }
  if (email && email.includes("@")) {
    return res.json({
      user: {
        id: "usr_" + Buffer.from(email).toString("hex").slice(0, 8),
        name: email.split("@")[0],
        email,
        role: "listener"
      },
      token: "listener-token-" + Date.now()
    });
  }
  res.status(401).json({ error: "Invalid login credentials. Use admin@rabhatunes.com and rabha2026" });
});
app.post("/api/auth/setup-admin", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  const result = db.createAdmin(name, email);
  res.json(result);
});
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const isAdmin = db.verifyAdminToken(authHeader);
  if (isAdmin) {
    const admin = db.getAdminUser();
    return res.json({ user: admin, role: "admin" });
  }
  res.json({ user: null, role: "guest" });
});
app.get("/api/admin/stats", requireAdmin, (_req, res) => {
  res.json({ stats: db.getAdminStats() });
});
app.get("/api/admin/songs", requireAdmin, (_req, res) => {
  res.json({ songs: db.getAllSongsAdmin() });
});
app.post(
  "/api/admin/upload-song",
  requireAdmin,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 }
  ]),
  (req, res) => {
    const files = req.files;
    const audioFile = files?.["audio"]?.[0];
    const coverFile = files?.["cover"]?.[0];
    const {
      title,
      artist,
      album,
      genre,
      language,
      description,
      releaseDate,
      publicationDate,
      lyrics,
      isFeatured,
      isPublished,
      duration: durationRaw,
      coverUrl: explicitCoverUrl
    } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ error: "Title and artist are required" });
    }
    if (!audioFile) {
      return res.status(400).json({ error: "An audio file (MP3, WAV, or AAC) is required" });
    }
    const songId = "song_" + Date.now();
    const audioExt = path3.extname(audioFile.originalname) || ".mp3";
    const finalAudioPath = path3.join(AUDIO_DIR, `${songId}${audioExt}`);
    fs3.renameSync(audioFile.path, finalAudioPath);
    let finalCoverUrl = explicitCoverUrl || "/src/assets/images/album_rabha_echoes_1793373855412.jpg";
    if (coverFile) {
      finalCoverUrl = `/uploads/covers/${coverFile.filename}`;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const parsedDuration = parseInt(durationRaw, 10) || 120;
    const newSong = {
      id: songId,
      title: title.trim(),
      artist: artist.trim(),
      album: (album || "Single").trim(),
      genre: genre || "Rabha Traditional",
      language: language || "Rabha",
      description: description || "",
      releaseDate: releaseDate || nowIso.split("T")[0],
      publicationDate: publicationDate || nowIso,
      coverUrl: finalCoverUrl,
      audioUrl: `/api/stream/${songId}`,
      duration: parsedDuration,
      lyrics: lyrics || "",
      isFeatured: isFeatured === "true" || isFeatured === true,
      isPublished: isPublished === "true" || isPublished === true,
      playCount: 0,
      likesCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      fileSize: audioFile.size,
      mimeType: audioFile.mimetype
    };
    const added = db.addSong(newSong);
    broadcastCatalogEvent("catalog:changed", {
      action: "add",
      song: added,
      message: `New song "${added.title}" uploaded!`
    });
    res.json({ song: added });
  }
);
app.post(
  "/api/admin/batch-upload",
  requireAdmin,
  upload.array("audioFiles", 20),
  (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No audio files provided" });
    }
    const defaultArtist = req.body.defaultArtist || "Rongmon Rabha";
    const defaultAlbum = req.body.defaultAlbum || "Rabha Heritage Collection";
    const defaultGenre = req.body.defaultGenre || "Rabha Folk Fusion";
    const defaultLanguage = req.body.defaultLanguage || "Rabha";
    const publishNow = req.body.publishNow === "true" || req.body.publishNow === true;
    const addedSongs = [];
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const songId = "song_" + (Date.now() + i);
      const audioExt = path3.extname(file.originalname) || ".mp3";
      const finalAudioPath = path3.join(AUDIO_DIR, `${songId}${audioExt}`);
      fs3.renameSync(file.path, finalAudioPath);
      const cleanTitle = path3.basename(file.originalname, audioExt).replace(/[_-]/g, " ");
      const song = {
        id: songId,
        title: cleanTitle,
        artist: defaultArtist,
        album: defaultAlbum,
        genre: defaultGenre,
        language: defaultLanguage,
        releaseDate: nowIso.split("T")[0],
        publicationDate: nowIso,
        coverUrl: "/src/assets/images/album_rabha_echoes_1793373855412.jpg",
        audioUrl: `/api/stream/${songId}`,
        duration: 135,
        isFeatured: false,
        isPublished: publishNow,
        playCount: 0,
        likesCount: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
        fileSize: file.size,
        mimeType: file.mimetype
      };
      const added = db.addSong(song);
      addedSongs.push(added);
    }
    broadcastCatalogEvent("catalog:changed", {
      action: "batch",
      count: addedSongs.length,
      message: `${addedSongs.length} new songs added to catalog!`
    });
    res.json({ uploadedCount: addedSongs.length, songs: addedSongs });
  }
);
app.put("/api/admin/songs/:id", requireAdmin, (req, res) => {
  const updated = db.updateSong(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Song not found" });
  broadcastCatalogEvent("catalog:changed", {
    action: "update",
    song: updated
  });
  res.json({ song: updated });
});
app.put(
  "/api/admin/songs/:id/replace-audio",
  requireAdmin,
  upload.single("audio"),
  (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No audio file provided" });
    const songId = req.params.id;
    const song = db.getSongById(songId);
    if (!song) return res.status(404).json({ error: "Song not found" });
    try {
      const oldFiles = fs3.readdirSync(AUDIO_DIR).filter((f) => f.startsWith(songId));
      for (const f of oldFiles) fs3.unlinkSync(path3.join(AUDIO_DIR, f));
    } catch {
    }
    const audioExt = path3.extname(file.originalname) || ".mp3";
    const newPath = path3.join(AUDIO_DIR, `${songId}${audioExt}`);
    fs3.renameSync(file.path, newPath);
    const updated = db.updateSong(songId, {
      fileSize: file.size,
      mimeType: file.mimetype,
      audioUrl: `/api/stream/${songId}?t=${Date.now()}`
    });
    broadcastCatalogEvent("catalog:changed", {
      action: "replace-audio",
      song: updated
    });
    res.json({ song: updated });
  }
);
app.put(
  "/api/admin/songs/:id/replace-cover",
  requireAdmin,
  upload.single("cover"),
  (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No cover file provided" });
    const songId = req.params.id;
    const coverUrl = `/uploads/covers/${file.filename}`;
    const updated = db.updateSong(songId, { coverUrl });
    broadcastCatalogEvent("catalog:changed", {
      action: "replace-cover",
      song: updated
    });
    res.json({ song: updated });
  }
);
app.patch("/api/admin/songs/:id/toggle-publish", requireAdmin, (req, res) => {
  const { isPublished, publicationDate } = req.body;
  const updates = {};
  if (typeof isPublished === "boolean") updates.isPublished = isPublished;
  if (publicationDate) updates.publicationDate = publicationDate;
  const updated = db.updateSong(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: "Song not found" });
  broadcastCatalogEvent("catalog:changed", {
    action: "toggle-publish",
    song: updated,
    message: updated.isPublished ? `"${updated.title}" is now published!` : `"${updated.title}" was unpublished.`
  });
  res.json({ song: updated });
});
app.patch("/api/admin/songs/:id/toggle-featured", requireAdmin, (req, res) => {
  const song = db.getSongById(req.params.id);
  if (!song) return res.status(404).json({ error: "Song not found" });
  const isFeatured = typeof req.body.isFeatured === "boolean" ? req.body.isFeatured : !song.isFeatured;
  const updated = db.updateSong(req.params.id, { isFeatured });
  if (!updated) return res.status(404).json({ error: "Song not found" });
  broadcastCatalogEvent("catalog:changed", {
    action: "toggle-featured",
    song: updated,
    message: updated.isFeatured ? `"${updated.title}" is now featured on Home!` : `"${updated.title}" was removed from Featured.`
  });
  res.json({ song: updated });
});
app.delete("/api/admin/songs/:id", requireAdmin, (req, res) => {
  const song = db.getSongById(req.params.id);
  const title = song?.title || "Song";
  const success = db.deleteSong(req.params.id);
  broadcastCatalogEvent("catalog:changed", {
    action: "delete",
    songId: req.params.id,
    message: `"${title}" was deleted.`
  });
  res.json({ success });
});
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path3.resolve(__dirname2, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path3.resolve(__dirname2, "dist/index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Rabha Tunes server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
export {
  broadcastCatalogEvent
};
