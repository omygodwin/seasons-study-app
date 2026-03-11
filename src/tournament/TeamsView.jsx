import { useState, useEffect, useRef } from 'react';
import { divisions, getTeamsByDivision, isTeamEliminated, getTeamNextGame, getGameResults, courts } from '../data/tournamentData';

export default function TeamsView({ selectedChild, focusTeam, onFocusHandled, onGameClick }) {
  const [expandedTeams, setExpandedTeams] = useState(() => {
    const initial = new Set();
    if (selectedChild) initial.add(selectedChild.teamName);
    return initial;
  });
  const [gameResults, setGameResults] = useState(getGameResults());
  const focusRef = useRef(null);
  const prevFocusTeam = useRef(null);

  useEffect(() => {
    function handleFocus() { setGameResults(getGameResults()); }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (focusTeam && focusTeam !== prevFocusTeam.current) {
      prevFocusTeam.current = focusTeam;
      setExpandedTeams((prev) => new Set([...prev, focusTeam]));
      setTimeout(() => {
        if (focusRef.current) {
          focusRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (onFocusHandled) onFocusHandled();
      }, 100);
    }
  }, [focusTeam, onFocusHandled]);

  function toggleTeam(name) {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  function expandAll() {
    const all = new Set();
    divisions.forEach((div) => {
      getTeamsByDivision(div).forEach((t) => all.add(t.name));
    });
    setExpandedTeams(all);
  }

  function collapseAll() {
    setExpandedTeams(new Set());
  }

  const allExpanded = (() => {
    let total = 0;
    divisions.forEach((div) => { total += getTeamsByDivision(div).length; });
    return expandedTeams.size >= total;
  })();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">All Teams</h3>
        <button
          onClick={allExpanded ? collapseAll : expandAll}
          className="text-orange-400 hover:text-orange-300 text-sm font-medium"
        >
          {allExpanded ? 'Collapse All Rosters' : 'Expand All Rosters'}
        </button>
      </div>

      {divisions.map((div) => {
        const divTeams = getTeamsByDivision(div);
        if (divTeams.length === 0) return null;

        return (
          <div key={div} className="mb-6">
            <h3 className="text-lg font-bold text-orange-400 mb-3">{div}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {divTeams.sort((a, b) => a.seed - b.seed).map((team) => {
                const isChildTeam = selectedChild && selectedChild.teamName === team.name && selectedChild.division === team.division;
                const isExpanded = expandedTeams.has(team.name);
                const isFocused = focusTeam === team.name;
                const eliminated = isTeamEliminated(team.name, team.division);
                const nextGame = !eliminated ? getTeamNextGame(team.name, team.division) : null;

                return (
                  <div
                    key={`${team.name}-${team.division}`}
                    ref={isFocused ? focusRef : null}
                    className={`bg-gray-800 border rounded-lg overflow-hidden transition-all ${
                      isChildTeam ? 'border-orange-500 ring-2 ring-orange-500/30' :
                      isFocused ? 'border-orange-400 ring-1 ring-orange-400/30' :
                      'border-gray-700'
                    } ${eliminated ? 'opacity-60' : ''}`}
                  >
                    <button
                      onClick={() => toggleTeam(team.name)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-750"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-gray-500 text-xs font-mono shrink-0">#{team.seed}</span>
                        <span className={`font-medium truncate ${eliminated ? 'text-gray-500 line-through' : 'text-white'}`}>
                          {team.name}
                        </span>
                        {isChildTeam && (
                          <span className="bg-orange-600 text-white text-xs px-1.5 py-0.5 rounded shrink-0">
                            Your Team
                          </span>
                        )}
                        {eliminated && (
                          <span className="bg-red-900/50 text-red-400 text-xs px-1.5 py-0.5 rounded shrink-0">
                            Eliminated
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 text-sm shrink-0 ml-2">{isExpanded ? '−' : '+'}</span>
                    </button>

                    {nextGame && (
                      <div
                        className="px-3 pb-2 -mt-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onGameClick && nextGame.game) onGameClick(nextGame.game);
                        }}
                      >
                        <span className="text-xs text-gray-400 hover:text-orange-400 transition-colors">
                          Next: {nextGame.round} vs {nextGame.opponent || 'TBD'}
                          {nextGame.court && (() => {
                            const court = courts.find((c) => c.id === nextGame.court);
                            return court ? ` (${court.name})` : '';
                          })()}
                        </span>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="border-t border-gray-700 px-3 py-2">
                        {team.roster.length > 0 ? (
                          <ul className="space-y-1">
                            {team.roster.map((player) => (
                              <li
                                key={player}
                                className={`text-sm ${
                                  selectedChild && selectedChild.playerName === player
                                    ? 'text-orange-400 font-bold'
                                    : 'text-gray-300'
                                }`}
                              >
                                {player}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 text-sm italic">Roster not available</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
