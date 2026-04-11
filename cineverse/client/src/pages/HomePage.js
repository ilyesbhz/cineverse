import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function MovieRow({ title, movies = [] }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <div className="movies-row">
        {movies.map((movie) => (
          <Link
            key={movie._id}
            to={`/movie/${movie._id}`}
            className="movie-card"
          >
            <img src={movie.thumbnail} alt={movie.title} loading="lazy" />
            <div className="card-overlay">
              <div className="card-title">{movie.title}</div>
              <div className="card-meta">
                <span>{movie.year}</span>
                <span>•</span>
                <span className="card-rating">{movie.rating?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { API } = useAuth();
  const [trending, setTrending] = useState([]);
  const [genres, setGenres] = useState([]);
  const [genreMovies, setGenreMovies] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      axios.get(`${API}/movies/trending`),
      axios.get(`${API}/movies/genres`),
    ])
      .then(async ([t, g]) => {
        if (!mounted) return;
        setTrending(t.data || []);

        const genreList = (g.data || []).filter(genre => genre !== 'All').slice(0, 5);
        setGenres(genreList);

        const genreMoviesData = {};
        for (const genre of genreList) {
          try {
            const res = await axios.get(`${API}/movies`, {
              params: { genre, sort: 'rating', limit: 5 }
            });
            genreMoviesData[genre] = res.data.movies || [];
          } catch (err) {
            genreMoviesData[genre] = [];
          }
        }

        if (mounted) {
          setGenreMovies(genreMoviesData);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setTrending([]);
        setGenres([]);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [API]);

  return (
    <main className="page" style={{ padding: '100px 24px 32px' }}>
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="spinner" />
          <p>Loading movies...</p>
        </div>
      ) : trending.length === 0 && genres.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <div className="empty-state-icon">🎬</div>
          <div className="empty-state-title">No movies available</div>
          <div className="empty-state-desc">Check back soon for new content in your favorite genres.</div>
        </div>
      ) : (
        <>
          {trending.length > 0 && <MovieRow title="Trending Now" movies={trending} />}
          {genres.map(genre => (
            <MovieRow key={genre} title={genre} movies={genreMovies[genre] || []} />
          ))}
        </>
      )}
    </main>
  );
}
