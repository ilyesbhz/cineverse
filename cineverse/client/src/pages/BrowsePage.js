import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function BrowsePage() {
  const { API } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'popular';
  const genre = searchParams.get('genre') || 'All';

  useEffect(() => {
    axios
      .get(`${API}/movies/genres`)
      .then((res) => setGenres(res.data || ['All']))
      .catch(() => setGenres(['All']));
  }, [API]);

  useEffect(() => {
    setLoading(true);
    const params = { sort, search, limit: 50 };
    if (genre && genre !== 'All') params.genre = genre;

    axios
      .get(`${API}/movies`, { params })
      .then((res) => setMovies(res.data.movies || []))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [API, search, sort, genre]);

  const setSort = (nextSort) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', nextSort);
    setSearchParams(next);
  };

  const setGenreFilter = (nextGenre) => {
    const next = new URLSearchParams(searchParams);
    next.set('genre', nextGenre);
    setSearchParams(next);
  };

  return (
    <main className="page" style={{ padding: '100px 24px 32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 className="section-title" style={{ marginBottom: 0 }}>Browse</h1>
        </div>

        {/* Sort Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)', alignSelf: 'center' }}>Sort by:</span>
          {['popular', 'rating', 'year'].map((item) => (
            <button
              key={item}
              className={`genre-pill ${sort === item ? 'active' : ''}`}
              onClick={() => setSort(item)}
              style={{ textTransform: 'capitalize' }}
            >
              {item === 'popular' ? '🔥 Popular' : item === 'rating' ? '⭐ Rating' : '📅 Year'}
            </button>
          ))}
        </div>

        {/* Genre Filters */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)', marginBottom: '12px' }}>Genre</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {genres.map((genreItem) => (
              <button
                key={genreItem}
                className={`genre-pill ${genre === genreItem ? 'active' : ''}`}
                onClick={() => setGenreFilter(genreItem)}
              >
                {genreItem}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Display */}
        {(search || (genre && genre !== 'All')) && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(229, 9, 20, 0.1)', border: '1px solid rgba(229, 9, 20, 0.2)', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Active filters: </span>
            {search && (
              <span style={{ display: 'inline-block', background: 'var(--red)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', marginRight: '8px' }}>
                Search: "{search}"
              </span>
            )}
            {genre && genre !== 'All' && (
              <span style={{ display: 'inline-block', background: 'var(--red)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                Genre: {genre}
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div className="spinner" />
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>Loading movies...</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            Found <strong style={{ color: 'var(--text)' }}>{movies.length}</strong> {movies.length === 1 ? 'movie' : 'movies'}
          </div>
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {movies.length > 0 ? (
              movies.map((movie) => (
                <Link
                  key={movie._id}
                  to={`/movie/${movie._id}`}
                  className="movie-card"
                  style={{
                    height: '280px',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <img src={movie.thumbnail} alt={movie.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div className="card-overlay">
                    <div className="card-title" style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px' }}>{movie.title}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      <span>⭐ {movie.rating?.toFixed(1) || 'N/A'}</span>
                      <span>•</span>
                      <span>{movie.year}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state-icon">🎬</div>
                <div className="empty-state-title">No movies found</div>
                <div className="empty-state-desc">Try adjusting your filters or search terms</div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
