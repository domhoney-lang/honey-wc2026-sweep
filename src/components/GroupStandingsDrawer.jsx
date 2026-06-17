import { useEffect } from 'react';
import { ParticipantAvatar } from './ParticipantCard';

const getFlagCode = (iso2) => {
  if (!iso2) return '';
  const code = iso2.toLowerCase();
  if (code === 'eng') return 'gb-eng';
  if (code === 'sco') return 'gb-sct';
  return code;
};

export default function GroupStandingsDrawer({ 
  isOpen, 
  onClose, 
  standings, 
  loading, 
  error, 
  onSelectParticipant,
  activeSearchTerm
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const renderSkeletons = () => {
    return Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-title skeleton-pulse" />
        <div className="skeleton-row skeleton-pulse" style={{ width: '95%' }} />
        <div className="skeleton-row skeleton-pulse" style={{ width: '85%' }} />
        <div className="skeleton-row skeleton-pulse" style={{ width: '90%' }} />
        <div className="skeleton-row skeleton-pulse" style={{ width: '80%' }} />
      </div>
    ));
  };

  return (
    <>
      <div 
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={onClose} 
      />
      
      <div className={`drawer-container ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="drawer-header">
          <h2>Group Standings</h2>
          <button 
            className="drawer-close-btn" 
            onClick={onClose} 
            aria-label="Close standings drawer"
          >
            &times;
          </button>
        </div>

        <div className="drawer-body">
          {!loading && !error && standings && standings.length > 0 && (
            <div className="standings-nav-bar">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(letter => (
                <button 
                  key={letter} 
                  className="standings-nav-btn"
                  onClick={() => {
                    const el = document.getElementById(`group-card-${letter}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}

          {loading && renderSkeletons()}

          {error && (
            <div style={{ 
              padding: '2rem 1rem', 
              textAlign: 'center', 
              background: '#fee2e2', 
              borderRadius: '1rem', 
              border: '1px solid #fecaca',
              color: '#991b1b'
            }}>
              <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{error}</p>
              <p style={{ fontSize: '0.875rem', color: '#b91c1c' }}>
                Please check your network connection or try again later.
              </p>
            </div>
          )}

          {!loading && !error && standings && standings.length > 0 && (
            standings.map((group) => (
              <div 
                key={group.groupName} 
                id={`group-card-${group.groupName.slice(-1)}`} 
                className="group-standings-card"
              >
                <div className="group-standings-header">
                  <span>{group.groupName}</span>
                </div>
                <table className="group-standings-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }} className="col-center">Pos</th>
                      <th>Team</th>
                      <th style={{ width: '35px' }} className="col-center">P</th>
                      <th style={{ width: '40px' }} className="col-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.teams.map((team, idx) => {
                      const pos = idx + 1;
                      let rowClass = 'qualify-none';
                      if (pos <= 2) rowClass = 'qualify-top2';
                      else if (pos === 3) rowClass = 'qualify-3rd';

                      const isHighlighted = activeSearchTerm && team.owner && 
                        team.owner.name.toLowerCase() === activeSearchTerm.toLowerCase();

                      return (
                        <tr 
                          key={team.team_id || team.name} 
                          className={rowClass}
                          style={{
                            backgroundColor: isHighlighted ? `${team.owner.color}1e` : undefined
                          }}
                        >
                          <td className="col-center" style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                            {pos}
                          </td>
                          <td>
                            <div className="table-team-cell">
                              <span className={`flag-icon fi fi-${getFlagCode(team.iso2)} table-flag`}></span>
                              <span style={{ textDecoration: team.owner?.status === 'eliminated' ? 'line-through' : 'none' }}>
                                {team.name}
                              </span>
                              {team.owner && (
                                <span 
                                  title={`Swept by ${team.owner.name}`}
                                  onClick={() => {
                                    onSelectParticipant(team.owner.name);
                                    onClose();
                                  }}
                                  style={{ cursor: 'pointer', display: 'inline-flex', alignSelf: 'center', marginLeft: '0.25rem' }}
                                >
                                  <ParticipantAvatar 
                                    participant={team.owner} 
                                    size="24px" 
                                    style={{ border: `1.5px solid ${team.owner.color}` }}
                                  />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="col-center">{team.mp || 0}</td>
                          <td className="col-center pts-col">{team.pts || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
