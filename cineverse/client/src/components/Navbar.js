import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { streamxApi } from '../services/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const adminUser = isAdmin();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);
  const notificationsButtonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      try {
        const res = await streamxApi.getUnreadNotificationsCount();
        setUnreadCount(res.data?.count || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, 30000);
    return () => window.clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const res = await streamxApi.getNotifications();
        setNotifications(res.data || []);
      } catch {
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
  }, [notificationsOpen]);

  useEffect(() => {
    const onClickOutside = (event) => {
      const clickedNotifications = notificationsRef.current?.contains(event.target);
      const clickedBell = notificationsButtonRef.current?.contains(event.target);
      if (!clickedNotifications && !clickedBell) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (path) => location.pathname === path;
  const displayName = user?.username || user?.name || 'Account';

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await streamxApi.markNotificationRead(notification._id);
        setNotifications((currentNotifications) => currentNotifications.map((item) => (
          item._id === notification._id ? { ...item, read: true } : item
        )));
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      setNotificationsOpen(false);
      if (notification.link) {
        navigate(notification.link);
      }
    } catch {
      setNotificationsOpen(false);
      if (notification.link) {
        navigate(notification.link);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await streamxApi.markAllNotificationsRead();
      setNotifications((currentNotifications) => currentNotifications.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      // Keep the UI responsive even if the bulk update fails.
    }
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      height: 'var(--nav-h)',
      background: scrolled ? 'rgba(5,5,5,0.97)' : 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : 'none',
      transition: 'all 0.3s',
      display: 'flex', alignItems: 'center',
      padding: '0 clamp(16px, 4vw, 48px)',
      gap: '24px',
    }}>
      {/* Logo */}
      <Link to="/home" style={{
        fontFamily: 'var(--font-display)', fontSize: '1.8rem',
        letterSpacing: '3px', color: 'var(--red)',
        textShadow: '0 0 20px rgba(229,9,20,0.6)',
        flexShrink: 0,
      }}>
        CINEVERSE
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
        {[
          { label: 'Home', path: '/home' },
          { label: 'Browse', path: '/browse' },
          { label: 'Watchlist', path: '/watchlist' },
          { label: 'Reels', path: '/reels' },
          { label: 'Discussions', path: '/discussions' },
          ...(!adminUser ? [{ label: 'Pricing', path: '/pricing' }] : []),
        ].map(({ label, path }) => (
          <Link key={path} to={path} style={{
            padding: '8px 16px', borderRadius: 'var(--radius)',
            fontSize: '0.9rem', fontWeight: isActive(path) ? 600 : 400,
            color: isActive(path) ? '#fff' : 'var(--text-dim)',
            background: isActive(path) ? 'rgba(229,9,20,0.15)' : 'transparent',
            border: isActive(path) ? '1px solid rgba(229,9,20,0.3)' : '1px solid transparent',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { if (!isActive(path)) { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}}
            onMouseLeave={e => { if (!isActive(path)) { e.target.style.color = 'var(--text-dim)'; e.target.style.background = 'transparent'; }}}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {searchOpen ? (
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search titles..."
                className="input"
                style={{ width: '200px', padding: '8px 14px', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1.1rem' }}
              >✕</button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1.1rem', padding: '8px', borderRadius: '6px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}
            >🔍</button>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notificationsRef}>
          <button
            ref={notificationsButtonRef}
            onClick={() => setNotificationsOpen((open) => !open)}
            style={{
              background: notificationsOpen ? 'rgba(229,9,20,0.2)' : 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: '8px',
              borderRadius: '6px',
              transition: 'color 0.2s',
              position: 'relative'
            }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                minWidth: '18px',
                height: '18px',
                padding: '0 4px',
                background: 'var(--red)',
                color: '#fff',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '320px',
              maxWidth: 'calc(100vw - 32px)',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Notifications</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{unreadCount} unread</div>
                </div>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    borderRadius: '999px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Mark all read
                </button>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notificationsLoading ? (
                  <div style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '0.88rem' }}>Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '0.88rem' }}>No notifications yet.</div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification._id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        border: 'none',
                        borderBottom: '1px solid var(--border)',
                        background: notification.read ? 'transparent' : 'rgba(229,9,20,0.08)',
                        cursor: 'pointer',
                        color: 'var(--text)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.88rem' }}>{notification.title}</strong>
                        {!notification.read && <span style={{ color: 'var(--red)', fontSize: '0.72rem' }}>New</span>}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{notification.message}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload Reel Button */}
        <Link to="/reels/upload" style={{
          padding: '8px 16px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8))',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 500,
          textDecoration: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
          onMouseEnter={e => e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(236, 72, 153, 1))'}
          onMouseLeave={e => e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8))'}
        >
          ⬆️ Upload
        </Link>

        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: menuOpen ? 'rgba(229,9,20,0.2)' : 'rgba(255,255,255,0.08)',
              border: '1px solid var(--border)', borderRadius: '999px',
              padding: '6px 14px', cursor: 'pointer', color: 'var(--text)',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '0.85rem', transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '1rem' }}>👤</span>
            <span style={{ fontWeight: 500 }}>{displayName}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{menuOpen ? '▲' : '▼'}</span>
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
              width: '160px', boxShadow: 'var(--shadow)',
              animation: 'fadeIn 0.15s ease',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Signed in as</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
              {!adminUser ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontSize: '0.88rem', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    👤 Profile
                  </Link>
                </>
              ) : (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '10px 16px', fontSize: '0.88rem', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  ⚙️ Admin Dashboard
                </Link>
              )}
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', textAlign: 'left', fontSize: '0.88rem' }}
                >🚪 Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
