import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { WebSocketServer, WebSocket } from 'ws';
import { db, AUDIO_DIR, COVERS_DIR } from './src/server/db.ts';
import type { Song, Playlist } from './src/types/music.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

export function broadcastCatalogEvent(event: string, payload: any) {
  const message = JSON.stringify({
    event,
    data: payload,
    timestamp: new Date().toISOString()
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    event: 'connected',
    data: { message: 'Connected to Rabha Tunes Realtime Gateway' },
    timestamp: new Date().toISOString()
  }));
});

// Periodic check for scheduled releases transitioning to live
const publishedScheduledIds = new Set<string>();
setInterval(() => {
  const now = new Date();
  const allSongs = db.getAllSongsAdmin();
  for (const s of allSongs) {
    if (s.isPublished && new Date(s.publicationDate) <= now && !publishedScheduledIds.has(s.id)) {
      publishedScheduledIds.add(s.id);
      broadcastCatalogEvent('song:published', {
        song: s,
        message: `Scheduled track "${s.title}" is now available!`
      });
    }
  }
}, 10000);

// Increase JSON / payload limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
app.use('/uploads/covers', express.static(COVERS_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, AUDIO_DIR);
    } else if (file.fieldname === 'cover') {
      cb(null, COVERS_DIR);
    } else {
      cb(null, AUDIO_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = 'upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for high-res audio
  }
});

// Middleware for Admin Authentication
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || '';
  if (!db.verifyAdminToken(authHeader)) {
    return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
  }
  next();
};

// -------------------------------------------------------------
// STREAMING ENDPOINT WITH HTTP BYTE RANGE SUPPORT
// -------------------------------------------------------------
app.get('/api/stream/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const song = db.getSongById(id);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  // Check publication status for non-admin viewers
  const now = new Date();
  const isScheduled = new Date(song.publicationDate) > now;
  const authHeader = req.headers.authorization || '';
  const isAdmin = db.verifyAdminToken(authHeader);

  if ((!song.isPublished || isScheduled) && !isAdmin) {
    return res.status(403).json({ error: 'This song has not yet been published.' });
  }

  const filePath = db.getSongAudioFilePath(id);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found on server' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Determine mime type
  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'audio/mpeg';
  if (ext === '.wav') contentType = 'audio/wav';
  else if (ext === '.aac') contentType = 'audio/aac';
  else if (ext === '.ogg') contentType = 'audio/ogg';
  else if (ext === '.mp3') contentType = 'audio/mpeg';

  // Prevent downloading by setting inline disposition
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  if (range) {
    // Parse Range header e.g. "bytes=0-100000"
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
      return res.end();
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType
    });

    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// -------------------------------------------------------------
// PUBLIC MUSIC CATALOG ENDPOINTS
// -------------------------------------------------------------
app.get('/api/songs', (req: Request, res: Response) => {
  const { search, genre, language, artist, album } = req.query;
  const songs = db.getPublicSongs({
    search: search as string | undefined,
    genre: genre as string | undefined,
    language: language as string | undefined,
    artist: artist as string | undefined,
    album: album as string | undefined
  });
  res.json({ songs });
});

app.get('/api/songs/:id', (req: Request, res: Response) => {
  const song = db.getSongById(req.params.id);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }
  res.json({ song });
});

app.get('/api/artists', (_req: Request, res: Response) => {
  res.json({ artists: db.getArtists() });
});

app.get('/api/albums', (_req: Request, res: Response) => {
  res.json({ albums: db.getAlbums() });
});

app.get('/api/playlists', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'guest';
  res.json({ playlists: db.getPlaylists(userId) });
});

app.post('/api/playlists', (req: Request, res: Response) => {
  const { name, description, coverUrl, userId = 'guest', isPublic = true } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Playlist name is required' });
  }
  const newPl: Playlist = {
    id: 'pl_' + Date.now(),
    name: name.trim(),
    description: description || '',
    coverUrl: coverUrl || '/src/assets/images/album_rabha_echoes_1793373855412.jpg',
    userId,
    isPublic,
    songIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const created = db.createPlaylist(newPl);
  res.json({ playlist: created });
});

app.put('/api/playlists/:id', (req: Request, res: Response) => {
  const updated = db.updatePlaylist(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Playlist not found' });
  res.json({ playlist: updated });
});

app.delete('/api/playlists/:id', (req: Request, res: Response) => {
  const success = db.deletePlaylist(req.params.id);
  res.json({ success });
});

app.post('/api/playlists/:id/songs', (req: Request, res: Response) => {
  const { songId, action } = req.body; // action: 'add' | 'remove'
  const pl = db.getPlaylistById(req.params.id);
  if (!pl) return res.status(404).json({ error: 'Playlist not found' });

  let updatedSongs = [...pl.songIds];
  if (action === 'remove') {
    updatedSongs = updatedSongs.filter((id) => id !== songId);
  } else {
    if (!updatedSongs.includes(songId)) {
      updatedSongs.push(songId);
    }
  }
  const updated = db.updatePlaylist(pl.id, { songIds: updatedSongs });
  res.json({ playlist: updated });
});

// Likes & History
app.get('/api/liked', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'guest';
  res.json({ likedSongIds: db.getUserLikedSongIds(userId) });
});

app.post('/api/liked', (req: Request, res: Response) => {
  const { songId, userId = 'guest' } = req.body;
  const result = db.toggleLike(userId, songId);
  res.json(result);
});

app.get('/api/history', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'guest';
  res.json({ history: db.getUserHistory(userId) });
});

app.post('/api/history', (req: Request, res: Response) => {
  const { songId, userId = 'guest' } = req.body;
  db.recordPlayHistory(userId, songId);
  res.json({ success: true });
});

// -------------------------------------------------------------
// AUTH & ADMIN ONBOARDING
// -------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const admin = db.getAdminUser();

  // Simple and secure default credential or user-configured admin
  if (email === (admin?.email || 'admin@rabhatunes.com') && (password === 'rabha2026' || password === 'admin123')) {
    const token = 'rabha-admin-secret-token';
    return res.json({
      user: admin || {
        id: 'admin_1',
        name: 'Rabha Tunes Admin',
        email: 'admin@rabhatunes.com',
        role: 'admin'
      },
      token
    });
  }

  // Listener login (guest sign-in)
  if (email && email.includes('@')) {
    return res.json({
      user: {
        id: 'usr_' + Buffer.from(email).toString('hex').slice(0, 8),
        name: email.split('@')[0],
        email,
        role: 'listener'
      },
      token: 'listener-token-' + Date.now()
    });
  }

  res.status(401).json({ error: 'Invalid login credentials. Use admin@rabhatunes.com and rabha2026' });
});

app.post('/api/auth/setup-admin', (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const result = db.createAdmin(name, email);
  res.json(result);
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const isAdmin = db.verifyAdminToken(authHeader);
  if (isAdmin) {
    const admin = db.getAdminUser();
    return res.json({ user: admin, role: 'admin' });
  }
  res.json({ user: null, role: 'guest' });
});

// -------------------------------------------------------------
// ADMIN MANAGEMENT & UPLOAD SUITE
// -------------------------------------------------------------
app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  res.json({ stats: db.getAdminStats() });
});

app.get('/api/admin/songs', requireAdmin, (_req: Request, res: Response) => {
  res.json({ songs: db.getAllSongsAdmin() });
});

// Single song upload with multer
app.post(
  '/api/admin/upload-song',
  requireAdmin,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const audioFile = files?.['audio']?.[0];
    const coverFile = files?.['cover']?.[0];

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
      return res.status(400).json({ error: 'Title and artist are required' });
    }

    if (!audioFile) {
      return res.status(400).json({ error: 'An audio file (MP3, WAV, or AAC) is required' });
    }

    const songId = 'song_' + Date.now();

    // Rename audio file to songId
    const audioExt = path.extname(audioFile.originalname) || '.mp3';
    const finalAudioPath = path.join(AUDIO_DIR, `${songId}${audioExt}`);
    fs.renameSync(audioFile.path, finalAudioPath);

    // Cover art handling
    let finalCoverUrl = explicitCoverUrl || '/src/assets/images/album_rabha_echoes_1793373855412.jpg';
    if (coverFile) {
      finalCoverUrl = `/uploads/covers/${coverFile.filename}`;
    }

    const nowIso = new Date().toISOString();
    const parsedDuration = parseInt(durationRaw, 10) || 120;

    const newSong: Song = {
      id: songId,
      title: title.trim(),
      artist: artist.trim(),
      album: (album || 'Single').trim(),
      genre: genre || 'Rabha Traditional',
      language: language || 'Rabha',
      description: description || '',
      releaseDate: releaseDate || nowIso.split('T')[0],
      publicationDate: publicationDate || nowIso,
      coverUrl: finalCoverUrl,
      audioUrl: `/api/stream/${songId}`,
      duration: parsedDuration,
      lyrics: lyrics || '',
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isPublished: isPublished === 'true' || isPublished === true,
      playCount: 0,
      likesCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      fileSize: audioFile.size,
      mimeType: audioFile.mimetype
    };

    const added = db.addSong(newSong);
    broadcastCatalogEvent('catalog:changed', {
      action: 'add',
      song: added,
      message: `New song "${added.title}" uploaded!`
    });
    res.json({ song: added });
  }
);

// Batch upload endpoint
app.post(
  '/api/admin/batch-upload',
  requireAdmin,
  upload.array('audioFiles', 20),
  (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No audio files provided' });
    }

    const defaultArtist = req.body.defaultArtist || 'Rongmon Rabha';
    const defaultAlbum = req.body.defaultAlbum || 'Rabha Heritage Collection';
    const defaultGenre = req.body.defaultGenre || 'Rabha Folk Fusion';
    const defaultLanguage = req.body.defaultLanguage || 'Rabha';
    const publishNow = req.body.publishNow === 'true' || req.body.publishNow === true;

    const addedSongs: Song[] = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const songId = 'song_' + (Date.now() + i);
      const audioExt = path.extname(file.originalname) || '.mp3';
      const finalAudioPath = path.join(AUDIO_DIR, `${songId}${audioExt}`);
      fs.renameSync(file.path, finalAudioPath);

      // Extract clean title from filename
      const cleanTitle = path.basename(file.originalname, audioExt).replace(/[_-]/g, ' ');

      const song: Song = {
        id: songId,
        title: cleanTitle,
        artist: defaultArtist,
        album: defaultAlbum,
        genre: defaultGenre,
        language: defaultLanguage,
        releaseDate: nowIso.split('T')[0],
        publicationDate: nowIso,
        coverUrl: '/src/assets/images/album_rabha_echoes_1793373855412.jpg',
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

    broadcastCatalogEvent('catalog:changed', {
      action: 'batch',
      count: addedSongs.length,
      message: `${addedSongs.length} new songs added to catalog!`
    });

    res.json({ uploadedCount: addedSongs.length, songs: addedSongs });
  }
);

// Update song metadata
app.put('/api/admin/songs/:id', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateSong(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Song not found' });
  broadcastCatalogEvent('catalog:changed', {
    action: 'update',
    song: updated
  });
  res.json({ song: updated });
});

// Replace song audio
app.put(
  '/api/admin/songs/:id/replace-audio',
  requireAdmin,
  upload.single('audio'),
  (req: Request, res: Response) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No audio file provided' });

    const songId = req.params.id;
    const song = db.getSongById(songId);
    if (!song) return res.status(404).json({ error: 'Song not found' });

    // Remove old audio files
    try {
      const oldFiles = fs.readdirSync(AUDIO_DIR).filter((f) => f.startsWith(songId));
      for (const f of oldFiles) fs.unlinkSync(path.join(AUDIO_DIR, f));
    } catch {
      // ignore
    }

    const audioExt = path.extname(file.originalname) || '.mp3';
    const newPath = path.join(AUDIO_DIR, `${songId}${audioExt}`);
    fs.renameSync(file.path, newPath);

    const updated = db.updateSong(songId, {
      fileSize: file.size,
      mimeType: file.mimetype,
      audioUrl: `/api/stream/${songId}?t=${Date.now()}`
    });

    broadcastCatalogEvent('catalog:changed', {
      action: 'replace-audio',
      song: updated
    });

    res.json({ song: updated });
  }
);

// Replace song cover
app.put(
  '/api/admin/songs/:id/replace-cover',
  requireAdmin,
  upload.single('cover'),
  (req: Request, res: Response) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No cover file provided' });

    const songId = req.params.id;
    const coverUrl = `/uploads/covers/${file.filename}`;
    const updated = db.updateSong(songId, { coverUrl });

    broadcastCatalogEvent('catalog:changed', {
      action: 'replace-cover',
      song: updated
    });

    res.json({ song: updated });
  }
);

// Toggle publish or update scheduled publication
app.patch('/api/admin/songs/:id/toggle-publish', requireAdmin, (req: Request, res: Response) => {
  const { isPublished, publicationDate } = req.body;
  const updates: Partial<Song> = {};
  if (typeof isPublished === 'boolean') updates.isPublished = isPublished;
  if (publicationDate) updates.publicationDate = publicationDate;

  const updated = db.updateSong(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Song not found' });

  broadcastCatalogEvent('catalog:changed', {
    action: 'toggle-publish',
    song: updated,
    message: updated.isPublished ? `"${updated.title}" is now published!` : `"${updated.title}" was unpublished.`
  });

  res.json({ song: updated });
});

// Toggle featured status
app.patch('/api/admin/songs/:id/toggle-featured', requireAdmin, (req: Request, res: Response) => {
  const song = db.getSongById(req.params.id);
  if (!song) return res.status(404).json({ error: 'Song not found' });
  const isFeatured = typeof req.body.isFeatured === 'boolean' ? req.body.isFeatured : !song.isFeatured;
  const updated = db.updateSong(req.params.id, { isFeatured });
  if (!updated) return res.status(404).json({ error: 'Song not found' });

  broadcastCatalogEvent('catalog:changed', {
    action: 'toggle-featured',
    song: updated,
    message: updated.isFeatured ? `"${updated.title}" is now featured on Home!` : `"${updated.title}" was removed from Featured.`
  });

  res.json({ song: updated });
});

// Delete song
app.delete('/api/admin/songs/:id', requireAdmin, (req: Request, res: Response) => {
  const song = db.getSongById(req.params.id);
  const title = song?.title || 'Song';
  const success = db.deleteSong(req.params.id);

  broadcastCatalogEvent('catalog:changed', {
    action: 'delete',
    songId: req.params.id,
    message: `"${title}" was deleted.`
  });

  res.json({ success });
});

// -------------------------------------------------------------
// VITE OR STATIC FRONTEND INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Rabha Tunes server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
