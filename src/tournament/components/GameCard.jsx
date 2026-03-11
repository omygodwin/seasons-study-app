import { courts } from '../../data/tournamentData';

export default function GameCard({ game, result, highlightTeam }) {
  const court = courts.find((c) => c.id === game.court);
  const hasResult = result && result.score1 != null && result.score2 != null;
  const team1Display = game.team1 || 'TBD';
  const team2Display = game.team2 || 'TBD';

  const team1Won = hasResult && result.winner === game.team1;
  const team2Won = hasResult && result.winner === game.team2;

  const team1Highlight = highlightTeam && game.team1 === highlightTeam;
  const team2Highlight = highlightTeam && game.team2 === highlightTeam;

  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{game.round}</span>
        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
          {court ? court.name : `Court ${game.court}`}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={`flex items-center justify-between py-1 px-2 rounded ${
            team1Won ? 'bg-green-900/30' : ''
          } ${team1Highlight ? 'ring-1 ring-orange-500' : ''}`}>
            <span className={`font-medium ${
              team1Won ? 'text-green-400' : hasResult && !team1Won ? 'text-gray-500' : 'text-white'
            }`}>
              {team1Display}
            </span>
            {hasResult && (
              <span className={`font-bold ml-2 ${team1Won ? 'text-green-400' : 'text-gray-500'}`}>
                {result.score1}
              </span>
            )}
          </div>
          <div className={`flex items-center justify-between py-1 px-2 rounded ${
            team2Won ? 'bg-green-900/30' : ''
          } ${team2Highlight ? 'ring-1 ring-orange-500' : ''}`}>
            <span className={`font-medium ${
              team2Won ? 'text-green-400' : hasResult && !team2Won ? 'text-gray-500' : 'text-white'
            }`}>
              {team2Display}
            </span>
            {hasResult && (
              <span className={`font-bold ml-2 ${team2Won ? 'text-green-400' : 'text-gray-500'}`}>
                {result.score2}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {game.division} &middot; Game {game.slot}
        {game.label && <span className="ml-1">({game.label})</span>}
      </div>
    </div>
  );
}
