import React from 'react';
import {
  Play,
  Heart,
  Sparkles,
  Star,
  Shield,
  Flame,
  Radio,
  Clock,
  Disc,
  Music2,
  ChevronRight
} from 'lucide-react';
import { Song, Album, Artist, Playlist } from '../../types/music';
import { useAudio } from '../../context/AudioContext';
import { formatDuration } from '../../utils/format';

interface HomeViewProps {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  historySongs: Song[];
  onSelectTab: (tab: string) => void;
  onSelectAlbum?: (albumTitle: string) => void;
  onSelectArtist?: (artistName: string) => void;
  onSelectPlaylist?: (playlistId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  songs,
  albums,
  artists,
  playlists,
  historySongs,
  onSelectTab,
  onSelectAlbum,
  onSelectArtist,
  onSelectPlaylist
}) => {
  const { playSong, likedSongIds, toggleLike } = useAudio();

  // Get current greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Curate song sections
  // 1. Featured Tracks (all songs marked as featured by admin)
  const featuredSongs = songs.filter((s) => s.isFeatured);
  const featuredSpotlightSong = featuredSongs[0] || songs[0];

  // 2. New Releases (sorted newest publication date)
  const newReleases = [...songs]
    .sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime())
    .slice(0, 6);

  // 3. Popular Songs (sorted by play count)
  const popularSongs = [...songs]
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    .slice(0, 5);

  // 4. Rabha Heritage Spotlight (specific Rabha folk/festival songs)
  const rabhaFolkMusic = songs.filter(
    (s) =>
      s.genre.toLowerCase().includes('rabha') ||
      s.language.toLowerCase().includes('rabha') ||
      s.genre.toLowerCase().includes('festive')
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-10 pb-28">
      {/* Greeting & Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Stream indigenous Rabha and Northeast folk melodies free online.
          </p>
        </div>

        <button
          onClick={() => onSelectTab('search')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900/80 border border-neutral-800 rounded-xl transition-colors"
        >
          <span>Search catalog</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hero Featured Release Spotlight Banner */}
      {featuredSpotlightSong && (
        <section className="relative rounded-3xl overflow-hidden border border-neutral-800/80 bg-neutral-900/60 shadow-2xl">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl scale-110 pointer-events-none"
            style={{ backgroundImage: `url(${featuredSpotlightSong.coverUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none" />

          <div className="relative p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Album Cover */}
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/10 group">
              <img
                src={featuredSpotlightSong.coverUrl}
                alt={featuredSpotlightSong.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => playSong(featuredSpotlightSong, songs)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
                  <Play className="w-6 h-6 fill-black translate-x-0.5" />
                </div>
              </button>
            </div>

            {/* Info & Meta */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-emerald-400 font-semibold tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>FEATURED SPOTLIGHT</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {featuredSpotlightSong.title}
              </h2>

              <p className="text-base text-neutral-300 font-medium mt-1">
                {featuredSpotlightSong.artist} <span className="text-neutral-500">·</span> {featuredSpotlightSong.album}
              </p>

              {featuredSpotlightSong.description && (
                <p className="text-xs sm:text-sm text-neutral-400 mt-3 line-clamp-2 max-w-xl">
                  {featuredSpotlightSong.description}
                </p>
              )}

              {/* Zero-Pill Metadata Line */}
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-neutral-400 mt-4">
                <span>{featuredSpotlightSong.genre}</span>
                <span aria-hidden="true">·</span>
                <span>Language: {featuredSpotlightSong.language}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDuration(featuredSpotlightSong.duration)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
                <button
                  onClick={() => playSong(featuredSpotlightSong, songs)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all transform active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Stream Now</span>
                </button>

                <button
                  onClick={() => toggleLike(featuredSpotlightSong.id)}
                  className="p-3 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-emerald-400 transition-colors"
                  title="Like Song"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      likedSongIds.has(featuredSpotlightSong.id) ? 'fill-emerald-500 text-emerald-500' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dedicated Featured Songs Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Star className="w-4 h-4 fill-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Featured Songs
                </h2>
                <span className="text-xs text-emerald-400 font-mono">
                  ({featuredSongs.length})
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Handpicked Rabha folk masterworks and ceremonial recordings highlighted by platform curators.
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('search')}
            className="hidden sm:inline-block text-xs text-neutral-400 hover:text-emerald-400 transition-colors font-medium"
          >
            Explore all
          </button>
        </div>

        {featuredSongs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-900/30 border border-neutral-800/60 text-center space-y-2">
            <Star className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm font-semibold text-neutral-300">No Featured Songs Selected</p>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Administrators can mark any song as 'featured' in the Admin Studio using the star action, and it will be spotlighted right here.
            </p>
            <button
              onClick={() => onSelectTab('admin')}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Go to Admin Studio</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredSongs.map((song) => (
              <div
                key={'featured_' + song.id}
                className="group relative p-4 rounded-2xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/70 hover:border-emerald-500/40 transition-all shadow-lg hover:shadow-emerald-950/20 flex flex-col justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-md">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => playSong(song, featuredSongs)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
                        <Play className="w-5 h-5 fill-black translate-x-0.5" />
                      </div>
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 tracking-wider uppercase mb-1">
                      <Star className="w-3 h-3 fill-emerald-400" />
                      <span>Featured</span>
                    </div>

                    <h3
                      onClick={() => playSong(song, featuredSongs)}
                      className="text-sm font-bold text-white truncate group-hover:text-emerald-400 cursor-pointer transition-colors"
                    >
                      {song.title}
                    </h3>
                    <p className="text-xs text-neutral-300 truncate mt-0.5">
                      {song.artist}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {song.album}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-2">
                      <span>{song.genre}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDuration(song.duration)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800/60 text-xs">
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {song.playCount.toLocaleString()} plays
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleLike(song.id)}
                      className="p-1.5 text-neutral-400 hover:text-emerald-400 transition-colors"
                      title="Like song"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedSongIds.has(song.id) ? 'fill-emerald-500 text-emerald-500' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => playSong(song, featuredSongs)}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded-lg transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently Played History (if available) */}
      {historySongs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Recently Played</h2>
            </div>
            <button
              onClick={() => onSelectTab('library')}
              className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors font-medium"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {historySongs.slice(0, 6).map((song) => (
              <div
                key={'hist_' + song.id}
                onClick={() => playSong(song, historySongs)}
                className="group p-3 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 cursor-pointer transition-all flex flex-col"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-black translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xs font-semibold text-white truncate group-hover:text-emerald-400">
                  {song.title}
                </h3>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">{song.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* New Releases Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">New Releases</h2>
          </div>
          <button
            onClick={() => onSelectTab('search')}
            className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors font-medium"
          >
            Browse all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {newReleases.map((song) => (
            <div
              key={'new_' + song.id}
              onClick={() => playSong(song, songs)}
              className="group p-3.5 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 cursor-pointer transition-all flex flex-col"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-black translate-x-0.5" />
                  </div>
                </div>
              </div>
              <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-400">
                {song.title}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">{song.artist}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-2">
                <span>{song.genre}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDuration(song.duration)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Songs Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Popular on Rabha Tunes</h2>
          </div>
        </div>

        <div className="bg-neutral-900/40 rounded-2xl border border-neutral-800/60 divide-y divide-neutral-800/40 overflow-hidden">
          {popularSongs.map((song, idx) => (
            <div
              key={'pop_' + song.id}
              className="group flex items-center justify-between p-3.5 hover:bg-neutral-900/80 transition-colors"
            >
              <div
                onClick={() => playSong(song, songs)}
                className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
              >
                <span className="w-5 text-center text-xs font-mono text-neutral-400 group-hover:text-emerald-400 font-semibold">
                  {idx + 1}
                </span>
                <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-4 h-4 fill-white text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400">
                    {song.title}
                  </p>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    {song.artist} <span className="text-neutral-600">·</span> {song.album}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                <span className="hidden sm:inline text-xs text-neutral-400 font-mono">
                  {song.playCount.toLocaleString()} plays
                </span>
                <button
                  onClick={() => toggleLike(song.id)}
                  className="p-1 text-neutral-400 hover:text-emerald-400 transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      likedSongIds.has(song.id) ? 'fill-emerald-500 text-emerald-500' : ''
                    }`}
                  />
                </button>
                <span className="text-xs text-neutral-400 font-mono">
                  {formatDuration(song.duration)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dedicated Section: Indigenous Rabha Music & Festival Rhythms */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Rabha Cultural Heritage</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rabhaFolkMusic.map((song) => (
            <div
              key={'cult_' + song.id}
              onClick={() => playSong(song, songs)}
              className="group p-4 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 cursor-pointer transition-all flex items-center gap-4"
            >
              <img
                src={song.coverUrl}
                alt={song.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400">
                  {song.title}
                </h3>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{song.artist}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1.5">
                  <span>{song.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatDuration(song.duration)}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-neutral-800 group-hover:bg-emerald-500 text-white group-hover:text-black flex items-center justify-center transition-colors shrink-0">
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rabha Albums Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Albums</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => onSelectAlbum ? onSelectAlbum(album.title) : onSelectTab('albums')}
              className="group p-3.5 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 cursor-pointer transition-all flex flex-col"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-lg">
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-400">
                {album.title}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">{album.artist}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-2">
                <span>{album.releaseYear}</span>
                <span aria-hidden="true">·</span>
                <span>{album.genre}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Indigenous Artists */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Featured Artists</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {artists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => onSelectArtist ? onSelectArtist(artist.name) : onSelectTab('artists')}
              className="group p-4 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 cursor-pointer transition-all flex flex-col items-center text-center"
            >
              <div className="relative w-28 h-28 rounded-full overflow-hidden mb-3 shadow-xl border border-neutral-800">
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xs font-bold text-white truncate w-full group-hover:text-emerald-400">
                {artist.name}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5 w-full">
                {artist.genres[0] || 'Folk Artist'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Playlists */}
      {playlists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">Curated Playlists</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist ? onSelectPlaylist(pl.id) : onSelectTab('playlists')}
                className="group p-4 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 cursor-pointer transition-all flex items-center gap-4"
              >
                <img
                  src={pl.coverUrl || '/src/assets/images/album_rabha_echoes_1793373855412.jpg'}
                  alt={pl.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400">
                    {pl.name}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                    {pl.description || 'Collection of songs'}
                  </p>
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                    {pl.songIds.length} tracks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
