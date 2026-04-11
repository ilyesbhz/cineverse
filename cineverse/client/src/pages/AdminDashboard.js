import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { API, getHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API}/auth/admin/stats`, { headers: getHeaders() })
      .then(res => setStats(res.data))
      .catch(err => console.error('Error fetching stats:', err))
      .finally(() => setLoading(false));
  }, [API, getHeaders]);

  useEffect(() => {
    if (activeTab === 'users') {
      setLoading(true);
      axios
        .get(`${API}/auth/admin/users`, {
          params: { search: userSearch },
          headers: getHeaders()
        })
        .then(res => setUsers(res.data || []))
        .catch(err => console.error('Error fetching users:', err))
        .finally(() => setLoading(false));
    }
  }, [API, getHeaders, activeTab, userSearch]);

  useEffect(() => {
    if (activeTab === 'discussions') {
      setLoading(true);
      axios
        .get(`${API}/discussions`, {
          params: { status: 'pending' },
          headers: getHeaders()
        })
        .then(res => setDiscussions(res.data || []))
        .catch(err => console.error('Error fetching discussions:', err))
        .finally(() => setLoading(false));
    }
  }, [API, getHeaders, activeTab]);

  const handleApproveDiscussion = async (discussionId) => {
    try {
      await axios.put(
        `${API}/discussions/${discussionId}/moderate`,
        { action: 'approve' },
        { headers: getHeaders() }
      );
      setDiscussions(discussions.filter(d => d._id !== discussionId));
    } catch (err) {
      console.error('Error approving discussion:', err);
      alert('Failed to approve discussion');
    }
  };

  const handleRejectDiscussion = async (discussionId) => {
    const reason = prompt('Enter rejection reason (optional):');
    try {
      await axios.put(
        `${API}/discussions/${discussionId}/moderate`,
        { action: 'reject', reason: reason || '' },
        { headers: getHeaders() }
      );
      setDiscussions(discussions.filter(d => d._id !== discussionId));
    } catch (err) {
      console.error('Error rejecting discussion:', err);
      alert('Failed to reject discussion');
    }
  };

  const handleAddSpoilerTag = async (discussionId) => {
    try {
      await axios.put(
        `${API}/discussions/${discussionId}/spoiler`,
        { containsSpoiler: true },
        { headers: getHeaders() }
      );
      setDiscussions(discussions.map(d =>
        d._id === discussionId ? { ...d, containsSpoiler: true } : d
      ));
    } catch (err) {
      console.error('Error tagging spoiler:', err);
      alert('Failed to tag spoiler');
    }
  };

  const handleDeleteDiscussion = async (discussionId) => {
    if (window.confirm('Are you sure you want to delete this discussion?')) {
      try {
        await axios.delete(
          `${API}/discussions/${discussionId}/admin`,
          { headers: getHeaders() }
        );
        setDiscussions(discussions.filter(d => d._id !== discussionId));
      } catch (err) {
        console.error('Error deleting discussion:', err);
        alert('Failed to delete discussion');
      }
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await axios.delete(`${API}/auth/admin/users/${userId}`, {
          headers: getHeaders()
        });
        setUsers(users.filter(u => u._id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user');
      }
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await axios.put(
        `${API}/auth/admin/users/${userId}`,
        { role: newRole },
        { headers: getHeaders() }
      );
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      alert('User role updated');
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user');
    }
  };

  const StatChart = ({ label, value, max, color, suffix = '' }) => {
    const percent = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color }}>{value}{suffix}</div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', alignSelf: 'flex-end' }}>{percent}%</div>
        </div>
        <div style={{
          height: '12px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            borderRadius: '999px',
            background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.85))`
          }} />
        </div>
      </div>
    );
  };

  const DonutChart = ({ total, approved, pending, rejected }) => {
    const approvedPct = total ? (approved / total) * 100 : 0;
    const pendingPct = total ? (pending / total) * 100 : 0;
    const rejectedPct = total ? (rejected / total) * 100 : 0;
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: `conic-gradient(
            var(--red) 0% ${approvedPct}%,
            var(--blue) ${approvedPct}% ${approvedPct + pendingPct}%,
            #ff6b6b ${approvedPct + pendingPct}% 100%
          )`,
          position: 'relative',
          flexShrink: 0
        }}>
          <div style={{
            position: 'absolute',
            inset: '22px',
            borderRadius: '50%',
            background: 'var(--bg3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--text)' }}>{total}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Posts</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '10px' }}>Discussion Breakdown</div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {[
              { label: 'Approved', value: approved, color: 'var(--red)' },
              { label: 'Pending', value: pending, color: 'var(--blue)' },
              { label: 'Rejected', value: rejected, color: '#ff6b6b' }
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-dim)' }}>{item.label}</div>
                <div style={{ fontWeight: '700' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="page" style={{ padding: '100px 24px 32px' }}>
      <h1 className="section-title">Admin Dashboard</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        {['stats', 'discussions', 'users', 'movies'].map(tab => (
          <button
            key={tab}
            className={`genre-pill ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>}

      {!loading && activeTab === 'stats' && (
        <section className="section" style={{ paddingTop: 0 }}>
          {stats ? (
            <div style={{ display: 'grid', gap: '18px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px'
              }}>
                <StatChart label="Total Users" value={stats.totalUsers || 0} max={Math.max(stats.totalUsers || 0, stats.totalVideos || 0, stats.totalReels || 0, stats.totalDiscussions || 0)} color="var(--red)" />
                <StatChart label="Total Videos" value={stats.totalVideos || 0} max={Math.max(stats.totalUsers || 0, stats.totalVideos || 0, stats.totalReels || 0, stats.totalDiscussions || 0)} color="var(--blue)" />
                <StatChart label="Total Reels" value={stats.totalReels || 0} max={Math.max(stats.totalUsers || 0, stats.totalVideos || 0, stats.totalReels || 0, stats.totalDiscussions || 0)} color="#ff6b6b" />
                <StatChart label="Total Discussions" value={stats.totalDiscussions || 0} max={Math.max(stats.totalUsers || 0, stats.totalVideos || 0, stats.totalReels || 0, stats.totalDiscussions || 0)} color="#f7b731" />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px'
              }}>
                <DonutChart
                  total={stats.totalDiscussions || 0}
                  approved={stats.approvedDiscussions || 0}
                  pending={stats.pendingDiscussions || 0}
                  rejected={stats.rejectedDiscussions || 0}
                />

                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>System Snapshot</div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {[
                      { label: 'Users', value: stats.totalUsers || 0 },
                      { label: 'Admins', value: stats.totalAdmins || 0 },
                      { label: 'Videos', value: stats.totalVideos || 0 },
                      { label: 'Reels', value: stats.totalReels || 0 },
                      { label: 'Discussions', value: stats.totalDiscussions || 0 }
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span style={{ color: 'var(--text-dim)' }}>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>No stats available</div>
          )}
        </section>
      )}

      {!loading && activeTab === 'discussions' && (
        <section className="section" style={{ paddingTop: 0 }}>
          <h2 style={{ marginBottom: '16px' }}>Pending Discussions ({discussions.length})</h2>
          {discussions.length === 0 ? (
            <div style={{ color: 'var(--text-dim)' }}>No pending discussions</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {discussions.map(discussion => (
                <div
                  key={discussion._id}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '16px',
                    borderLeft: discussion.containsSpoiler ? '4px solid var(--red)' : '4px solid var(--blue)'
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      {discussion.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                      by {discussion.user?.name || 'Unknown'} • {discussion.category}
                      {discussion.containsSpoiler && <span style={{ color: 'var(--red)', marginLeft: '8px' }}>⚠️ SPOILER</span>}
                    </div>
                    {discussion.flaggedKeywords && discussion.flaggedKeywords.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        {discussion.flaggedKeywords.map(keyword => (
                          <span
                            key={keyword}
                            style={{
                              display: 'inline-block',
                              background: 'rgba(229, 9, 20, 0.2)',
                              color: 'var(--red)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              marginRight: '4px'
                            }}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{
                      color: 'var(--text-dim)',
                      fontSize: '0.9rem',
                      maxHeight: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {discussion.content}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        border: 'none',
                        background: 'var(--red)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                      onClick={() => handleApproveDiscussion(discussion._id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                      onClick={() => handleRejectDiscussion(discussion._id)}
                    >
                      ✕ Reject
                    </button>
                    {!discussion.containsSpoiler && (
                      <button
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius)',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}
                        onClick={() => handleAddSpoilerTag(discussion._id)}
                      >
                        ⚠️ Spoiler Tag
                      </button>
                    )}
                    <button
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--red)',
                        background: 'transparent',
                        color: 'var(--red)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}
                      onClick={() => handleDeleteDiscussion(discussion._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {!loading && activeTab === 'users' && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              className="input"
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
          </div>
          {users.length === 0 ? (
            <div style={{ color: 'var(--text-dim)' }}>No users found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>Username</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>Plan</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{user.username || user.name || 'Unknown'}</td>
                      <td style={{ padding: '12px' }}>{user.email}</td>
                      <td style={{ padding: '12px' }}>
                        <select
                          value={user.role}
                          onChange={e => handleUpdateUserRole(user._id, e.target.value)}
                          style={{
                            background: 'var(--bg3)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px' }}>{user.subscription?.plan || 'free'}</td>
                      <td style={{ padding: '12px' }}>
                        <button
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--red)',
                            background: 'transparent',
                            color: 'var(--red)',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          onClick={() => handleDeleteUser(user._id, user.username || user.name || 'this user')}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!loading && activeTab === 'movies' && (
        <section className="section" style={{ paddingTop: 0 }}>
          <p style={{ color: 'var(--text-dim)' }}>Movie management features coming soon...</p>
        </section>
      )}
    </main>
  );
}
