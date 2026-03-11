import { getTeamByName, getGameResults, courts } from '../../data/tournamentData';

export default function MatchupModal({ game, onClose, onTeamClick, selectedChild }) {
  if (!game) return null;

  const results = getGameResults();
  const result = results[game.gameId];
  const hasResult = result && result.score1 != null;

  const team1Data = game.team1 ? getTeamByName(game.team1) : null;
  const team2Data = game.team2 ? getTeamByName(game.team2) : null;

  const scheduleInfo = game.court ? game : null;
  const court = scheduleInfo ? courts.find((c) => c.id === scheduleInfo.court) : null;

  const team1Won = hasResult && result.winner === game.team1;
  const team2Won = hasResult && result.winner === game.team2;

  function renderTeamSection(teamData, teamName, won, lost, score) {
    if (!teamName) {
      return (
        <div className="flex-1 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-500 text-lg font-bold text-center">TBD</div>
        </div>
      );
    }

    const isChildTeam = selectedChild && selectedChild.teamName === teamName;

    return (
      <div className={`flex-1 bg-gray-800 rounded-lg p-4 border ${
        won ? 'border-green-600' : lost ? 'border-gray-700 opacity-70' : isChildTeam ? 'border-orange-500' : 'border-gray-700'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onTeamClick && onTeamClick(teamName)}
            className={`text-lg font-bold hover:underline ${
              won ? 'text-green-400' : lost ? 'text-gray-500' : 'text-white'
            }`}
          >
            {teamName}
          </button>
          {score != null && (
            <span className={`text-2xl font-bold ${won ? 'text-green-400' : 'text-gray-500'}`}>
              {score}
            </span>
          )}
        </div>
        {teamData && (
          <>
            <div className="text-xs text-gray-500 mb-2">
              {teamData.division} &middot; Seed #{teamData.seed}
              {isChildTeam && <span className="ml-2 text-orange-400">Your Team</span>}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Roster</div>
            <ul className="space-y-0.5">
              {teamData.roster.map((player) => (
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
          </>
        )}
        {!teamData && (
          <p className="text-gray-500 text-sm italic">Team info not available</p>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-orange-400">Game Matchup</h2>
            <div className="text-sm text-gray-400">
              {game.round || ''}
              {court && <span> &middot; {court.name} ({court.location})</span>}
              {game.division && <span> &middot; {game.division}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none px-2"
          >
            &times;
          </button>
        </div>

        {/* Result banner */}
        {hasResult && (
          <div className="px-4 py-2 bg-green-900/30 border-b border-gray-700 text-center">
            <span className="text-green-400 font-bold">
              {result.winner} wins {result.score1} - {result.score2}
            </span>
          </div>
        )}

        {/* Teams */}
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          {renderTeamSection(
            team1Data, game.team1, team1Won, hasResult && !team1Won,
            hasResult ? result.score1 : null
          )}
          <div className="flex items-center justify-center text-gray-500 font-bold text-lg sm:py-0 py-2">
            VS
          </div>
          {renderTeamSection(
            team2Data, game.team2, team2Won, hasResult && !team2Won,
            hasResult ? result.score2 : null
          )}
        </div>
      </div>
    </div>
  );
}
