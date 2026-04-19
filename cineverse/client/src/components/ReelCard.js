import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CommentSection from './CommentSection';
import './ReelCard.css';

const ReelCard = ({ reel, isActive, onLike, isMuted }) => {
  const { user } = useAuth();
  const iframeRef = useRef(null);
  const commentOverlayRef = useRef(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [showComments, setShowComments] = useState(false);

  // Generate iframe src with proper parameters
  const getIframeSrc = () => {
    const params = new URLSearchParams({
      autoplay: isActive ? '1' : '0',
      mute: isMuted ? '1' : '0',
      controls: '0',
      modestbranding: '1',
      rel: '0',
      loop: '1',
      playlist: reel.youtubeVideoId,
      enablejsapi: '1',
      fs: '0',
      iv_load_policy: '3'
    });
    return `https://www.youtube.com/embed/${reel.youtubeVideoId}?${params.toString()}`;
  };

  // Handle active state changes
  useEffect(() => {
    if (!iframeRef.current) return;
    setIframeKey(prev => prev + 1);
  }, [isActive]);

  // Handle mute changes
  useEffect(() => {
    if (!iframeRef.current) return;
    try {
      iframeRef.current.contentWindow?.postMessage(
        { event: 'command', func: isMuted ? 'mute' : 'unMute' },
        '*'
      );
    } catch (error) {
      // Ignore errors
    }
  }, [isMuted]);

  // Close comments on Escape key
  useEffect(() => {
    if (!showComments) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowComments(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showComments]);

  const handleLike = async () => {
    try {
      await api.post(`/reels/${reel._id}/like`);
      onLike(reel._id);
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleShare = () => {
    const url = `https://www.youtube.com/watch?v=${reel.youtubeVideoId}`;
    if (navigator.share) {
      navigator.share({
        title: reel.title,
        text: `Check out ${reel.title} on Cineverse!`,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
      });
    }
  };

  const isLiked = reel.likes && reel.likes.length > 0;
  const likeCount = reel.likes ? reel.likes.length : 0;

  return (
    <div className={`reel-card ${showComments ? 'showing-comments' : ''}`}>
      {/* YouTube iframe */}
      <div className="reel-video-container">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          className="reel-iframe"
          src={getIframeSrc()}
          title={reel.title}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>

      {/* Gradient overlay for text readability */}
      <div className="reel-overlay" />

      {/* Right sidebar actions */}
      <div className="reel-actions">
        {/* Like button */}
        <button
          className="action-button"
          onClick={handleLike}
          title="Like"
        >
          <span className={`action-icon ${isLiked ? 'liked' : ''}`}>
            {isLiked ? '❤️' : '🤍'}
          </span>
          <span className="action-label">{likeCount}</span>
        </button>

        {/* View count */}
        <div className="action-button disabled">
          <span className="action-icon">👁️</span>
          <span className="action-label">{reel.views}</span>
        </div>

        {/* Comments button */}
        <button
          className="action-button"
          onClick={() => setShowComments(!showComments)}
          title="Comments"
        >
          <span className="action-icon">💬</span>
          <span className="action-label">Chat</span>
        </button>

        {/* Share button */}
        <button
          className="action-button"
          onClick={handleShare}
          title="Share"
        >
          <span className="action-icon">🔗</span>
          <span className="action-label">Share</span>
        </button>

        {/* YouTube link */}
        <a
          href={`https://www.youtube.com/watch?v=${reel.youtubeVideoId}`}
          target="_blank"
          rel="noreferrer"
          className="action-button"
          title="Watch on YouTube"
        >
          <span className="action-icon">▶️</span>
          <span className="action-label">YouTube</span>
        </a>

        {/* TMDB link (if available) */}
        {reel.tmdbId && (
          <a
            href={`https://www.themoviedb.org/movie/${reel.tmdbId}`}
            target="_blank"
            rel="noreferrer"
            className="action-button"
            title="View on TMDB"
          >
            <span className="action-icon">🎬</span>
            <span className="action-label">TMDB</span>
          </a>
        )}
      </div>

      {/* Bottom metadata overlay */}
      <div className="reel-metadata">
        <div className="reel-info">
          <h3 className="reel-title">{reel.title}</h3>

          {/* Category & Duration */}
          <div className="reel-meta-row">
            {reel.category && (
              <span className="reel-meta-item">{reel.category}</span>
            )}
            {reel.duration && (
              <span className="reel-meta-item">
                {formatDuration(reel.duration)}
              </span>
            )}
          </div>

          {/* Genres */}
          {reel.genres && reel.genres.length > 0 && (
            <div className="reel-genres">
              {reel.genres.slice(0, 3).map((genre, idx) => (
                <span key={idx} className="genre-badge">{genre}</span>
              ))}
            </div>
          )}

          {/* TMDB Metadata */}
          {reel.tmdbMetadata && (
            <div className="reel-tmdb-meta">
              {reel.tmdbMetadata.synopsis && (
                <p className="reel-synopsis">
                  {reel.tmdbMetadata.synopsis.substring(0, 100)}...
                </p>
              )}
              {reel.tmdbMetadata.director && (
                <p className="reel-director">
                  🎬 {reel.tmdbMetadata.director}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        <div className="reel-progress">{reel.position}</div>
      </div>

      {/* Click outside area to close comments */}
      {showComments && (
        <div
          className="comment-overlay-backdrop"
          onClick={() => setShowComments(false)}
        />
      )}

      {/* Comment section overlay */}
      {showComments && (
        <div
          className="reel-comments-overlay"
          ref={commentOverlayRef}
          onClick={(e) => e.stopPropagation()}
        >
          <CommentSection reelId={reel._id} currentUser={user} onClose={() => setShowComments(false)} />
        </div>
      )}
    </div>
  );
};

function formatDuration(seconds) {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default ReelCard;
