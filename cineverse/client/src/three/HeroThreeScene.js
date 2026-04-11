import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const APP_API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

const HERO_COLORS = ['#e50914', '#4466ff', '#cc44aa', '#00a896', '#f39c12'];

const toTagline = (description) => {
  if (!description) return 'Now streaming on CineVerse.';
  return description.length > 100 ? `${description.slice(0, 100)}...` : description;
};

const mapApiMovie = (movie, index) => ({
  title: movie.title,
  tagline: toTagline(movie.description),
  genres: Array.isArray(movie.genre) ? movie.genre : [],
  rating: Number(movie.rating || 0),
  year: movie.year,
  backdrop: movie.backdrop || movie.thumbnail || '',
  poster: movie.thumbnail || movie.backdrop || '',
  color: HERO_COLORS[index % HERO_COLORS.length],
});

async function fetchFeatured() {
  try {
    const [featuredRes, trendingRes] = await Promise.all([
      fetch(`${APP_API_BASE}/movies/featured`),
      fetch(`${APP_API_BASE}/movies/trending`),
    ]);

    const featured = featuredRes.ok ? await featuredRes.json() : [];
    const trending = trendingRes.ok ? await trendingRes.json() : [];
    const merged = [...(featured || []), ...(trending || [])];
    const unique = Array.from(new Map(merged.map((m) => [m._id, m])).values()).slice(0, 5);

    if (unique.length) {
      return unique.map(mapApiMovie);
    }
  } catch {
    // Continue to TMDB fallback.
  }

  if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') return null;
  try {
    const res = await fetch(`${TMDB_BASE}/trending/all/week?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    const items = (data.results || []).filter(i => i.backdrop_path && i.poster_path).slice(0, 5);
    return items.map(item => ({
      title: item.title || item.name,
      tagline: toTagline(item.overview),
      genres: [],
      rating: Number(item.vote_average?.toFixed(1) || 0),
      year: (item.release_date || item.first_air_date || '').slice(0, 4),
      backdrop: `${BACKDROP_BASE}${item.backdrop_path}`,
      poster: `${POSTER_BASE}${item.poster_path}`,
      color: '#e50914',
    }));
  } catch {
    return null;
  }
}

function StarRating({ value }) {
  const stars = Math.round((value / 10) * 5);
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: i < stars ? '#e50914' : 'rgba(255,255,255,0.25)',
          transition: 'background 0.3s',
        }} />
      ))}
      <span style={{ marginLeft: 6, fontSize: 13, color: '#fff', fontFamily: 'monospace' }}>
        {value}/10
      </span>
    </div>
  );
}

export default function HeroThreeScene() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchFeatured().then(data => {
      setItems(data || []);
      setLoaded(true);
    });
  }, []);

  // Auto-rotate every 7s
  useEffect(() => {
    if (!items) return;
    timerRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % items.length);
        setVisible(true);
      }, 400);
    }, 7000);
    return () => clearInterval(timerRef.current);
  }, [items]);

  const goTo = (i) => {
    if (i === index) return;
    clearInterval(timerRef.current);
    setVisible(false);
    setTimeout(() => { setIndex(i); setVisible(true); }, 400);
  };

  const promptAuthRedirect = () => {
    navigate('/auth');
  };

  const handlePlay = () => {
    if (!user) {
      promptAuthRedirect();
      return;
    }
    navigate('/browse');
  };

  const handleAddToList = () => {
    if (!user) {
      promptAuthRedirect();
      return;
    }
    navigate('/watchlist');
  };

  if (!items || !items.length) return null;
  const item = items[index];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

      {/* Backdrop image (blurred, behind content) */}
      {item.backdrop && (
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          opacity: visible ? 0.18 : 0, transition: 'opacity 0.6s ease',
        }}>
          <img src={item.backdrop} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: 'blur(8px) saturate(1.5)', transform: 'scale(1.1)',
          }} />
        </div>
      )}

      {/* Main card */}
      <div style={{
        display: 'flex',
        gap: 32,
        alignItems: 'flex-end',
        maxWidth: 680,
        width: '100%',
        padding: '0 24px',
        opacity: visible && loaded ? 1 : 0,
        transform: visible && loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>

        {/* Poster */}
        <div style={{
          flexShrink: 0,
          width: 130,
          height: 196,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)`,
          position: 'relative',
        }}>
          {item.poster ? (
            <img src={item.poster} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(160deg, ${item.color}88, #000)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 13, letterSpacing: 3, color: '#fff' }}>
                {item.title}
              </span>
            </div>
          )}

          {/* Poster shine */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {item.year && (
              <span style={{ fontSize: 11, letterSpacing: 2, color: '#fff', fontFamily: 'monospace' }}>
                {item.year}
              </span>
            )}
            {item.genres.slice(0, 2).map(g => (
              <span key={g} style={{
                fontSize: 10, letterSpacing: 1.5,
                padding: '3px 8px', borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                textTransform: 'uppercase',
              }}>{g}</span>
            ))}
          </div>

          {/* Title */}
          <h2 style={{
            margin: '0 0 8px',
            fontFamily: "'Bebas Neue', 'Impact', sans-serif",
            fontSize: 36,
            fontWeight: 400,
            letterSpacing: 3,
            color: '#fff',
            lineHeight: 1,
            textShadow: `0 0 40px ${item.color}66`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {item.title}
          </h2>

          {/* Tagline */}
          <p style={{
            margin: '0 0 12px',
            fontSize: 'clamp(0.75rem, 1.5vw, 12px)',
            color: '#fff',
            lineHeight: 1.5,
            fontStyle: 'italic',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.tagline}
          </p>

          {/* Rating */}
          {item.rating && <StarRating value={item.rating} />}

          {/* Play button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', marginTop: 16, flexWrap: 'wrap' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 8px)',
              padding: 'clamp(8px, 1.5vw, 9px) clamp(14px, 3vw, 20px)',
              background: item.color,
              border: 'none', borderRadius: 5,
              color: '#fff', fontSize: 'clamp(0.75rem, 2vw, 12px)', letterSpacing: 'clamp(1px, 2vw, 2px)',
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              cursor: 'pointer',
              boxShadow: `0 4px 24px ${item.color}66`,
              transition: 'transform 0.15s, box-shadow 0.15s',
              minHeight: '44px',
            }}
              onClick={handlePlay}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                <path d="M0 0L10 6L0 12Z" />
              </svg>
              PLAY
            </button>

            <button style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 8px)',
              padding: 'clamp(8px, 1.5vw, 9px) clamp(12px, 2.5vw, 16px)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 5,
              color: '#fff', fontSize: 'clamp(0.75rem, 2vw, 12px)', letterSpacing: 'clamp(1px, 2vw, 2px)',
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              cursor: 'pointer',
              transition: 'background 0.15s',
              minHeight: '44px',
            }}
              onClick={handleAddToList}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            >
              + LIST
            </button>
          </div>
        </div>
      </div>

      {/* Dot navigation */}
      <div style={{
        position: 'absolute', bottom: 'clamp(12px, 3vw, 24px)',
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 'clamp(6px, 1.5vw, 8px)',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '90vw'
      }}>
        {items.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === index ? 22 : 7,
            height: 7, borderRadius: 4,
            background: i === index ? '#e50914' : 'rgba(255,255,255,0.3)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'width 0.3s ease, background 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  );
}