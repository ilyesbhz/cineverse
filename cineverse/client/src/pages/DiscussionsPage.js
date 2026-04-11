import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { streamxApi } from '../services/api';

const CATEGORIES = ['Review', 'Discussion', 'Recommendation', 'Question'];

export default function DiscussionsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Discussion');
  const [movieTitle, setMovieTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [revealedSpoilers, setRevealedSpoilers] = useState({});
  const isAdmin = user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const res = await streamxApi.getDiscussions();
      setItems(res.data || []);
    } catch (err) {
      console.error('Error loading discussions:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateDiscussion = (updatedDiscussion) => {
    setItems((currentItems) => currentItems.map((item) => (
      item._id === updatedDiscussion._id ? updatedDiscussion : item
    )));
  };

  const handleLike = async (discussion) => {
    setActionError('');
    try {
      const res = await streamxApi.likeDiscussion(discussion._id);
      updateDiscussion(res.data);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update like');
    }
  };

  const handleCommentSubmit = async (discussion) => {
    const draft = (commentDrafts[discussion._id] || '').trim();
    if (!draft) return;

    setActionError('');
    try {
      const res = await streamxApi.commentDiscussion(discussion._id, draft);
      updateDiscussion(res.data);
      setCommentDrafts((currentDrafts) => ({ ...currentDrafts, [discussion._id]: '' }));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleAdminDelete = async (discussion) => {
    if (!isAdmin) return;

    const confirmed = window.confirm(`Remove discussion "${discussion.title}"?`);
    if (!confirmed) return;

    setActionError('');
    try {
      await streamxApi.deleteDiscussionAsAdmin(discussion._id);
      setItems((currentItems) => currentItems.filter((item) => item._id !== discussion._id));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove discussion');
    }
  };

  const toggleSpoiler = (discussionId) => {
    setRevealedSpoilers((current) => ({
      ...current,
      [discussionId]: !current[discussionId]
    }));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await streamxApi.createDiscussion({
        title: title.trim(),
        content: content.trim(),
        category,
        movieTitle: movieTitle.trim(),
        rating: parseInt(rating),
        containsSpoiler: false
      });
      setTitle('');
      setContent('');
      setCategory('Discussion');
      setMovieTitle('');
      setRating(5);
      setShowForm(false);
      setActionError('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create discussion');
    }
  };

  const filteredItems = filter === 'all' ? items : items.filter(d => d.category === filter);
  const pendingCount = items.filter(d => d.status === 'pending').length;
  const approvedCount = items.filter(d => d.status === 'approved').length;

  const getStatusStyles = (status) => {
    switch (status) {
      case 'approved':
        return { base: 'var(--red)', bg: 'rgba(229, 9, 20, 0.1)' };
      case 'pending':
        return { base: 'var(--blue)', bg: 'rgba(68, 102, 255, 0.1)' };
      case 'rejected':
        return { base: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)' };
      default:
        return { base: 'var(--text-dim)', bg: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  return (
    <main className="page" style={{ padding: '100px 24px 32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 className="section-title" style={{ marginBottom: 0 }}>Discussions</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
            style={{ flexShrink: 0 }}
          >
            {showForm ? '✕ Cancel' : '💬 Start Discussion'}
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {[
            { label: 'Total Discussions', value: items.length, icon: '💬' },
            { label: 'Approved', value: approvedCount, icon: '✓' },
            { label: 'Pending', value: pendingCount, icon: '⏳' }
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 16px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--red)', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {actionError && (
        <div style={{
          marginBottom: '20px',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          color: '#ff6b6b',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          fontSize: '0.9rem'
        }}>
          {actionError}
        </div>
      )}

      {/* Create Discussion Form */}
      {showForm && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: '700' }}>Create a New Discussion</h2>
          {error && (
            <div style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              color: '#ff6b6b',
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              marginBottom: '16px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          <form onSubmit={submit} style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-dim)' }}>
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-dim)' }}>
                  Movie Title (optional)
                </label>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  placeholder="Which movie?"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-dim)' }}>
                Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your discussion a title"
                className="input"
                maxLength={200}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                {title.length}/200
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-dim)' }}>
                Share Your Thoughts *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your discussion... (Spoiler keywords will be automatically detected)"
                className="input"
                rows={5}
                maxLength={5000}
                style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                {content.length}/5000
              </div>
            </div>

            {category === 'Review' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-dim)' }}>
                  Rating
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--gold)', minWidth: '40px' }}>
                    {rating} ⭐
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                ✓ Create Discussion
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['all', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`genre-pill ${filter === cat ? 'active' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Discussions List */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-dim)' }}>Loading discussions...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💭</div>
          <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No discussions yet</p>
          <p style={{ fontSize: '0.9rem' }}>Be the first to start a discussion!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredItems.map((d) => {
            const statusStyles = getStatusStyles(d.status);
            const currentUserId = user?._id?.toString();
            const hasLiked = Boolean(currentUserId && Array.isArray(d.likes) && d.likes.some((like) => {
              const likeId = like?._id || like;
              return likeId?.toString?.() === currentUserId;
            }));
            const spoilerHidden = Boolean(d.containsSpoiler && !revealedSpoilers[d._id]);
            const commentDraft = commentDrafts[d._id] || '';
            const canInteract = d.status === 'approved';
            return (
              <article
                key={d._id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '20px',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '700' }}>
                      {d.title}
                    </h3>
                  </div>
                  <div style={{
                    background: statusStyles.bg,
                    color: statusStyles.base,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap'
                  }}>
                    {d.status}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span>👤 {d.user?.name || d.user?.username || 'User'}</span>
                  <span>•</span>
                  <span>📁 {d.category}</span>
                  {d.movieTitle && (
                    <>
                      <span>•</span>
                      <span>🎬 {d.movieTitle}</span>
                    </>
                  )}
                </div>

                {d.flaggedKeywords && d.flaggedKeywords.length > 0 && (
                  <div style={{ marginBottom: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {d.flaggedKeywords.map(keyword => (
                      <span
                        key={keyword}
                        style={{
                          background: 'rgba(229, 9, 20, 0.2)',
                          color: 'var(--red)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {d.containsSpoiler && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(229, 9, 20, 0.08)',
                    border: '1px solid rgba(229, 9, 20, 0.2)',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ color: 'var(--red)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Spoiler content hidden
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSpoiler(d._id)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    >
                      {spoilerHidden ? 'Reveal spoiler' : 'Blur spoiler'}
                    </button>
                  </div>
                )}

                <p style={{
                  margin: '0 0 12px 0',
                  color: 'var(--text)',
                  lineHeight: '1.6',
                  maxHeight: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  filter: spoilerHidden ? 'blur(10px)' : 'none',
                  userSelect: spoilerHidden ? 'none' : 'text',
                  transition: 'filter 0.2s ease'
                }}>
                  {d.content}
                </p>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '16px'
                }}>
                  <button
                    type="button"
                    onClick={() => handleLike(d)}
                    disabled={!canInteract}
                    className="btn btn-secondary"
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      opacity: canInteract ? 1 : 0.5,
                      cursor: canInteract ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {hasLiked ? '❤️ Liked' : '🤍 Like'}
                    <span style={{ marginLeft: '8px', color: 'var(--text-dim)' }}>{d.likes?.length || 0}</span>
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    💬 {d.comments?.length || 0} Comments
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleAdminDelete(d)}
                      className="btn btn-secondary"
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        color: 'var(--red)',
                        borderColor: 'rgba(229, 9, 20, 0.4)'
                      }}
                    >
                      🗑️ Remove Post
                    </button>
                  )}
                </div>

                <div style={{
                  display: 'grid',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)'
                }}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCommentSubmit(d);
                    }}
                    style={{ display: 'grid', gap: '10px' }}
                  >
                    <textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDrafts((currentDrafts) => ({ ...currentDrafts, [d._id]: e.target.value }))}
                      placeholder={canInteract ? 'Write a comment...' : 'Comments unlock after approval'}
                      className="input"
                      rows={3}
                      maxLength={1000}
                      disabled={!canInteract}
                      style={{
                        resize: 'vertical',
                        fontFamily: 'var(--font-body)',
                        opacity: canInteract ? 1 : 0.6
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {commentDraft.length}/1000
                      </span>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!canInteract || !commentDraft.trim()}
                        style={{ opacity: canInteract && commentDraft.trim() ? 1 : 0.5 }}
                      >
                        Post comment
                      </button>
                    </div>
                  </form>

                  {!!d.comments?.length && (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {d.comments.map((comment) => (
                        <div
                          key={comment._id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '12px 14px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <strong style={{ fontSize: '0.85rem' }}>{comment.user?.name || comment.user?.username || 'User'}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: 'var(--text)', lineHeight: '1.5' }}>
                            {comment.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
