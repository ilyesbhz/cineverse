import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function WatchlistPage() {
  const { API, getHeaders } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios
      .get(`${API}/users/watchlist`, { headers: getHeaders() })
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]));
  }, [API]);

  return (
    <main className="page" style={{ padding: '100px 24px 32px' }}>
      <h1 className="section-title">My Watchlist</h1>
      {!items.length ? (
        <p style={{ color: 'var(--text-dim)' }}>Your watchlist is empty.</p>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
          {items.map((movie) => (
            <Link key={movie._id} to={`/movie/${movie._id}`} className="movie-card" style={{ height: '280px' }}>
              <img src={movie.thumbnail} alt={movie.title} loading="lazy" />
              <div className="card-overlay">
                <div className="card-title">{movie.title}</div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
