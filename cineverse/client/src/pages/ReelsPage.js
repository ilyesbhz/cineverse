import React, { useState } from 'react';
import ReelsFeed from '../components/ReelsFeed';
import CategoryFilter from '../components/CategoryFilter';

const ReelsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="reels-page-container">
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <ReelsFeed category={selectedCategory} genres={[]} />
    </div>
  );
};

export default ReelsPage;

