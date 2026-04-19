import React, { useState } from 'react';
import api from '../services/api';
import './CommentForm.css';

const CommentForm = ({ reelId, onCommentAdded }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const maxLength = 500;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (text.length > maxLength) {
      setError(`Comment must be less than ${maxLength} characters`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/reels/${reelId}/comments`, {
        text: text.trim()
      });

      setText('');
      onCommentAdded(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        className="comment-input"
        placeholder="Add a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={maxLength}
        disabled={loading}
      />
      <div className="comment-form-footer">
        <span className="char-count">
          {text.length} / {maxLength}
        </span>
        <button
          type="submit"
          className="comment-submit-btn"
          disabled={loading || !text.trim()}
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
      {error && <div className="comment-error">{error}</div>}
    </form>
  );
};

export default CommentForm;
