import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { streamxApi } from '../services/api';
import axios from 'axios';

export default function ProfilePage() {
  const { user, API, getHeaders } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || ''
  });

  useEffect(() => {
    streamxApi.getMySubscription()
      .then((res) => setSubscription(res.data))
      .catch(() => setSubscription(null));
  }, []);

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || ''
    });
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }

      // Update profile
      await axios.put(
        `${API}/auth/profile`,
        {
          name: formData.name,
          email: formData.email,
          username: formData.username
        },
        { headers: getHeaders() }
      );

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || ''
    });
    setError('');
  };

  return (
    <main className="page" style={{ padding: '100px 24px 32px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 className="section-title" style={{ marginBottom: 0 }}>My Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? 'btn btn-secondary' : 'btn btn-primary'}
          >
            {isEditing ? '✕ Cancel' : '✏️ Edit Profile'}
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(229, 9, 20, 0.1)',
            border: '1px solid rgba(229, 9, 20, 0.3)',
            color: 'var(--red)',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            {success}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '20px', fontWeight: '700' }}>Edit Profile Details</h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-dim)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-dim)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-dim)' }}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your username"
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)'
              }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 1, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Saving...' : '✓ Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div style={{
            display: 'grid',
            gap: '20px'
          }}>
            {/* Account Information */}
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '20px', fontWeight: '700' }}>Account Information</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dim)' }}>Full Name:</label>
                  <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{user?.name || user?.username || 'N/A'}</span>
                </div>
                <div style={{ borderBottom: '1px solid var(--border)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dim)' }}>Email:</label>
                  <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{user?.email || 'N/A'}</span>
                </div>
                <div style={{ borderBottom: '1px solid var(--border)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dim)' }}>Username:</label>
                  <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{user?.username || 'N/A'}</span>
                </div>
                <div style={{ borderBottom: '1px solid var(--border)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dim)' }}>Account Type:</label>
                  <div style={{
                    display: 'inline-block',
                    background: user?.role === 'admin' ? 'rgba(229, 9, 20, 0.15)' : 'rgba(68, 102, 255, 0.15)',
                    color: user?.role === 'admin' ? 'var(--red)' : 'var(--blue)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    width: 'fit-content'
                  }}>
                    {user?.role || 'user'}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Information */}
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '20px', fontWeight: '700' }}>Subscription</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dim)' }}>Current Plan:</label>
                  <div style={{
                    display: 'inline-block',
                    background: subscription?.plan === 'premium' ? 'rgba(229, 9, 20, 0.15)' : subscription?.plan === 'basic' ? 'rgba(68, 102, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                    color: subscription?.plan === 'premium' ? 'var(--red)' : subscription?.plan === 'basic' ? 'var(--blue)' : 'var(--text-dim)',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    width: 'fit-content'
                  }}>
                    {subscription?.plan || user?.plan || 'free'}
                  </div>
                </div>
                <div style={{ borderBottom: '1px solid var(--border)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dim)' }}>Status:</label>
                  <span style={{ fontSize: '1rem', color: 'var(--text)' }}>
                    {subscription?.expiresAt ? (
                      new Date(subscription.expiresAt) > new Date() ? '✓ Active' : 'Expired'
                    ) : 'N/A'}
                  </span>
                </div>
                {subscription?.expiresAt && (
                  <>
                    <div style={{ borderBottom: '1px solid var(--border)' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dim)' }}>Renews On:</label>
                      <span style={{ fontSize: '1rem', color: 'var(--text)' }}>
                        {new Date(subscription.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <a href="/pricing" className="btn btn-secondary" style={{ textAlign: 'center' }}>
                💳 Upgrade Plan
              </a>
              <button className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                🔐 Change Password
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
