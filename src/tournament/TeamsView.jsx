import { useState, useEffect, useRef } from 'react';
import { divisions, getTeamsByDivision } from '../data/tournamentData';

export default function TeamsView({ selectedChild }) {
  const [expandedTeam, setExpandedTeam] = useState(selectedChild?.teamName || null);
  const highlightRef = useRef(null);

  useEffect(() => {
    if (selectedChild && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedChild]);

  function toggleTeam(name) {
    setExpandedTeam(expandedTeam === name ? null : name);
  }

  return (
    <div>
      {divisions.map((div) => {
        const divTeams = getTeamsByDivision(div);
        if (divTeams.length === 0) return null;

        return (
          <div key={div} className="mb-6">
            <h3 className="text-lg font-bold text-orange-400 mb-3">{div}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {divTeams.sort((a, b) => a.seed - b.seed).map((team) => {
                const isChildTeam = selectedChild && selectedChild.teamName === team.name && selectedChild.division === team.division;
                const isExpanded = expandedTeam === team.name;

                return (
                  <div
                    key={`${team.name}-${team.division}`}
                    ref={isChildTeam ? highlightRef : null}
                    className={`bg-gray-800 border rounded-lg overflow-hidden transition-all ${
                      isChildTeam ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => toggleTeam(team.name)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-750"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs font-mono">#{team.seed}</span>
                        <span className="text-white font-medium">{team.name}</span>
                        {isChildTeam && (
                          <span className="bg-orange-600 text-white text-xs px-1.5 py-0.5 rounded">
                            Your Team
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 text-sm">{isExpanded ? '−' : '+'}</span>
                    </button>
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
