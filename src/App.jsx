import React, { useState, useEffect } from 'react';
import { initialParticipants, THE_ODDS_API_KEY } from './data';
import PrizePool from './components/PrizePool';
import SearchBar from './components/SearchBar';
import Leaderboard from './components/Leaderboard';
import GroupStandingsDrawer from './components/GroupStandingsDrawer';

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

export default function App() {
  const [participants, setParticipants] = useState(initialParticipants);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [globalFlip, setGlobalFlip] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [standings, setStandings] = useState([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState(null);

  useEffect(() => {
    async function fetchOdds() {
      if (!THE_ODDS_API_KEY || THE_ODDS_API_KEY === 'YOUR_API_KEY_HERE') {
        return;
      }

      const CACHE_KEY = 'oddsDataCache';
      const CACHE_TIME_KEY = 'oddsDataTimestamp';
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      const applyOddsMap = (oddsMap) => {
        setParticipants(prev => prev.map(p => ({
          ...p,
          countries: p.countries.map(c => {
             const normalizedKey = normalizeCountryName(c.name);
             const price = oddsMap[normalizedKey];
             
             if (price === undefined) {
                return { ...c, status: 'eliminated', eliminatedAt: c.eliminatedAt || Date.now(), price: null };
             } else {
                return { ...c, status: 'active', eliminatedAt: null, price: price };
             }
          })
        })));
      };

      const FIXTURES_CACHE_KEY = 'fixturesDataCache';
      const FIXTURES_CACHE_TIME_KEY = 'fixturesDataTimestamp';

      // Check LocalStorage Cache
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

      let isOutrightCached = false;
      if (cachedData && cachedTime && (Date.now() - Number(cachedTime) < ONE_DAY_MS)) {
        try {
          const oddsMap = JSON.parse(cachedData);
          applyOddsMap(oddsMap);
          isOutrightCached = true;
        } catch(e) {
          console.error("Failed to parse cached odds data", e);
        }
      }

      const cachedFixtures = localStorage.getItem(FIXTURES_CACHE_KEY);
      const cachedFixturesTime = localStorage.getItem(FIXTURES_CACHE_TIME_KEY);

      let isFixturesCached = false;
      if (cachedFixtures && cachedFixturesTime && (Date.now() - Number(cachedFixturesTime) < ONE_DAY_MS)) {
        try {
          const fixturesData = JSON.parse(cachedFixtures);
          setFixtures(fixturesData);
          isFixturesCached = true;
        } catch(e) {
          console.error("Failed to parse cached fixtures data", e);
        }
      }

      if (isOutrightCached && isFixturesCached) return;

      setLoading(true);
      setError(null);
      
      try {
        if (!isOutrightCached) {
          const url = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup_winner/odds/?apiKey=${THE_ODDS_API_KEY}&regions=uk&markets=outrights&oddsFormat=decimal`;
          const response = await fetch(url);
          
          if (response.status === 401) throw new Error("Invalid API Key");
          if (response.status === 429) throw new Error("API Rate Limit Exceeded");
          if (!response.ok) throw new Error("Failed to fetch live odds data");
          
          const data = await response.json();
          
          if (!data || data.length === 0) {
            throw new Error("No World Cup outrights market found at this time");
          }

          const event = data[0];
          const bookies = event.bookmakers;
          
          if (!bookies || bookies.length === 0) {
             throw new Error("No bookmaker data available");
          }

          let selectedBookie = bookies.find(b => b.key === 'bet365') 
                            || bookies.find(b => b.key === 'skybet') 
                            || bookies.find(b => b.key === 'williamhill') 
                            || bookies[0];

          const outrightMarket = selectedBookie.markets.find(m => m.key === 'outrights');
          
          if (!outrightMarket || !outrightMarket.outcomes) {
            throw new Error("Outrights market data is empty");
          }

          const oddsMap = {};
          outrightMarket.outcomes.forEach(outcome => {
             oddsMap[normalizeCountryName(outcome.name)] = outcome.price;
          });

          // Save to cache for 24 hours
          localStorage.setItem(CACHE_KEY, JSON.stringify(oddsMap));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

          applyOddsMap(oddsMap);
        }

        if (!isFixturesCached) {
          const url = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${THE_ODDS_API_KEY}&regions=uk&markets=h2h`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const normalizedFixtures = data.map(match => ({
               ...match,
               home_team_normalized: normalizeCountryName(match.home_team),
               away_team_normalized: normalizeCountryName(match.away_team)
            }));
            localStorage.setItem(FIXTURES_CACHE_KEY, JSON.stringify(normalizedFixtures));
            localStorage.setItem(FIXTURES_CACHE_TIME_KEY, Date.now().toString());
            setFixtures(normalizedFixtures);
          }
        }

      } catch (err) {
        console.error(err);
        setError(err.message || "An error occurred fetching live data.");
      } finally {
        setLoading(false);
      }
    }

    fetchOdds();
  }, []);

  useEffect(() => {
    async function fetchStandings() {
      const STANDINGS_CACHE_KEY = 'standingsDataCache';
      const STANDINGS_CACHE_TIME_KEY = 'standingsDataTimestamp';
      const ONE_HOUR_MS = 60 * 60 * 1000;

      const cachedData = localStorage.getItem(STANDINGS_CACHE_KEY);
      const cachedTime = localStorage.getItem(STANDINGS_CACHE_TIME_KEY);

      if (cachedData && cachedTime && (Date.now() - Number(cachedTime) < ONE_HOUR_MS)) {
        try {
          setStandings(JSON.parse(cachedData));
          return;
        } catch (e) {
          console.error("Failed to parse cached standings data", e);
        }
      }

      setStandingsLoading(true);
      setStandingsError(null);

      try {
        const [resGroups, resTeams] = await Promise.all([
          fetch('https://worldcup26.ir/get/groups'),
          fetch('https://worldcup26.ir/get/teams')
        ]);

        if (!resGroups.ok || !resTeams.ok) {
          throw new Error("Failed to fetch live standings data");
        }

        const [groupsData, teamsData] = await Promise.all([
          resGroups.json(),
          resTeams.json()
        ]);

        if (!groupsData || !groupsData.groups || !teamsData || !teamsData.teams) {
          throw new Error("Standings data structure is invalid");
        }

        const teamsMap = {};
        teamsData.teams.forEach(t => {
          teamsMap[t.id] = t;
        });

        const sortedGroups = [...groupsData.groups].sort((a, b) => a.name.localeCompare(b.name));

        const processed = sortedGroups.map(g => {
          const enrichedTeams = g.teams.map(t => {
            const teamDetails = teamsMap[t.team_id] || {};
            return {
              team_id: t.team_id,
              mp: t.mp,
              w: t.w,
              d: t.d,
              l: t.l,
              gf: t.gf,
              ga: t.ga,
              gd: t.gd,
              pts: t.pts,
              name: teamDetails.name_en || 'Unknown',
              iso2: teamDetails.iso2 || ''
            };
          });

          // Sort by points, goal diff, goals for
          enrichedTeams.sort((a, b) => {
            const ptsA = parseInt(a.pts) || 0;
            const ptsB = parseInt(b.pts) || 0;
            if (ptsB !== ptsA) return ptsB - ptsA;

            const gdA = parseInt(a.gd) || 0;
            const gdB = parseInt(b.gd) || 0;
            if (gdB !== gdA) return gdB - gdA;

            const gfA = parseInt(a.gf) || 0;
            const gfB = parseInt(b.gf) || 0;
            return gfB - gfA;
          });

          return {
            groupName: `Group ${g.name}`,
            teams: enrichedTeams
          };
        });

        localStorage.setItem(STANDINGS_CACHE_KEY, JSON.stringify(processed));
        localStorage.setItem(STANDINGS_CACHE_TIME_KEY, Date.now().toString());

        setStandings(processed);
      } catch (err) {
        console.error(err);
        setStandingsError("Failed to load live group standings.");
      } finally {
        setStandingsLoading(false);
      }
    }

    fetchStandings();
  }, []);

  const enrichedStandings = React.useMemo(() => {
    const getTeamOwner = (teamName) => {
      const normalizedName = normalizeCountryName(teamName);
      for (const p of participants) {
        const matched = p.countries.find(c => normalizeCountryName(c.name) === normalizedName);
        if (matched) {
          return p;
        }
      }
      return null;
    };

    return standings.map(g => ({
      ...g,
      teams: g.teams.map(t => ({
        ...t,
        owner: getTeamOwner(t.name)
      }))
    }));
  }, [standings, participants]);

  const handleSelectParticipant = (name) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => setSearchTerm(name));
    } else {
      setSearchTerm(name);
    }
  };

  const handleSearchChange = (val) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => setSearchTerm(val));
    } else {
      setSearchTerm(val);
    }
  };

  const handleSortChange = (val) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => setSortBy(val));
    } else {
      setSortBy(val);
    }
  };

  const handleToggleFlip = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => setGlobalFlip(prev => !prev));
    } else {
      setGlobalFlip(prev => !prev);
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <img src="https://upload.wikimedia.org/wikipedia/en/thumb/1/17/2026_FIFA_World_Cup_emblem.svg/960px-2026_FIFA_World_Cup_emblem.svg.png" alt="FIFA World Cup 2026 Logo" style={{ height: '80px', objectFit: 'contain' }} />
          <h1 className="title" style={{ marginBottom: 0 }}>Honey Sweepstake</h1>
        </div>
        {error && <div style={{ color: '#ef4444', background: '#fee2e2', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}
        <PrizePool participants={participants} />
      </header>
      
      <main>
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
          sortBy={sortBy}
          onSortChange={handleSortChange}
          globalFlip={globalFlip}
          onToggleFlip={handleToggleFlip}
          onToggleDrawer={() => setIsDrawerOpen(prev => !prev)}
        />
        {loading ? (
           <div style={{ textAlign: 'center', padding: '2rem', fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>
             Fetching live odds from The Odds API...
           </div>
        ) : (
          <Leaderboard 
            participants={participants} 
            searchTerm={searchTerm} 
            sortBy={sortBy}
            fixtures={fixtures}
            globalFlip={globalFlip}
          />
        )}
      </main>

      <GroupStandingsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        standings={enrichedStandings}
        loading={standingsLoading}
        error={standingsError}
        onSelectParticipant={handleSelectParticipant}
        activeSearchTerm={searchTerm}
      />
    </div>
  );
}
