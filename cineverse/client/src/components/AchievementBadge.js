import React from 'react';
import './AchievementBadge.css';

const AchievementBadge = ({ achievements }) => {
  if (!achievements) return null;

  const badges = [];

  if (achievements.bingeStarter) {
    badges.push({
      id: 'binge-starter',
      emoji: '🎬',
      label: 'Binge Starter',
      title: 'Watched 5 movies'
    });
  }

  if (achievements.movieAddict) {
    badges.push({
      id: 'movie-addict',
      emoji: '🎭',
      label: 'Movie Addict',
      title: 'Watched 30 movies'
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="achievement-badges">
      {badges.map(badge => (
        <span
          key={badge.id}
          className="achievement-badge"
          title={badge.title}
        >
          {badge.emoji}
        </span>
      ))}
    </div>
  );
};

export default AchievementBadge;
