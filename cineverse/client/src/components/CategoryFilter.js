import React from 'react';
import './CategoryFilter.css';

const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  const categories = [
    { value: 'all', label: 'All' },
    { value: 'trailer', label: 'Trailers' },
    { value: 'interview', label: 'Interviews' },
    { value: 'edit', label: 'Edits' },
    { value: 'review', label: 'Reviews' },
    { value: 'documentary', label: 'Docs' }
  ];

  return (
    <div className="category-filter-container">
      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`category-pill ${selectedCategory === cat.value ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
