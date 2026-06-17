
export default function PrizePool({ participants }) {
  // Flatten all countries with their participant owner
  const allTeams = participants.flatMap(p => 
    p.countries.map(c => ({
      ...c,
      participantName: p.name,
      participantInitials: p.initials,
      participantColor: p.color
    }))
  );

  const activeTeams = allTeams.filter(t => t.status === 'active');
  const eliminatedTeams = allTeams.filter(t => t.status === 'eliminated').sort((a, b) => (b.eliminatedAt || 0) - (a.eliminatedAt || 0));

  let winner = null;
  let runnerUp = null;
  let semi1 = null;
  let semi2 = null;

  if (activeTeams.length === 1) {
    winner = activeTeams[0];
    runnerUp = eliminatedTeams[0];
    semi1 = eliminatedTeams[1];
    semi2 = eliminatedTeams[2];
  } else if (activeTeams.length === 2) {
    winner = { pending: true, teams: activeTeams };
    runnerUp = { pending: true, teams: activeTeams };
    semi1 = eliminatedTeams[0];
    semi2 = eliminatedTeams[1];
  } else if (activeTeams.length === 3) {
    winner = { pending: true, teams: activeTeams };
    runnerUp = { pending: true, teams: activeTeams };
    semi1 = { pending: true, teams: activeTeams };
    semi2 = eliminatedTeams[0];
  } else if (activeTeams.length === 4) {
    winner = { pending: true, teams: activeTeams };
    runnerUp = { pending: true, teams: activeTeams };
    semi1 = { pending: true, teams: activeTeams };
    semi2 = { pending: true, teams: activeTeams };
  }

  const renderCandidate = (spot) => {
    if (!spot) return <div className="prize-candidates"><span className="candidate-badge">TBD</span></div>;
    
    if (spot.pending) {
      return (
        <div className="prize-candidates">
          {spot.teams.map(t => (
            <span key={t.code} className="candidate-badge slide-in">
              <span className={`fi fi-${t.code}`}></span> {t.participantName}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="prize-candidates">
        <span className="candidate-badge slide-in" style={{ borderLeft: `4px solid ${spot.participantColor}` }}>
          <div className="candidate-avatar" style={{ backgroundColor: spot.participantColor }}>{spot.participantInitials}</div>
          {spot.participantName} (<span className={`fi fi-${spot.code}`}></span>)
        </span>
      </div>
    );
  };

  return (
    <div className="prize-pool-container">
      <div className="prize-card winner">
        <div className="prize-title">Winner</div>
        <div className="prize-amount">£60</div>
        {renderCandidate(winner)}
      </div>
      <div className="prize-card runner-up">
        <div className="prize-title">Runner-Up</div>
        <div className="prize-amount">£30</div>
        {renderCandidate(runnerUp)}
      </div>
      <div className="prize-card semi-1">
        <div className="prize-title">3rd Place</div>
        <div className="prize-amount">£20</div>
        {renderCandidate(semi1)}
      </div>
      <div className="prize-card semi-2">
        <div className="prize-title">4th Place</div>
        <div className="prize-amount">£10</div>
        {renderCandidate(semi2)}
      </div>
    </div>
  );
}
