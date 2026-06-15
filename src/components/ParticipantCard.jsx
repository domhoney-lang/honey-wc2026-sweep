import React, { useState, useEffect } from 'react';

const ParticipantAvatar = ({ participant, size = '48px', style = {} }) => {
  const [imgSrc, setImgSrc] = useState(`/avatars/${participant.name.toLowerCase()}.jpg`);
  const [useFallback, setUseFallback] = useState(false);

  const handleImgError = () => {
    if (imgSrc.endsWith('.jpg')) {
      setImgSrc(`/avatars/${participant.name.toLowerCase()}.png`);
    } else if (imgSrc.endsWith('.png')) {
      setImgSrc(`/avatars/${participant.name.toLowerCase()}.jpeg`);
    } else {
      setUseFallback(true);
    }
  };

  if (useFallback) {
    return (
      <div 
        className="avatar" 
        style={{ 
          backgroundColor: participant.color, 
          width: size, 
          height: size, 
          fontSize: size === '80px' ? '2rem' : '1rem', 
          margin: size === '80px' ? '0 auto 1.5rem auto' : '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style
        }}
      >
        {participant.initials}
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={participant.name} 
      onError={handleImgError}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        objectFit: 'cover', 
        border: `2px solid ${participant.color}`,
        boxShadow: size === '80px' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        flexShrink: 0,
        marginBottom: size === '80px' ? '1.5rem' : '0',
        ...style
      }}
    />
  );
};

export default function ParticipantCard({ id, name, initials, color, countries, style, fixtures = [], globalFlip, allParticipants = [] }) {
  const isEliminated = countries.length > 0 && countries.every(c => c.status === 'eliminated');
  
  const [isFlipped, setIsFlipped] = useState(false);
  
  useEffect(() => {
    setIsFlipped(globalFlip);
  }, [globalFlip]);

  // Avatar state has been extracted to ParticipantAvatar

  const decimalToFraction = (decimal) => {
    let d = Number(decimal) - 1;
    if (d <= 0) return 'Evens';
    if (Math.abs(d - 0.333) < 0.01) return '1/3';
    if (Math.abs(d - 0.667) < 0.01) return '2/3';
    
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = d;
    do {
        let a = Math.floor(b);
        let aux = h1; h1 = a * h1 + h2; h2 = aux;
        aux = k1; k1 = a * k1 + k2; k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(d - h1 / k1) > d * 1.0E-5);
    return `${h1}/${k1}`;
  };

  const getOddsTier = (price) => {
    if (!price) return '';
    const numPrice = Number(price);
    if (numPrice < 15) return 'favorite';    // Likely to win (e.g. 5.0 to 14.0)
    if (numPrice < 100) return 'middling';   // Dark horses (e.g. 15.0 to 99.0)
    return 'poor';                           // Outsiders (e.g. 100.0+)
  };

  const activeCountries = countries.filter(c => c.status === 'active' && c.price);

  const winProbability = activeCountries.length > 0 
    ? activeCountries.reduce((sum, c) => sum + (1 / Number(c.price)), 0) * 100 
    : 0;

  const bestHope = activeCountries.length > 0 
    ? activeCountries.reduce((best, current) => Number(current.price) < Number(best.price) ? current : best) 
    : null;

  const getNextMatch = () => {
    if (activeCountries.length === 0 || !fixtures || fixtures.length === 0) return null;
    
    const activeNames = activeCountries.map(c => c.name.toLowerCase());
    
    const sortedFixtures = [...fixtures].sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    
    for (const match of sortedFixtures) {
      const homeMatch = activeNames.includes(match.home_team_normalized);
      const awayMatch = activeNames.includes(match.away_team_normalized);
      
      if (homeMatch || awayMatch) {
        return {
          ...match,
          isHome: homeMatch
        };
      }
    }
    return null;
  };

  const nextMatch = getNextMatch();

  const getOpponent = () => {
    if (!nextMatch || !allParticipants || allParticipants.length === 0) return null;
    const opponentTeamNormalized = nextMatch.isHome ? nextMatch.away_team_normalized : nextMatch.home_team_normalized;
    return allParticipants.find(p => p.countries.some(c => c.name.toLowerCase() === opponentTeamNormalized));
  };

  const opponent = getOpponent();

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (diffDays === 0) return `TODAY AT ${timeString}`;
    if (diffDays === 1) return `TOMORROW AT ${timeString}`;
    return `IN ${diffDays} DAYS AT ${timeString}`;
  };

  return (
    <div className={`participant-card-container stagger-fade-in ${isFlipped ? 'flipped' : ''}`} style={{ ...style, cursor: 'pointer' }} onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`participant-card flip-card-inner ${isEliminated ? 'eliminated-card' : ''}`}>
        
        {/* FRONT FACE */}
        <div className="flip-card-front" style={{ borderTop: `4px solid ${color}` }}>
          <div className="card-header">
            <ParticipantAvatar participant={{ name, initials, color }} size="48px" />
            <h3 className="participant-name">{name}</h3>
          </div>
          <div className="countries-list">
            {countries.map((country) => (
              <div 
                key={country.code} 
                className={`country-toggle ${country.status}`}
                title={`${country.name} - ${country.status}`}
                style={{ cursor: 'pointer' }}
              >
                <span className={`fi fi-${country.code} flag-icon`}></span>
                <span className="country-name">{country.name}</span>
                {country.status === 'active' && country.price && (
                  <span className={`odds-badge slide-in ${getOddsTier(country.price)}`}>
                    [{decimalToFraction(country.price)}]
                  </span>
                )}
                {country.status === 'eliminated' && <span className="eliminated-badge slide-in">Eliminated</span>}
              </div>
            ))}
          </div>
        </div>

        {/* BACK FACE */}
        <div className="flip-card-back" style={{ borderTop: `4px solid ${color}` }}>
          <div className="back-header" style={{ textAlign: 'center' }}>
            <ParticipantAvatar participant={{ name, initials, color }} size="80px" style={{ borderWidth: '3px' }} />
          </div>
          
          {!isEliminated && (
            <div className="stats-container">
              <div className="stat-box">
                <span className="stat-label">Win Probability</span>
                <span className="stat-value">{winProbability.toFixed(1)}%</span>
              </div>
              {bestHope && (
                <div className="stat-box">
                  <span className="stat-label">Best Hope</span>
                  <span className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className={`fi fi-${bestHope.code} flag-icon`}></span>
                    {bestHope.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {!isEliminated && nextMatch && (
             <div className="next-match-container">
               <span className="match-label">Next Match</span>
               <div className="match-time">{getRelativeTime(nextMatch.commence_time)}</div>
               <div className="matchup">
                 <span className={nextMatch.isHome ? 'active-team' : 'muted-team'}>{nextMatch.home_team}</span>
                 <span className="vs"> vs </span>
                 <span className={!nextMatch.isHome ? 'active-team' : 'muted-team'}>{nextMatch.away_team}</span>
               </div>
               {opponent && (
                 <div className="up-against-container" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <span className="match-label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Up Against</span>
                   <ParticipantAvatar participant={opponent} size="40px" />
                   <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '500' }}>{opponent.name}</span>
                 </div>
               )}
             </div>
          )}

          {isEliminated && (
             <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--color-eliminated-text)' }}>
               All teams eliminated
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
