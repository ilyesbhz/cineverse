import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const MovieReelsFeed = () => {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchMovieReels = async () => {
      try {
        const res = await api.get('/movie-reels');
        setReels(res.data || []);
      } catch (error) {
        console.error('Error fetching movie reels:', error);
        setReels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovieReels();
  }, []);

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const height = e.target.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleLike = (id) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShare = (reel) => {
    const url = reel.trailerKey
      ? `https://www.youtube.com/watch?v=${reel.trailerKey}`
      : `https://www.themoviedb.org/movie/${reel.id}`;
    if (navigator.share) {
      navigator.share({
        title: reel.title,
        text: `Check out ${reel.title} on Cineverse!`,
        url,
      }).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading movie edits...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p className="text-gray-400">No movie edits available.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
      onScroll={handleScroll}
    >
      {reels.map((reel, index) => (
        <div
          key={reel.id}
          className="h-screen snap-start relative flex items-center justify-center bg-black"
        >
          {/* Poster background (blurred) */}
          <div
            className="absolute inset-0 bg-center bg-cover blur-2xl opacity-30"
            style={{ backgroundImage: `url(${reel.backdrop || reel.poster})` }}
          />

          {/* YouTube trailer embed */}
          {index === currentIndex && reel.trailerKey ? (
            <iframe
              className="relative w-full h-full sm:w-[400px] sm:h-[90vh] sm:rounded-xl"
              src={`https://www.youtube.com/embed/${reel.trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${reel.trailerKey}&modestbranding=1&rel=0&showinfo=0`}
              title={reel.title}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ border: 'none' }}
            />
          ) : (
            <img
              className="relative h-full w-full object-cover sm:w-[400px] sm:h-[90vh] sm:rounded-xl"
              src={reel.poster}
              alt={reel.title}
            />
          )}

          {/* Right side actions */}
          <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5">
            {/* Like */}
            <button
              type="button"
              onClick={() => handleLike(reel.id)}
              className="flex flex-col items-center"
            >
              <span className={`text-2xl ${liked[reel.id] ? 'text-red-500' : 'text-white'}`}>
                {liked[reel.id] ? '❤️' : '🤍'}
              </span>
              <span className="text-xs text-gray-300 mt-1">Like</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={() => handleShare(reel)}
              className="flex flex-col items-center"
            >
              <span className="text-2xl">🔗</span>
              <span className="text-xs text-gray-300 mt-1">Share</span>
            </button>

            {/* Full trailer link */}
            {reel.trailerKey && (
              <a
                href={`https://www.youtube.com/watch?v=${reel.trailerKey}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center"
              >
                <span className="text-2xl">▶️</span>
                <span className="text-xs text-gray-300 mt-1">Trailer</span>
              </a>
            )}

            {/* TMDB link */}
            <a
              href={`https://www.themoviedb.org/movie/${reel.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center"
            >
              <span className="text-2xl">🎬</span>
              <span className="text-xs text-gray-300 mt-1">TMDB</span>
            </a>
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <div className="max-w-md">
              <h3 className="text-xl font-bold mb-1">{reel.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <span>{reel.year}</span>
                <span>•</span>
                <span>⭐ {reel.rating}</span>
                <span>•</span>
                <span>{reel.genre}</span>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 mb-2">{reel.plot}</p>
              {(reel.director || reel.actors) && (
                <div className="text-xs text-gray-500">
                  {reel.director && <>🎬 {reel.director}</>}
                  {reel.director && reel.actors && <> &nbsp;|&nbsp; </>}
                  {reel.actors && <>🎭 {reel.actors}</>}
                </div>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs text-gray-300">
            {index + 1} / {reels.length}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MovieReelsFeed;
