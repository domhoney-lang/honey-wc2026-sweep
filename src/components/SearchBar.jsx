import React from 'react';

export default function SearchBar({ searchTerm, onSearchChange, sortBy, onSortChange, globalFlip, onToggleFlip }) {
  return (
    <div className="controls-container">
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search for a participant or country..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button 
            className="clear-search-btn"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <div className="sort-buttons">
        <button 
          className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
          onClick={() => onSortChange('name')}
        >
          Sort by Name
        </button>
        <button 
          className={`sort-btn ${sortBy === 'odds' ? 'active' : ''}`}
          onClick={() => onSortChange('odds')}
        >
          Sort by Odds
        </button>
      </div>
      <div className="sort-buttons">
        <button 
          className="sort-btn"
          onClick={onToggleFlip}
          style={{ 
            background: globalFlip ? 'var(--color-primary)' : 'transparent', 
            color: globalFlip ? 'white' : 'var(--color-text-muted)',
            boxShadow: globalFlip ? '0 4px 14px 0 rgba(16, 185, 129, 0.39)' : 'none'
          }}
        >
          {globalFlip ? 'Unflip Cards' : 'Flip Cards'}
        </button>
      </div>
    </div>
  );
}
