import React from 'react';
import ParticipantCard from './ParticipantCard';

export default function Leaderboard({ participants, searchTerm, sortBy }) {
  const sortedParticipants = [...participants].sort((a, b) => {
    // Check if fully eliminated
    const aEliminated = a.countries.length > 0 && a.countries.every(c => c.status === 'eliminated');
    const bEliminated = b.countries.length > 0 && b.countries.every(c => c.status === 'eliminated');

    if (aEliminated && !bEliminated) return 1;
    if (!aEliminated && bEliminated) return -1;
    
    if (sortBy === 'odds') {
       // Find the best (lowest) odds for active teams of each participant
       const getBestOdds = (p) => {
          const activeOdds = p.countries
             .filter(c => c.status === 'active')
             .map(c => Number(c.price) || Infinity);
          return activeOdds.length > 0 ? Math.min(...activeOdds) : Infinity;
       };
       
       const aBest = getBestOdds(a);
       const bBest = getBestOdds(b);
       
       if (aBest !== bBest) {
          return aBest - bBest;
       }
    }

    // Default or tie-breaker: Sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="leaderboard-grid">
      {sortedParticipants.map((player, index) => {
        const isMatch = searchTerm === '' || player.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        return (
          <div 
            key={player.id} 
            className={`participant-wrapper ${!isMatch && searchTerm !== '' ? 'dimmed' : ''}`}
            style={{ '--index': index }}
          >
            <ParticipantCard 
              {...player} 
            />
          </div>
        );
      })}
    </div>
  );
}
