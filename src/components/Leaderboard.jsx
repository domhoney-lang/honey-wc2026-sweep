import React from 'react';
import ParticipantCard from './ParticipantCard';

export default function Leaderboard({ participants, searchTerm, sortBy, fixtures, globalFlip }) {
  const normalizeCountryName = (name) => {
    if (!name) return '';
    const lower = name.trim().toLowerCase();
    if (lower === 'korea republic' || lower === 'republic of korea' || lower === 'south korea') return 'south korea';
    if (lower === 'usa' || lower === 'united states of america') return 'united states';
    if (lower === 'dr congo' || lower === 'democratic republic of the congo') return 'congo dr';
    if (lower === 'cape verde') return 'cape verde islands';
    if (lower === 'bosnia and herzegovina' || lower === 'bosnia-herzegovina') return 'bosnia & herzegovina';
    if (lower === 'ivory coast' || lower === "cote d'ivoire") return "cote d'ivoire";
    if (lower === 'curaçao') return 'curacao';
    return lower;
  };

  const getNextMatchTime = (p) => {
    const activeCountries = p.countries.filter(c => c.status === 'active');
    if (activeCountries.length === 0 || !fixtures || fixtures.length === 0) return Infinity;
    
    const activeNames = activeCountries.map(c => normalizeCountryName(c.name));
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);
    
    const relevantFixtures = fixtures.filter(match => new Date(match.commence_time) > cutoffTime);
    relevantFixtures.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    
    for (const match of relevantFixtures) {
      const homeMatch = activeNames.includes(match.home_team_normalized || normalizeCountryName(match.home_team));
      const awayMatch = activeNames.includes(match.away_team_normalized || normalizeCountryName(match.away_team));
      
      if (homeMatch || awayMatch) {
        return new Date(match.commence_time).getTime();
      }
    }
    return Infinity;
  };

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

    if (sortBy === 'next_match') {
       const aTime = getNextMatchTime(a);
       const bTime = getNextMatchTime(b);
       
       if (aTime !== bTime) {
          return aTime - bTime;
       }
    }

    // Default or tie-breaker: Sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="leaderboard-grid">
      {sortedParticipants.map((player, index) => {
        const searchLower = searchTerm.toLowerCase();
        const isMatch = searchTerm === '' || 
                        player.name.toLowerCase().includes(searchLower) ||
                        player.countries.some(c => c.name.toLowerCase().includes(searchLower));
        
        // Sort countries based on the current dashboard sort mode
        const sortedCountries = [...player.countries].sort((a, b) => {
           if (sortBy === 'name') {
              return a.name.localeCompare(b.name);
           }
           if (sortBy === 'odds') {
              const aOdds = a.status === 'active' ? Number(a.price) || Infinity : Infinity;
              const bOdds = b.status === 'active' ? Number(b.price) || Infinity : Infinity;
              // If both have the same odds (e.g. both Infinity because they are eliminated), sort alphabetically
              if (aOdds === bOdds) return a.name.localeCompare(b.name);
              return aOdds - bOdds;
           }
           return 0;
        });

        if (!isMatch && searchTerm !== '') return null;

        return (
          <div 
            key={player.id} 
            className="participant-wrapper"
            style={{ '--index': index }}
          >
            <ParticipantCard 
              {...player} 
              countries={sortedCountries}
              fixtures={fixtures}
              globalFlip={globalFlip}
              allParticipants={participants}
            />
          </div>
        );
      })}
    </div>
  );
}
