import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Play, Heart, Disc, Music } from 'lucide-react';
import { Song, Album, Artist } from '../../types/music';
import { useAudio } from '../../context/AudioContext';
import { formatDuration } from '../../utils/format';

interface SearchViewProps {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  initialQuery?: string;
  onSelectAlbum?: (albumTitle: string) => void;
  onSelectArtist?: (artistName: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  songs,
  albums,
  artists,
  initialQuery = '',
  onSelectAlbum,
  onSelectArtist
}) => {
  const { playSong, likedSongIds, toggleLike } = useAudio();

  const [query, setQuery] = useState<string>(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rabha_search_history');
      return saved ? JSON.parse(saved) : ['Flute', 'Goalpara', 'Hacha', 'Rongmon'];
    } catch {
      return [];
    }
  });

  const genres = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => set.add(s.genre));
    return ['All', ...Array.from(set)];
  }, [songs]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => set.add(s.language));
    return ['All', ...Array.from(set)];
  }, [songs]);

  // Execute search filter
  const filteredSongs = useMemo(() => {
    const q = query.toLowerCase().trim();
    return songs.filter((s) => {
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q);

      const matchesGenre = selectedGenre === 'All' || s.genre === selectedGenre;
      const matchesLanguage = selectedLanguage === 'All' || s.language === selectedLanguage;

      return matchesQuery && matchesGenre && matchesLanguage;
    });
  }, [songs, query, selectedGenre, selectedLanguage]);

  // Filter albums and artists matching search
  const filteredAlbums = useMemo(() => {
    if (!query.trim()) return albums;
    const q = query.toLowerCase().trim();
    return albums.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q));
  }, [albums, query]);

  const filteredArtists = useMemo(() => {
    if (!query.trim()) return artists;
    const q = query.toLowerCase().trim();
    return artists.filter((a) => a.name.toLowerCase().includes(q));
  }, [artists, query]);

  const addSearchHistory = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const next = [clean, ...searchHistory.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    setSearchHistory(next);
    localStorage.setItem('rabha_search_history', JSON.stringify(next));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('rabha_search_history');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 pb-28">
      {/* Search Input Bar */}
      <div className="relative max-w-2xl">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addSearchHistory(query);
            }}
            placeholder="Search songs, artists, albums, or genres..."
            className="w-full pl-12 pr-10 py-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 p-1 text-neutral-400 hover:text-white rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Segmented Filter Controls */}
      <div className="space-y-3">
        {/* Genre buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] mr-2 shrink-0">
            Genre:
          </span>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                selectedGenre === g
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Language buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] mr-2 shrink-0">
            Language:
          </span>
          {languages.map((l) => (
            <button
              key={l}
              onClick={() => setSelectedLanguage(l)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                selectedLanguage === l
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Searches */}
      {!query && searchHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold tracking-wider">
            <span>RECENT SEARCHES</span>
            <button
              onClick={clearHistory}
              className="hover:text-rose-400 transition-colors text-[11px]"
            >
              Clear history
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <SearchIcon className="w-3 h-3 text-neutral-400" />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-8">
        {/* Top Matching Songs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {query ? `Songs matching "${query}"` : 'All Available Tracks'}
            </h2>
            <span className="text-xs text-neutral-400 font-mono">
              {filteredSongs.length} tracks found
            </span>
          </div>

          {filteredSongs.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900/30 rounded-2xl border border-neutral-800/60 p-8">
              <SearchIcon className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No tracks match your search</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Try searching for other keywords like "Echoes", "Goalpara", "Bamboo", or select "All" genres.
              </p>
              {(selectedGenre !== 'All' || selectedLanguage !== 'All' || query) && (
                <button
                  onClick={() => {
                    setQuery('');
                    setSelectedGenre('All');
                    setSelectedLanguage('All');
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <div className="bg-neutral-900/40 rounded-2xl border border-neutral-800/60 divide-y divide-neutral-800/40 overflow-hidden">
              {filteredSongs.map((song, idx) => (
                <div
                  key={song.id}
                  className="group flex items-center justify-between p-3.5 hover:bg-neutral-900/80 transition-colors"
                >
                  <div
                    onClick={() => playSong(song, filteredSongs)}
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
                    <span className="hidden md:inline text-xs text-neutral-400">
                      {song.genre}
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
          )}
        </div>

        {/* Albums matching query */}
        {filteredAlbums.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Albums</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => onSelectAlbum && onSelectAlbum(album.title)}
                  className="group p-3 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 cursor-pointer transition-all flex flex-col"
                >
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full aspect-square rounded-xl object-cover mb-2"
                    referrerPolicy="no-referrer"
                  />
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-emerald-400">
                    {album.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">{album.artist}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artists matching query */}
        {filteredArtists.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Artists</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredArtists.map((artist) => (
                <div
                  key={artist.id}
                  onClick={() => onSelectArtist && onSelectArtist(artist.name)}
                  className="group p-3 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-800/60 cursor-pointer transition-all flex flex-col items-center text-center"
                >
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-20 h-20 rounded-full object-cover mb-2 border border-neutral-800"
                    referrerPolicy="no-referrer"
                  />
                  <h3 className="text-xs font-bold text-white truncate w-full group-hover:text-emerald-400">
                    {artist.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 truncate w-full mt-0.5">
                    {artist.genres[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
