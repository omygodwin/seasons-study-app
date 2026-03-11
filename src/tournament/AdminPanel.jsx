import { useState } from 'react';
import { ADMIN_PIN, schedule, getGameResults, saveGameResult, brackets } from '../data/tournamentData';

export default function AdminPanel({ onBack }) {
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [gameResults, setGameResults] = useState(getGameResults());
  const [selectedGame, setSelectedGame] = useState('');
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  function handlePinSubmit(e) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  }

  // Build complete game list from brackets (includes all rounds)
  const allGames = [];
  Object.entries(brackets).forEach(([division, bracket]) => {
    bracket.quarterFinals.forEach((g) => allGames.push({ ...g, division, round: 'Quarter-Final' }));
    bracket.semiFinals.forEach((g) => allGames.push({ ...g, division, round: 'Semi-Final' }));
    bracket.final.forEach((g) => allGames.push({ ...g, division, round: 'Final' }));
  });

  // Also add schedule-only games not in brackets
  schedule.forEach((g) => {
    if (!allGames.find((ag) => ag.gameId === g.gameId)) {
      allGames.push({ ...g, round: g.round });
    }
  });

  const currentGame = allGames.find((g) => g.gameId === selectedGame);

  // Resolve team names for semi-finals and finals
  function resolveTeamName(game) {
    if (game.team1 && game.team2) return { team1: game.team1, team2: game.team2 };
    // Check if source games have results
    const results = getGameResults();
    let t1 = game.team1, t2 = game.team2;
    if (game.source) {
      const r1 = results[game.source[0]];
      const r2 = results[game.source[1]];
      if (r1?.winner) t1 = r1.winner;
      if (r2?.winner) t2 = r2.winner;
    }
    return { team1: t1, team2: t2 };
  }

  function handleSave(e) {
    e.preventDefault();
    if (!currentGame || score1 === '' || score2 === '') return;

    const s1 = parseInt(score1, 10);
    const s2 = parseInt(score2, 10);
    if (isNaN(s1) || isNaN(s2)) return;

    const { team1, team2 } = resolveTeamName(currentGame);
    const winner = s1 > s2 ? team1 : s2 > s1 ? team2 : null;

    saveGameResult(selectedGame, s1, s2, winner);
    setGameResults(getGameResults());
    setSaveMessage(`Score saved: ${team1 || 'TBD'} ${s1} - ${s2} ${team2 || 'TBD'}`);
    setScore1('');
    setScore2('');
    setSelectedGame('');
    setTimeout(() => setSaveMessage(''), 3000);
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 w-full max-w-sm">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1"
          >
            &larr; Back
          </button>
          <h2 className="text-xl font-bold text-orange-400 mb-4">Admin Access</h2>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(false); }}
              placeholder="Enter PIN"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:outline-none text-lg text-center tracking-widest"
              maxLength={6}
              autoFocus
            />
            {pinError && <p className="text-red-400 text-sm mt-2">Incorrect PIN</p>}
            <button
              type="submit"
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
          >
            &larr; Back
          </button>
          <h1 className="text-xl font-bold text-orange-400">Score Entry</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {saveMessage && (
          <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg p-3 mb-4">
            {saveMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <label className="block text-sm text-gray-400 mb-2">Select Game</label>
          <select
            value={selectedGame}
            onChange={(e) => { setSelectedGame(e.target.value); setScore1(''); setScore2(''); }}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 mb-4 focus:border-orange-500 focus:outline-none"
          >
            <option value="">-- Choose a game --</option>
            {allGames.map((game) => {
              const { team1, team2 } = resolveTeamName(game);
              const result = gameResults[game.gameId];
              return (
                <option key={game.gameId} value={game.gameId}>
                  {game.division} {game.round}: {team1 || 'TBD'} vs {team2 || 'TBD'}
                  {result ? ` (${result.score1}-${result.score2})` : ''}
                </option>
              );
            })}
          </select>

          {currentGame && (() => {
            const { team1, team2 } = resolveTeamName(currentGame);
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-1">{team1 || 'TBD'}</label>
                    <input
                      type="number"
                      min="0"
                      value={score1}
                      onChange={(e) => setScore1(e.target.value)}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-center text-xl focus:border-orange-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-gray-500 text-xl font-bold mt-5">-</span>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-1">{team2 || 'TBD'}</label>
                    <input
                      type="number"
                      min="0"
                      value={score2}
                      onChange={(e) => setScore2(e.target.value)}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-center text-xl focus:border-orange-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={score1 === '' || score2 === ''}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-colors"
                >
                  Save Score
                </button>
              </div>
            );
          })()}
        </form>

        {/* Recent results */}
        <h3 className="text-lg font-bold text-white mb-3">Saved Results</h3>
        <div className="space-y-2">
          {Object.entries(gameResults).length === 0 && (
            <p className="text-gray-500 italic">No results entered yet</p>
          )}
          {Object.entries(gameResults).map(([gameId, result]) => {
            const game = allGames.find((g) => g.gameId === gameId);
            const { team1, team2 } = game ? resolveTeamName(game) : { team1: '?', team2: '?' };
            return (
              <div key={gameId} className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{team1 || 'TBD'}</span>
                  <span className="text-gray-400 mx-2">vs</span>
                  <span className="text-white font-medium">{team2 || 'TBD'}</span>
                  {game && <span className="text-gray-500 text-sm ml-2">({game.division} {game.round})</span>}
                </div>
                <div className="text-orange-400 font-bold">{result.score1} - {result.score2}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
