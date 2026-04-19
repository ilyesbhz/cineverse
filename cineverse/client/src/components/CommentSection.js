import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Comment from './Comment';
import CommentForm from './CommentForm';
import './CommentSection.css';

const CommentSection = ({ reelId, currentUser, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchComments(1);
  }, [reelId]);

  const fetchComments = async (pageNum) => {
    try {
      setLoading(true);
      const response = await api.get(`/reels/${reelId}/comments`, {
        params: { page: pageNum, limit: 20 }
      });

      if (pageNum === 1) {
        setComments(response.data.comments);
      } else {
        setComments(prev => [...prev, ...response.data.comments]);
      }

      setHasMore(response.data.pagination.page < response.data.pagination.pages);
      setPage(pageNum);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
    }
  };

  const handleCommentAdded = (newComment) => {
    setComments(prev => [newComment, ...prev]);
  };

  const handleCommentDeleted = (commentId) => {
    setComments(prev => prev.filter(c => c._id !== commentId));
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    fetchComments(page + 1).then(() => setIsLoadingMore(false));
  };

  return (
    <div className="comment-section">
      <div className="comment-section-header">
        <h3>Comments</h3>
        <div className="comment-header-actions">
          <span className="comment-count">{comments.length}</span>
          <button
            className="comment-close-btn"
            onClick={onClose}
            title="Close comments"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Comment form */}
      {currentUser ? (
        <CommentForm reelId={reelId} onCommentAdded={handleCommentAdded} />
      ) : (
        <div className="comment-login-prompt">
          Sign in to post a comment
        </div>
      )}

      {/* Comments list */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">
            <div className="spinner-small" />
            <p>Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <Comment
                key={comment._id}
                comment={comment}
                reelId={reelId}
                onCommentDeleted={handleCommentDeleted}
                currentUserId={currentUser?._id}
                isAdmin={currentUser?.isAdmin}
              />
            ))}

            {hasMore && (
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load more comments'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentSection;

