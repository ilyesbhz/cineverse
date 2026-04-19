import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { streamxApi } from '../services/api';

const MEDIA_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const asArray = (value) => (Array.isArray(value) ? value : []);

const normalizeUserReels = (items) =>
  asArray(items).map((item) => ({
    ...item,
    type: 'user',
    reelId: item._id || item.id,
  }));

const normalizeTmdbReels = (items) =>
  asArray(items).map((item) => ({
    ...item,
    type: 'tmdb',
    reelId: item.id,
  }));

const buildHybridFeed = (userReels, tmdbReels) => {
  const combined = [];
  let userIndex = 0;
  let tmdbIndex = 0;

  while (userIndex < userReels.length || tmdbIndex < tmdbReels.length) {
    if (tmdbIndex < tmdbReels.length) {
      combined.push(tmdbReels[tmdbIndex]);
      tmdbIndex += 1;
    }

    if (tmdbIndex < tmdbReels.length) {
      combined.push(tmdbReels[tmdbIndex]);
      tmdbIndex += 1;
    }

    if (userIndex < userReels.length) {
      combined.push(userReels[userIndex]);
      userIndex += 1;
    }
  }

  return combined;
};

const CineverseReelsFeed = () => {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState({});
  const videoRefs = useRef([]);
  const viewedReels = useRef(new Set());

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const [userResponse, tmdbResponse] = await Promise.all([
          streamxApi.getReels().catch(() => ({ data: [] })),
          streamxApi.getMovieReels().catch(() => ({ data: [] })),
        ]);

        const userReels = normalizeUserReels(userResponse.data);
        const tmdbReels = normalizeTmdbReels(tmdbResponse.data);
        setReels(buildHybridFeed(userReels, tmdbReels));
      } catch (error) {
        console.error('Error fetching reels:', error);
        setReels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, []);

  useEffect(() => {
    const activeVideo = videoRefs.current[currentIndex];
    if (activeVideo?.play) {
      activeVideo.play().catch(() => {});
    }

    const activeReel = reels[currentIndex];
    if (activeReel?.type === 'user' && activeReel.reelId && !viewedReels.current.has(activeReel.reelId)) {
      viewedReels.current.add(activeReel.reelId);
      streamxApi.addReelView(activeReel.reelId).catch(() => {});
    }
  }, [currentIndex, reels]);

  const handleScroll = (event) => {
    const scrollTop = event.target.scrollTop;
    const height = event.target.clientHeight;
    const newIndex = Math.round(scrollTop / height);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      const previousVideo = videoRefs.current[currentIndex];
      if (previousVideo?.pause) {
        previousVideo.pause();
      }
      setCurrentIndex(newIndex);
    }
  };

  const updateUserLike = (reelId) => {
    setLiked((prev) => ({ ...prev, [reelId]: !prev[reelId] }));
    setReels((prev) => prev.map((reel) => (
      reel.reelId === reelId ? { ...reel, likes: (reel.likes || 0) + 1 } : reel
    )));
  };

  const handleLike = async (reel) => {
    try {
      if (reel.type === 'user') {
        await streamxApi.likeReel(reel.reelId);
        updateUserLike(reel.reelId);
        return;
      }

      setLiked((prev) => ({ ...prev, [reel.reelId]: !prev[reel.reelId] }));
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleShare = async (reel) => {
    const reelUrl = `${window.location.origin}/reels`;
    const shareText = reel.type === 'user'
      ? `Watch "${reel.title}" on Cineverse`
      : `Watch the trailer reel for "${reel.title}" on Cineverse`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: reel.title,
          text: shareText,
          url: reelUrl,
        });
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${shareText}\n${reelUrl}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#111827,_#000)] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p className="text-sm text-white/70">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#111827,_#000)] px-6 text-white">
        <div className="max-w-md text-center">
          <p className="mb-4 text-5xl">🎬</p>
          <h2 className="mb-2 text-3xl font-semibold">No reels available</h2>
          <p className="mb-6 text-sm text-white/65">There are no uploaded reels or trailer reels to show yet.</p>
          <Link
            to="/reels/upload"
            className="inline-flex items-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400"
          >
            Upload reel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black text-white"
      onScroll={handleScroll}
    >
      {reels.map((reel, index) => {
        const isActive = index === currentIndex;
        const isLiked = !!liked[reel.reelId];
        const creatorName = reel.uploadedBy?.name || reel.uploadedBy?.username || 'Anonymous';
        const backdropImage = reel.type === 'user'
          ? `${MEDIA_BASE_URL}${reel.videoUrl}`
          : (reel.backdrop || reel.poster);

        return (
          <section
            key={`${reel.type}-${reel.reelId}`}
            className="relative flex h-screen items-center justify-center snap-start overflow-hidden"
          >
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-35"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.9)), url(${backdropImage})`,
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10" />

            {reel.type === 'user' ? (
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                className="relative z-10 h-full w-full object-contain sm:max-w-4xl"
                src={`${MEDIA_BASE_URL}${reel.videoUrl}`}
                loop
                playsInline
                muted
                controls={false}
              />
            ) : isActive && reel.trailerKey ? (
              <iframe
                className="relative z-10 h-full w-full sm:max-w-4xl"
                src={`https://www.youtube.com/embed/${reel.trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${reel.trailerKey}&modestbranding=1&rel=0&showinfo=0`}
                title={reel.title}
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{ border: 'none' }}
              />
            ) : (
              <div className="relative z-10 flex h-full w-full items-center justify-center sm:max-w-4xl">
                <img
                  className="h-full w-full object-cover"
                  src={reel.poster}
                  alt={reel.title}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
                  <div className="rounded-full border border-white/15 bg-black/30 px-6 py-5 text-center">
                    <div className="text-5xl">▶️</div>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/70">Scroll to play</p>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute right-4 bottom-28 z-20 flex flex-col gap-4 sm:right-8">
              <button
                type="button"
                onClick={() => handleLike(reel)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-3 backdrop-blur-md transition hover:bg-black/50"
              >
                <span className="text-2xl leading-none">{isLiked ? '❤️' : '🤍'}</span>
                <span className="text-xs text-white/70">{reel.likes || 0}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShare(reel)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-3 backdrop-blur-md transition hover:bg-black/50"
              >
                <span className="text-2xl leading-none">📤</span>
                <span className="text-xs text-white/70">Share</span>
              </button>

              <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-3 backdrop-blur-md">
                <span className="text-2xl leading-none">👁️</span>
                <span className="text-xs text-white/70">{reel.type === 'user' ? (reel.views || 0) : 'TMDB'}</span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/85 to-transparent px-5 pb-7 pt-20 sm:px-8">
              <div className="max-w-3xl">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex-1">
                    <p className="mb-1 text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                      {isActive ? 'Now playing' : reel.type === 'user' ? 'Edit' : 'Trailer reel'}
                    </p>
                    <h2 className="text-2xl font-semibold leading-tight sm:text-4xl">
                      {reel.title}
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm">
                    {reel.type === 'user' ? 'Edit' : 'Trailer'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <span>by {creatorName}</span>
                  <span className="text-white/30">•</span>
                  <span>{reel.type === 'user' ? new Date(reel.createdAt).toLocaleDateString() : reel.year}</span>
                  {reel.type !== 'user' && (
                    <>
                      <span className="text-white/30">•</span>
                      <span>{reel.genre}</span>
                    </>
                  )}
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                  {reel.type === 'user'
                    ? 'Short-form reel feed built for user uploads.'
                    : reel.plot}
                </p>
              </div>
            </div>

            <div className="absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-xs font-medium text-white/70 backdrop-blur-md sm:left-6 sm:top-6">
              {index + 1} / {reels.length}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default CineverseReelsFeed;
