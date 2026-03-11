import { useState, useEffect } from 'react';
import { schedule, courts, teams, divisions, getGameResults } from '../data/tournamentData';
import GameCard from './components/GameCard';
import CourtKey from './components/CourtKey';

export default function ScheduleView({ selectedChild, onTeamClick, onGameClick }) {
  const [filterTeam, setFilterTeam] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [gameResults, setGameResults] = useState(getGameResults());

  useEffect(() => {
    function handleFocus() { setGameResults(getGameResults()); }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const teamNames = [...new Set(teams.map((t) => t.name))].sort();

  const childGames = selectedChild
    ? schedule.filter(
        (g) => g.team1 === selectedChild.teamName || g.team2 === selectedChild.teamName
      )
    : [];

  let filteredSchedule = schedule;
  if (filterTeam) {
    filteredSchedule = filteredSchedule.filter((g) => g.team1 === filterTeam || g.team2 === filterTeam);
  }
  if (filterDivision) {
    filteredSchedule = filteredSchedule.filter((g) => g.division === filterDivision);
  }

  const byCourt = {};
  filteredSchedule.forEach((game) => {
    if (!byCourt[game.court]) byCourt[game.court] = [];
    byCourt[game.court].push(game);
  });
  Object.values(byCourt).forEach((games) => games.sort((a, b) => a.slot - b.slot));

  return (
    <div>
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
                onTeamClick={onTeamClick}
                onClick={() => onGameClick && onGameClick(game)}
              />
            ))}
          </div>
          <hr className="border-gray-700 my-6" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 className="text-lg font-bold text-white">Full Tournament Schedule</h3>
        <select
          value={filterDivision}
          onChange={(e) => setFilterDivision(e.target.value)}
          className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
        >
          <option value="">All Divisions</option>
          {divisions.map((div) => (
            <option key={div} value={div}>{div}</option>
          ))}
        </select>
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
                  onTeamClick={onTeamClick}
                  onClick={() => onGameClick && onGameClick(game)}
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
