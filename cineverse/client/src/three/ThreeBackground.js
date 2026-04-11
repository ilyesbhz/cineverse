import { useEffect, useRef, useState } from 'react';

const APP_API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

// Fallback gradient posters if no API key is provided
const PLACEHOLDER_COLORS = [
  ['#e50914','#b20710'],['#1a1a2e','#e50914'],['#0f3460','#533483'],
  ['#16213e','#0f3460'],['#e94560','#0f3460'],['#533483','#e94560'],
  ['#1b1b2f','#e94560'],['#162447','#1f4068'],['#1f4068','#1b262c'],
  ['#950740','#c72b2b'],['#2d132c','#ee4540'],['#1b1b2b','#950740'],
];

const DEFAULT_PLACEHOLDER_TITLE = 'CINEVERSE';

async function fetchFallbackTitles() {
  try {
    const res = await fetch(`${APP_API_BASE}/movies?sort=popular&limit=40`);
    if (res.ok) {
      const data = await res.json();
      const titles = (data?.movies || []).map((m) => m.title).filter(Boolean);
      if (titles.length) return titles;
    }
  } catch {
    // Continue to TMDB fallback.
  }

  if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') return [];
  try {
    const res = await fetch(`${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&page=1`);
    const data = await res.json();
    return (data?.results || []).map((m) => m.title).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchPosters() {
  // Prefer backend API movies so this background matches your app catalog.
  try {
    const res = await fetch(`${APP_API_BASE}/movies?sort=popular&limit=60`);
    if (res.ok) {
      const data = await res.json();
      const movies = (data?.movies || [])
        .filter((m) => m.thumbnail || m.backdrop)
        .map((m) => ({
          url: m.thumbnail || m.backdrop,
          title: m.title || '',
        }));

      if (movies.length) return movies;
    }
  } catch {
    // Fall through to TMDB/placeholder fallback.
  }

  if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') return null;
  try {
    const [movies, shows] = await Promise.all([
      fetch(`${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&page=1`).then(r => r.json()),
      fetch(`${TMDB_BASE}/tv/popular?api_key=${TMDB_API_KEY}&page=1`).then(r => r.json()),
    ]);
    const all = [
      ...(movies.results || []).filter(m => m.poster_path),
      ...(shows.results || []).filter(s => s.poster_path),
    ];
    return all.map(item => ({
      url: `${POSTER_BASE}${item.poster_path}`,
      title: item.title || item.name || '',
    }));
  } catch {
    return null;
  }
}

function PlaceholderPoster({ index, style, title }) {
  const colors = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
  return (
    <div style={{
      ...style,
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '10px',
      boxSizing: 'border-box',
    }}>
      <span style={{
        fontFamily: "'Bebas Neue', 'Impact', sans-serif",
        fontSize: '11px',
        letterSpacing: '2px',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
      }}>{title || DEFAULT_PLACEHOLDER_TITLE}</span>
    </div>
  );
}

function MarqueeRow({ items, direction = 1, speed = 30, rowIndex }) {
  const trackRef = useRef(null);
  const posRef = useRef(0);
  const animRef = useRef(null);
  const lastTimeRef = useRef(null);

  const POSTER_W = 120;
  const POSTER_H = 180;
  const GAP = 10;
  const ITEM_W = POSTER_W + GAP;

  // Duplicate items for seamless loop
  const doubled = [...items, ...items, ...items];

  useEffect(() => {
    const totalW = items.length * ITEM_W;
    // Start offset for alternating rows
    posRef.current = direction === -1 ? -totalW * 0.5 : 0;

    const tick = (time) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      posRef.current -= direction * speed * dt;

      const totalW = items.length * ITEM_W;
      if (direction === 1 && posRef.current <= -totalW) posRef.current += totalW;
      if (direction === -1 && posRef.current >= 0) posRef.current -= totalW;

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [items, direction, speed, ITEM_W]);

  const posterStyle = {
    width: POSTER_W,
    height: POSTER_H,
    flexShrink: 0,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: GAP,
    position: 'relative',
  };

  return (
    <div style={{ overflow: 'hidden', width: '100%', marginBottom: GAP }}>
      <div ref={trackRef} style={{ display: 'flex', willChange: 'transform' }}>
        {doubled.map((item, i) => (
          <div key={i} style={posterStyle}>
            {item.url ? (
              <img
                src={item.url}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
                draggable={false}
              />
            ) : (
              <PlaceholderPoster
                index={(rowIndex * 7 + i) % PLACEHOLDER_COLORS.length}
                style={{ width: '100%', height: '100%' }}
                title={item.title}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ThreeBackground({ variant = 'stars' }) {
  const [posters, setPosters] = useState(null);
  const [fallbackTitles, setFallbackTitles] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([fetchPosters(), fetchFallbackTitles()]).then(([posterData, titleData]) => {
      setPosters(posterData);
      setFallbackTitles(titleData || []);
      setLoaded(true);
    });
  }, []);

  // Build placeholder items always available
  const titlePool = fallbackTitles.length ? fallbackTitles : [DEFAULT_PLACEHOLDER_TITLE];
  const placeholderItems = Array.from({ length: 20 }, (_, i) => ({
    url: null,
    title: titlePool[i % titlePool.length],
  }));

  const sourceItems = posters && posters.length >= 10 ? posters : placeholderItems;

  // Split into rows of ~15 items each
  const ROW_COUNT = 5;
  const perRow = Math.max(10, Math.ceil(sourceItems.length / ROW_COUNT));
  const rows = Array.from({ length: ROW_COUNT }, (_, i) => {
    const start = (i * perRow) % sourceItems.length;
    const slice = [];
    for (let j = 0; j < perRow; j++) {
      slice.push(sourceItems[(start + j) % sourceItems.length]);
    }
    return slice;
  });

  const speeds = [28, 22, 35, 20, 30];
  const directions = [1, -1, 1, -1, 1];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100%', height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: 0,
    }}>
      {/* Dark overlay gradient for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.7) 100%),
          linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 15%, rgba(0,0,0,0.1) 85%, rgba(0,0,0,0.8) 100%)
        `,
        zIndex: 2,
      }} />

      {/* Poster rows */}
      <div style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '100%',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}>
        {rows.map((row, i) => (
          <MarqueeRow
            key={i}
            items={row}
            direction={directions[i]}
            speed={speeds[i]}
            rowIndex={i}
          />
        ))}
      </div>

      {/* Vignette sides */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.6) 100%)',
        zIndex: 3,
        pointerEvents: 'none',
      }} />
    </div>
  );
}