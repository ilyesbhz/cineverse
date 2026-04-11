import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { user, loading, login, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const modeFromQuery = new URLSearchParams(location.search).get('mode');
  const [mode, setMode] = useState(modeFromQuery === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(modeFromQuery === 'register' ? 'register' : 'login');
  }, [modeFromQuery]);

  useEffect(() => {
    if (!loading && user) navigate('/home');
  }, [loading, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'register') {
        await register(form.username.trim(), form.email.trim(), form.password);
      } else {
        await login(form.email.trim(), form.password);
      }
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ display: 'grid', placeItems: 'center', padding: '100px 24px 24px', position: 'relative' }}>
      {/* Return Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '100px',
          left: '24px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          borderRadius: '999px',
          padding: '10px 18px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '500',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(229, 9, 20, 0.2)';
          e.currentTarget.style.borderColor = 'var(--red)';
          e.currentTarget.style.color = 'var(--red)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(229, 9, 20, 0.3)';
          e.currentTarget.style.transform = 'translateX(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
        title="Back to home"
      >
        <span style={{ fontSize: '1.1rem' }}>←</span>
        <span>Back</span>
      </button>

      <div className="glass" style={{ width: 'min(460px, 100%)', padding: '40px 32px', animation: 'fadeUp 0.6s ease' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', letterSpacing: '2px', marginBottom: '8px', fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
          {mode === 'register' ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '28px', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {mode === 'register' ? 'Start your CineVerse journey.' : 'Sign in to continue streaming.'}
        </p>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '14px' }}>
          {mode === 'register' && (
            <div className="form-group">
              <input
                className="input"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
          )}
          <div className="form-group">
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              minLength={6}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: '8px', fontWeight: 700, letterSpacing: '0.5px' }}>
            {submitting ? (
              <><div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> <span>Please wait...</span></>
            ) : (
              mode === 'register' ? 'Sign Up' : 'Sign In'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center' }}>
          {mode === 'register' ? 'Already have an account?' : 'Need an account?'}{' '}
          <Link
            to={mode === 'register' ? '/auth' : '/auth?mode=register'}
            style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#ff6b35'}
            onMouseLeave={(e) => e.target.style.color = 'var(--red)'}
          >
            {mode === 'register' ? 'Sign in' : 'Register'}
          </Link>
        </div>
      </div>
    </div>
  );
}
