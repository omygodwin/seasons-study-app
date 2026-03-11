import { useState, useEffect } from 'react';
import { schedule, courts, teams, getGameResults } from '../data/tournamentData';
import GameCard from './components/GameCard';
import CourtKey from './components/CourtKey';

export default function ScheduleView({ selectedChild }) {
  const [filterTeam, setFilterTeam] = useState('');
  const [gameResults, setGameResults] = useState(getGameResults());

  useEffect(() => {
    function handleFocus() { setGameResults(getGameResults()); }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Get unique team names for filter dropdown
  const teamNames = [...new Set(teams.map((t) => t.name))].sort();

  // Child's team schedule
  const childGames = selectedChild
    ? schedule.filter(
        (g) => g.team1 === selectedChild.teamName || g.team2 === selectedChild.teamName
      )
    : [];

  // Filtered schedule
  const filteredSchedule = filterTeam
    ? schedule.filter((g) => g.team1 === filterTeam || g.team2 === filterTeam)
    : schedule;

  // Group by court
  const byCourt = {};
  filteredSchedule.forEach((game) => {
    if (!byCourt[game.court]) byCourt[game.court] = [];
    byCourt[game.court].push(game);
  });
  Object.values(byCourt).forEach((games) => games.sort((a, b) => a.slot - b.slot));

  return (
    <div>
      {/* Child's schedule section */}
      {selectedChild && childGames.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-orange-400 mb-3">
            {selectedChild.playerName}'s Schedule ({selectedChild.teamName})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {childGames.map((game) => (
              <GameCard
                key={game.gameId + '-child'}
                game={game}
                result={gameResults[game.gameId]}
                highlightTeam={selectedChild.teamName}
              />
            ))}
          </div>
          <hr className="border-gray-700 my-6" />
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 className="text-lg font-bold text-white">Full Tournament Schedule</h3>
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
        >
          <option value="">All Teams</option>
          {teamNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Schedule by court */}
      {Object.keys(byCourt).sort((a, b) => Number(a) - Number(b)).map((courtId) => {
        const court = courts.find((c) => c.id === Number(courtId));
        return (
          <div key={courtId} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-sm">
                Court {courtId}
              </span>
              <span className="text-gray-400 text-sm">{court?.location}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {byCourt[courtId].map((game) => (
                <GameCard
                  key={game.gameId}
                  game={game}
                  result={gameResults[game.gameId]}
                  highlightTeam={selectedChild?.teamName}
                />
              ))}
            </div>
          </div>
        );
      })}

      <CourtKey />
    </div>
  );
}
