import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import ReelCard from './ReelCard';
import './ReelsFeed.css';

const ReelsFeed = ({ category = 'all', genres = [] }) => {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('reelsFeedMuted') === 'true';
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef(null);
  const reelRefs = useRef([]);
  const observerRef = useRef(null);
  const viewedReels = useRef(new Set());
  const loadingMoreRef = useRef(false);

  // Fetch reels with filters
  const fetchReels = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append && loadingMoreRef.current) return;
      loadingMoreRef.current = true;

      const params = new URLSearchParams();
      params.append('page', pageNum);
      params.append('limit', 30);
      if (category && category !== 'all') {
        params.append('category', category);
      }
      if (genres && genres.length > 0) {
        params.append('genres', genres.join(','));
      }

      const res = await api.get(`/reels/feed?${params.toString()}`);
      const { reels: newReels, pagination } = res.data;

      if (append) {
        setReels(prev => [...prev, ...newReels]);
      } else {
        setReels(newReels);
        setCurrentIndex(0);
      }

      setHasMore(pagination.page < pagination.pages);
      setPage(pagination.page);
      setLoading(false);
      setIsLoadingMore(false);
      loadingMoreRef.current = false;
    } catch (error) {
      console.error('Error fetching reels:', error);
      setLoading(false);
      setIsLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [category, genres]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchReels(1, false);
  }, [category, genres, fetchReels]);

  // Setup intersection observer for autoplay and pagination
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const index = parseInt(entry.target.dataset.index);

          if (entry.isIntersecting) {
            // Track view when reel comes into view
            if (reels[index] && !viewedReels.current.has(reels[index]._id)) {
              viewedReels.current.add(reels[index]._id);
              api.post(`/reels/${reels[index]._id}/view`).catch(() => {});
            }

            // Load more reels when near the end (within last 5 reels)
            if (index >= reels.length - 5 && hasMore && !isLoadingMore && !loadingMoreRef.current) {
              setIsLoadingMore(true);
              fetchReels(page + 1, true);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    observerRef.current = observer;

    // Observe all reel refs
    reelRefs.current.forEach(ref => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      if (observerRef.current) {
        reelRefs.current.forEach(ref => {
          if (ref) {
            observerRef.current.unobserve(ref);
          }
        });
      }
    };
  }, [reels, hasMore, isLoadingMore, page, fetchReels]);

  // Handle mute toggle
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('reelsFeedMuted', newMuted.toString());
  };

  // Handle scroll to update active reel
  const handleScroll = useCallback((e) => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / height);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, reels.length]);

  // Handle like
  const handleLike = async (reelId) => {
    setReels(prevReels =>
      prevReels.map(reel =>
        reel._id === reelId
          ? {
              ...reel,
              likes: reel.likes && reel.likes.length > 0
                ? reel.likes.slice(1)
                : [{ _id: 'current-user' }]
            }
          : reel
      )
    );
  };

  if (loading) {
    return (
      <div className="reels-feed-loading">
        <div className="spinner" />
        <p>Loading reels...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="reels-feed-empty">
        <p>No reels available. Try a different filter or seed the database!</p>
        <code style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
          npm run seed:reels
        </code>
      </div>
    );
  }

  return (
    <div className="reels-feed-wrapper">
      {/* Mute toggle button */}
      <button
        className="mute-toggle"
        onClick={handleToggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {/* Reels container with snap scroll */}
      <div
        ref={containerRef}
        className="reels-feed"
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => (
          <div
            key={reel._id}
            ref={el => (reelRefs.current[index] = el)}
            data-index={index}
            className="reel-snap-item"
          >
            <ReelCard
              reel={{ ...reel, position: `${index + 1} / ${reels.length}${hasMore ? '+' : ''}` }}
              isActive={index === currentIndex}
              onLike={handleLike}
              isMuted={isMuted}
            />
          </div>
        ))}

        {/* Loading indicator at bottom */}
        {isLoadingMore && (
          <div className="reels-loading-more">
            <div className="spinner-small" />
            <p>Loading more reels...</p>
          </div>
        )}
      </div>

      {/* Empty state message if no more reels to load */}
      {!hasMore && reels.length > 0 && (
        <div className="reels-end-message">
          <p>You've reached the end of available reels</p>
        </div>
      )}
    </div>
  );
};

export default ReelsFeed;
