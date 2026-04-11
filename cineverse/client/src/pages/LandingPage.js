import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroThreeScene from '../three/HeroThreeScene';
import ThreeBackground from '../three/ThreeBackground';

export default function LandingPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 300); }, []);

  const features = [
    { icon: '🎬', title: 'Cinematic Library', desc: 'Thousands of titles from timeless classics to cutting-edge releases.' },
    { icon: '⚡', title: 'Instant Streaming', desc: 'Ultra-fast adaptive streaming. No buffering, just pure cinema.' },
    { icon: '🎭', title: 'Curated Picks', desc: 'AI-powered recommendations tailored to your unique taste.' },
    { icon: '📱', title: 'Any Device', desc: 'Watch on mobile, tablet, laptop, or your cinema-scale TV.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      <ThreeBackground variant="stars" />

      {/* Hero Section */}
      <section style={{
        position: 'relative', height: '100vh',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(24px, 6vw, 100px)',
      }}>
        {/* Three.js hero on right */}
        <div style={{
          position: 'absolute', right: 0, top: 0,
          width: '55%', height: '100%', opacity: 0.8,
        }}>
          <HeroThreeScene />
        </div>

        {/* Left content */}
        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: '580px',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'none' : 'translateY(30px)',
          transition: 'all 0.8s ease',
        }}>
          {/* Logo */}
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
            letterSpacing: '6px',
            color: 'var(--red)',
            textShadow: '0 0 30px rgba(229,9,20,0.7)',
            marginBottom: '24px',
          }}>CINEVERSE</div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3.5rem, 8vw, 6rem)',
            lineHeight: 0.9, letterSpacing: '2px',
            marginBottom: '24px',
          }}>
            <span style={{ display: 'block', color: '#fff' }}>CINEMA</span>
            <span style={{ display: 'block' }} className="gradient-text">REIMAGINED</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
            color: 'var(--text-dim): #ffffff', lineHeight: 1.7,
            marginBottom: '40px', fontWeight: 300,
          }}>
            Stream thousands of films in breathtaking quality. From blockbusters to indie gems — discover cinema like never before.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/auth?mode=register')}
              style={{ fontSize: '1.05rem', padding: '14px 36px' }}>
              Start Watching Free
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/auth')}>
              Sign In
            </button>
          </div>

          <div style={{
            marginTop: '48px', display: 'flex', gap: '32px',
            borderTop: '1px solid var(--border)', paddingTop: '32px',
          }}>
            {[['10K+', 'Films'], ['4K', 'Quality'], ['No Ads', 'Ever']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--red)', letterSpacing: '1px' }}>{val}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '2px',
          animation: 'float 2s ease-in-out infinite',
        }}>
          <span>SCROLL</span>
          <span style={{ fontSize: '1.2rem' }}>↓</span>
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: 'clamp(60px, 10vh, 120px) clamp(24px, 6vw, 100px)',
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(to bottom, transparent, var(--bg2) 30%, var(--bg2))',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            letterSpacing: '3px', marginBottom: '16px',
          }}>
            WHY CINEVERSE?
          </h2>
          <p style={{ color: 'var(--text-dim)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
            We built the streaming experience we always wanted.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}>
          {features.map((f, i) => (
            <div key={i} className="glass" style={{
              padding: '32px',
              animation: `fadeUp 0.6s ${i * 0.1}s both`,
              transition: 'transform 0.3s, box-shadow 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-red)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px', marginBottom: '8px', fontSize: '1.2rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, fontSize: '0.9rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: 'clamp(60px, 10vh, 120px) clamp(24px, 6vw, 100px)',
        position: 'relative', zIndex: 1,
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '600px', margin: '0 auto',
          padding: '60px 40px',
          background: 'linear-gradient(135deg, rgba(229,9,20,0.1), rgba(68,102,255,0.1))',
          borderRadius: '16px', border: '1px solid rgba(229,9,20,0.2)',
          boxShadow: '0 0 60px rgba(229,9,20,0.1)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '2px', marginBottom: '16px',
          }}>READY TO WATCH?</h2>
          <p style={{ color: 'var(--text-dim): #ffffff', marginBottom: '32px', lineHeight: 1.7 }}>
            Join millions of cinephiles. Start watching in seconds.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/auth?mode=register')}
            style={{ fontSize: '1.05rem', padding: '16px 48px', animation: 'glow 2s ease-in-out infinite' }}>
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px clamp(24px, 6vw, 100px)',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: 'var(--text-muted)', fontSize: '0.8rem', flexWrap: 'wrap', gap: '12px',
        position: 'relative', zIndex: 1,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '3px', color: 'var(--red)', fontSize: '1.1rem' }}>CINEVERSE</span>
        <span>© 2024 CineVerse. All rights reserved.</span>
      </footer>
    </div>
  );
}