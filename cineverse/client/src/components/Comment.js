import React, { useState } from 'react';
import api from '../services/api';
import './Comment.css';

const Comment = ({ comment, reelId, onCommentDeleted, currentUserId, isAdmin }) => {
  const [isLiked, setIsLiked] = useState(
    comment.likes && comment.likes.some(id => id === currentUserId || id._id === currentUserId)
  );
  const [likeCount, setLikeCount] = useState(comment.likes ? comment.likes.length : 0);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId && comment.userId._id === currentUserId;
  const canDelete = isOwner || isAdmin;

  const handleLike = async () => {
    try {
      const response = await api.post(`/reels/${reelId}/comments/${comment._id}/like`);
      setIsLiked(response.data.liked);
      setLikeCount(response.data.likes);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;

    setIsDeleting(true);
    try {
      await api.delete(`/reels/${reelId}/comments/${comment._id}`);
      onCommentDeleted(comment._id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="comment">
      <div className="comment-header">
        <div className="comment-user">
          <span className="comment-username">{comment.userId.name}</span>
          <span className="comment-handle">@{comment.userId.username}</span>
        </div>
        <span className="comment-time">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="comment-text">{comment.text}</p>

      <div className="comment-actions">
        <button
          className={`comment-like ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          title="Like comment"
        >
          {isLiked ? '❤️' : '🤍'} {likeCount}
        </button>

        {canDelete && (
          <button
            className="comment-delete"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete comment"
          >
            {isDeleting ? '...' : '🗑️'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Comment;
