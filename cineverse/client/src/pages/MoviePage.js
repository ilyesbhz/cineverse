import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from '../components/VideoPlayer.jsx';

export default function MoviePage() {
  const { API, user, getHeaders } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    api
      .get(`/movies/${id}`)
      .then((res) => {
        setMovie(res.data);
      })
      .catch(() => setError('Movie not found'));

    // Check watchlist status whenever id changes
    if (user) {
      checkWatchlistStatus();
    }
  }, [id, user]);

  const checkWatchlistStatus = async () => {
    try {
      const res = await api.get(`/users/watchlist`);
      const movieIds = res.data.map(m => m._id);
      setInWatchlist(movieIds.includes(id));
    } catch (err) {
      console.error('Failed to check watchlist:', err);
    }
  };

  const handlePlayClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setIsPlaying(true);
  };

  const handleWatchlistClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    toggleWatchlist();
  };

  const toggleWatchlist = async () => {
    if (!movie || loading) return;
    setLoading(true);
    try {
      const res = await api.post(`/users/watchlist/${id}`, {});
      setInWatchlist(res.data.added);
    } catch (err) {
      console.error('Failed to update watchlist:', err);
      alert('Failed to update watchlist');
    } finally {
      setLoading(false);
    }
  };

  if (error) return <main className="page" style={{ padding: '100px 24px' }}>{error}</main>;
  if (!movie) return <main className="page" style={{ padding: '100px 24px' }}>Loading movie...</main>;

  if (isPlaying && movie.videoUrl) {
    return (
      <main style={{
        paddingTop: '68px',
        padding: '20px',
        background: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          position: 'relative'
        }}>
          <VideoPlayer
            videoUrl={movie.videoUrl}
            title={movie.title}
            thumbnail={movie.thumbnail}
            qualityOptions={[
              { label: 'Auto', url: movie.videoUrl, type: 'video/mp4' },
              { label: '720p', url: movie.videoUrl, type: 'video/mp4' },
              { label: '480p', url: movie.videoUrl, type: 'video/mp4' },
              { label: '360p', url: movie.videoUrl, type: 'video/mp4' }
            ]}
            subtitles={[
              { language: 'en', label: 'English', url: '#', default: true },
              { language: 'es', label: 'Spanish', url: '#' },
              { language: 'fr', label: 'French', url: '#' }
            ]}
            onPlaybackStart={() => {
              if (user) {
                api.post(`/users/history/${movie._id}`, {}).catch(() => {});
              }
            }}
            closeButton={
              <button
                onClick={() => setIsPlaying(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(229, 9, 20, 0.9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  zIndex: 200,
                  fontSize: '0.9rem',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s ease',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(229, 9, 20, 1)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(229, 9, 20, 0.9)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ✕ Close
              </button>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="page" style={{ paddingTop: '68px' }}>
      <div
        style={{
          minHeight: '46vh',
          backgroundImage: `linear-gradient(to top, rgba(5,5,5,1), rgba(5,5,5,0.25)), url(${movie.backdrop || movie.thumbnail})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'end',
          padding: '32px 24px',
          position: 'relative'
        }}
      >
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', letterSpacing: '2px', fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '16px' }}>
            {movie.title}
          </h1>
          <div style={{ color: 'var(--text-dim)', marginBottom: '20px', fontSize: '0.95rem' }}>
            {movie.year} • {movie.duration || '-'} min • ⭐ {movie.rating?.toFixed(1) || 'N/A'}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePlayClick}
              style={{
                background: 'var(--red)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: '12px 32px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(229, 9, 20, 0.3)',
                letterSpacing: '0.5px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f52028';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(229, 9, 20, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--red)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(229, 9, 20, 0.3)';
              }}
              title={user ? 'Play movie' : 'Sign in to play'}
            >
              <span style={{ fontSize: '1.2rem' }}>▶</span>
              Play
            </button>

            <button
              onClick={handleWatchlistClick}
              disabled={loading}
              style={{
                background: inWatchlist ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: inWatchlist ? 'var(--red)' : 'var(--text)',
                border: inWatchlist ? '1px solid var(--red)' : '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(8px)',
                opacity: loading ? 0.7 : 1,
                letterSpacing: '0.5px',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = inWatchlist ? 'rgba(229, 9, 20, 0.3)' : 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'var(--red)';
                  e.currentTarget.style.color = 'var(--red)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = inWatchlist ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = inWatchlist ? 'var(--red)' : 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title={user ? (inWatchlist ? 'Remove from watchlist' : 'Add to watchlist') : 'Sign in to add to watchlist'}
            >
              <span style={{ fontSize: '1.2rem' }}>{inWatchlist ? '✓' : '+'}</span>
              {inWatchlist ? 'In Watchlist' : 'Add to List'}
            </button>
          </div>
        </div>
      </div>

      {/* Movie Details */}
      <section style={{ padding: '32px 24px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>About</h2>
        <p style={{ maxWidth: '900px', color: 'var(--text-dim)', lineHeight: 1.8, fontSize: '0.95rem' }}>
          {movie.description}
        </p>

        {/* Additional Info */}
        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', maxWidth: '900px' }}>
          {[
            { label: 'Director', value: movie.director || 'N/A' },
            { label: 'Genre', value: movie.genre?.join(', ') || 'N/A' },
            { label: 'Language', value: movie.language || 'N/A' },
            { label: 'Rating', value: movie.maturityRating || 'N/A' }
          ].map((item, idx) => (
            <div key={idx}>
              <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)', marginBottom: '6px' }}>
                {item.label}
              </div>
              <div style={{ color: 'var(--text)', fontWeight: '500' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
