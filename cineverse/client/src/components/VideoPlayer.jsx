import React, { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';

export default function VideoPlayer({
  videoUrl,
  qualityOptions = [],
  subtitles = [],
  title = 'Video',
  thumbnail = null,
  onPlaybackStart = null,
  onProgress = null,
  onEnded = null,
  closeButton = null
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState(0);
  const [selectedSubtitle, setSelectedSubtitle] = useState('off');
  const controlsTimeoutRef = useRef(null);
  const seekAfterSourceChangeRef = useRef(null);
  const resumeAfterSourceChangeRef = useRef(false);

  const normalizedQualities = Array.isArray(qualityOptions) && qualityOptions.length > 0
    ? qualityOptions
      .filter(option => option?.url)
      .map((option, idx) => ({
        id: option.id || `${option.label || 'quality'}-${idx}`,
        label: option.label || `Source ${idx + 1}`,
        url: option.url,
        type: option.type || 'video/mp4'
      }))
    : (videoUrl ? [{ id: 'default', label: 'Auto', url: videoUrl, type: 'video/mp4' }] : []);

  const normalizedSubtitles = Array.isArray(subtitles)
    ? subtitles
      .filter(track => track?.url)
      .map((track, idx) => ({
        id: track.id || `${track.language || track.label || 'subtitle'}-${idx}`,
        label: track.label || track.language || `Subtitle ${idx + 1}`,
        src: track.url,
        srcLang: track.language || track.srcLang || 'en',
        kind: track.kind || 'subtitles',
        default: Boolean(track.default)
      }))
    : [];

  const activeQuality = normalizedQualities[selectedQuality] || normalizedQualities[0] || null;

  // Format time in MM:SS format
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle video play
  const handlePlay = () => {
    setPlaying(true);
    if (onPlaybackStart) {
      onPlaybackStart();
    }
  };

  // Handle video pause
  const handlePause = () => {
    setPlaying(false);
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (onProgress) {
        onProgress({
          currentTime: videoRef.current.currentTime,
          duration: videoRef.current.duration,
          played: videoRef.current.currentTime / videoRef.current.duration
        });
      }
    }
  };

  // Handle video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);

      if (seekAfterSourceChangeRef.current !== null) {
        videoRef.current.currentTime = Math.min(
          seekAfterSourceChangeRef.current,
          videoRef.current.duration || seekAfterSourceChangeRef.current
        );
        seekAfterSourceChangeRef.current = null;
      }

      if (resumeAfterSourceChangeRef.current) {
        videoRef.current.play().catch(() => {});
        resumeAfterSourceChangeRef.current = false;
      }
    }
    setLoading(false);
  };

  // Handle video error
  const handleVideoError = () => {
    setError('Failed to load video. Please try again later.');
    setLoading(false);
  };

  // Handle video ended
  const handleVideoEnded = () => {
    setPlaying(false);
    if (onEnded) {
      onEnded();
    }
  };

  // Handle play/pause toggle
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Play error:', err);
        });
      }
    }
  };

  // Handle seek
  const handleSeek = (e) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.querySelector('.progress-bar').getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;

    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (fullscreen) {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setFullscreen(false);
      } else {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
          setFullscreen(true);
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          break;
        case 'ArrowRight':
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
          break;
        case 'KeyM':
          setVolume(volume === 0 ? 1 : 0);
          if (videoRef.current) {
            videoRef.current.volume = volume === 0 ? 1 : 0;
          }
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playing, duration, volume]);

  // Keep selected quality index valid as options change.
  useEffect(() => {
    if (!normalizedQualities.length) {
      setSelectedQuality(0);
      return;
    }

    if (selectedQuality > normalizedQualities.length - 1) {
      setSelectedQuality(0);
    }
  }, [normalizedQualities, selectedQuality]);

  useEffect(() => {
    if (!normalizedSubtitles.length) {
      setSelectedSubtitle('off');
      return;
    }

    const defaultTrackIndex = normalizedSubtitles.findIndex(track => track.default);
    if (defaultTrackIndex >= 0) {
      setSelectedSubtitle(String(defaultTrackIndex));
    } else {
      setSelectedSubtitle('off');
    }
  }, [normalizedSubtitles]);

  // Apply subtitle visibility based on selected option.
  useEffect(() => {
    if (!videoRef.current || !videoRef.current.textTracks) return;

    const tracks = videoRef.current.textTracks;
    for (let i = 0; i < tracks.length; i += 1) {
      tracks[i].mode = selectedSubtitle === String(i) ? 'showing' : 'disabled';
    }
  }, [selectedSubtitle, activeQuality]);

  // Handle controls visibility on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  if (error) {
    return (
      <div className="video-player-error">
        <div className="error-icon">⚠️</div>
        <div className="error-title">Video Unavailable</div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div
      className="video-player-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {loading && (
        <div className="video-loader">
          <div className="spinner" />
        </div>
      )}

      <video
        ref={videoRef}
        className="video-element"
        preload="metadata"
        poster={thumbnail}
        src={activeQuality?.url || ''}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
        onEnded={handleVideoEnded}
        onLoadStart={() => setLoading(true)}
      >
        {normalizedSubtitles.map((track) => (
          <track
            key={track.id}
            kind={track.kind}
            src={track.src}
            srcLang={track.srcLang}
            label={track.label}
            default={track.default}
          />
        ))}
        Your browser does not support the video tag.
      </video>

      {/* Controls */}
      <div className={`video-controls ${showControls ? 'visible' : 'hidden'}`}>
        {/* Progress bar */}
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            onClick={handleSeek}
            style={{ cursor: 'pointer' }}
          >
            <div
              className="progress-fill"
              style={{
                width: `${(currentTime / duration) * 100 || 0}%`
              }}
            />
            <div
              className="progress-handle"
              style={{
                left: `${(currentTime / duration) * 100 || 0}%`
              }}
            />
          </div>
        </div>

        {/* Control buttons */}
        <div className="controls-bottom">
          {/* Left side: Play, Volume */}
          <div className="controls-left">
            <button
              className="control-btn play-btn"
              onClick={togglePlayPause}
              title={playing ? 'Pause (Space)' : 'Play (Space)'}
            >
              {playing ? '⏸' : '▶'}
            </button>

            <div className="volume-control">
              <button
                className="control-btn"
                onClick={() => {
                  const newVol = volume === 0 ? 1 : 0;
                  setVolume(newVol);
                  if (videoRef.current) {
                    videoRef.current.volume = newVol;
                  }
                }}
                title="Mute (M)"
              >
                {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                title="Volume"
              />
            </div>

            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right side: Quality, Subtitles, Fullscreen */}
          <div className="controls-right">
            {normalizedQualities.length > 1 && (
              <select
                className="control-select"
                value={selectedQuality}
                onChange={(e) => {
                  if (!videoRef.current) return;

                  seekAfterSourceChangeRef.current = videoRef.current.currentTime;
                  resumeAfterSourceChangeRef.current = !videoRef.current.paused;
                  setSelectedQuality(parseInt(e.target.value, 10));
                }}
                title="Video quality"
              >
                {normalizedQualities.map((quality, idx) => (
                  <option key={quality.id} value={idx}>{quality.label}</option>
                ))}
              </select>
            )}

            {normalizedSubtitles.length > 0 && (
              <select
                className="control-select"
                value={selectedSubtitle}
                onChange={(e) => setSelectedSubtitle(e.target.value)}
                title="Subtitles"
              >
                <option value="off">Off</option>
                {normalizedSubtitles.map((track, idx) => (
                  <option key={track.id} value={String(idx)}>{track.label}</option>
                ))}
              </select>
            )}

            <button
              className="control-btn fullscreen-btn"
              onClick={toggleFullscreen}
              title={fullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {fullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      </div>

      {/* Title overlay */}
      <div className={`video-title-overlay ${showControls ? 'visible' : 'hidden'}`}>
        <h2>{title}</h2>
      </div>

      {/* Close button */}
      {closeButton}
    </div>
  );
}
