
export default function SearchBar({ searchTerm, onSearchChange, sortBy, onSortChange, globalFlip, onToggleFlip, onToggleDrawer }) {
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
      <div className="sort-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500, paddingLeft: '1rem', paddingRight: '0.25rem' }}>Sort:</span>
        <button 
          className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
          onClick={() => onSortChange('name')}
        >
          Name
        </button>
        <button 
          className={`sort-btn ${sortBy === 'odds' ? 'active' : ''}`}
          onClick={() => onSortChange('odds')}
        >
          Odds
        </button>
        <button 
          className={`sort-btn ${sortBy === 'next_match' ? 'active' : ''}`}
          onClick={() => onSortChange('next_match')}
        >
          Next Match
        </button>
      </div>
      <div className="sort-buttons" style={{ display: 'flex', gap: '0.25rem' }}>
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
        <button 
          className="sort-btn"
          onClick={onToggleDrawer}
          style={{
            background: 'transparent',
            color: 'var(--color-text-muted)'
          }}
        >
          🏆 Group Tables
        </button>
      </div>
    </div>
  );
}
