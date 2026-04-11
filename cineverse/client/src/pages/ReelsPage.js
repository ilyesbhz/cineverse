import React, { useEffect, useState } from 'react';
import { streamxApi } from '../services/api';

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    streamxApi.getMovieReels()
      .then((res) => setReels(res.data || []))
      .catch(() => setReels([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="page" style={{ padding: '100px 24px 32px' }}>
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="spinner" />
          <p>Loading reels...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page" style={{ padding: '100px 24px 32px' }}>
      <h1 className="section-title" style={{ marginBottom: '32px' }}>Movie Reels</h1>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {reels.length > 0 ? (
          reels.map((item) => (
            <article key={item.id} className="glass" style={{ overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-red)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {item.poster && <img src={item.poster} alt={item.title} style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} />}
              <div style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.5px' }}>{item.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.85rem' }}>{item.year} • {item.genre}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">🎬</div>
            <div className="empty-state-title">No Reels Available</div>
            <div className="empty-state-desc">Check back soon for new movie reels and highlights.</div>
          </div>
        )}
      </section>
    </main>
  );
}
