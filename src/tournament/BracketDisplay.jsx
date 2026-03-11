import { getGameResults } from '../data/tournamentData';

function MatchupBox({ game, result, highlightTeam, onTeamClick, onGameClick }) {
  const hasResult = result && result.score1 != null;
  const isBye = game.bye && !game.team2;
  const team1 = game.team1 || 'TBD';
  const team2 = isBye ? 'BYE' : (game.team2 || 'TBD');
  const team1Won = hasResult && result.winner === game.team1;
  const team2Won = hasResult && result.winner === game.team2;

  function teamRow(name, seed, won, lost, isHighlighted, score, isReal) {
    return (
      <div
        className={`flex items-center justify-between px-2 py-1.5 ${
          won ? 'bg-green-900/40' : lost ? 'opacity-50' : ''
        } ${isHighlighted ? 'ring-1 ring-orange-400 rounded' : ''}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {seed && <span className="text-gray-500 text-xs font-mono w-4 shrink-0">{seed}</span>}
          {isReal && onTeamClick ? (
            <button
              onClick={(e) => { e.stopPropagation(); onTeamClick(name); }}
              className={`truncate text-sm font-medium text-left hover:underline ${
                won ? 'text-green-400 font-bold' : lost ? 'text-gray-500 line-through' : 'text-white'
              }`}
              title={name}
            >
              {name}
            </button>
          ) : (
            <span
              className={`truncate text-sm font-medium ${
                won ? 'text-green-400 font-bold' : lost ? 'text-gray-500 line-through' : name === 'TBD' || name === 'BYE' ? 'text-gray-500' : 'text-white'
              }`}
              title={name}
            >
              {name}
            </span>
          )}
        </div>
        {score != null && (
          <span className={`text-sm font-bold ml-2 shrink-0 ${won ? 'text-green-400' : 'text-gray-500'}`}>
            {score}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-gray-800 border border-gray-600 rounded w-56 overflow-hidden shadow-md cursor-pointer hover:border-gray-500 transition-colors"
      onClick={() => onGameClick && onGameClick(game)}
      title="Click for matchup details"
    >
      {teamRow(
        team1, game.seed1, team1Won, hasResult && !team1Won,
        highlightTeam && game.team1 === highlightTeam,
        hasResult ? result.score1 : null,
        game.team1 && game.team1 !== 'TBD'
      )}
      <div className="border-t border-gray-600" />
      {teamRow(
        team2, game.seed2, team2Won, hasResult && !team2Won,
        highlightTeam && game.team2 === highlightTeam,
        hasResult ? result.score2 : null,
        game.team2 && game.team2 !== 'TBD' && game.team2 !== 'BYE'
      )}
    </div>
  );
}

function resolveBracket(bracket, results) {
  const resolved = JSON.parse(JSON.stringify(bracket));

  function getQfWinner(qfGame, result) {
    if (qfGame.bye) return { winner: qfGame.team1, seed: qfGame.seed1 };
    if (result && result.winner) {
      const seed = result.winner === qfGame.team1 ? qfGame.seed1 : qfGame.seed2;
      return { winner: result.winner, seed };
    }
    return null;
  }

  resolved.semiFinals.forEach((sf) => {
    if (sf.source) {
      const [src1Id, src2Id] = sf.source;
      const src1 = resolved.quarterFinals.find((g) => g.gameId === src1Id);
      const src2 = resolved.quarterFinals.find((g) => g.gameId === src2Id);
      const w1 = getQfWinner(src1, results[src1Id]);
      const w2 = getQfWinner(src2, results[src2Id]);
      if (w1) { sf.team1 = w1.winner; sf.seed1 = w1.seed; }
      if (w2) { sf.team2 = w2.winner; sf.seed2 = w2.seed; }
    }
  });

  resolved.final.forEach((f) => {
    if (f.source) {
      const [src1Id, src2Id] = f.source;
      const r1 = results[src1Id];
      const r2 = results[src2Id];
      const src1 = resolved.semiFinals.find((g) => g.gameId === src1Id);
      const src2 = resolved.semiFinals.find((g) => g.gameId === src2Id);
      if (r1 && r1.winner) {
        f.team1 = r1.winner;
        f.seed1 = src1 && r1.winner === src1.team1 ? src1.seed1 : src1 ? src1.seed2 : null;
      }
      if (r2 && r2.winner) {
        f.team2 = r2.winner;
        f.seed2 = src2 && r2.winner === src2.team1 ? src2.seed1 : src2 ? src2.seed2 : null;
      }
    }
  });

  return resolved;
}

export default function BracketDisplay({ bracket, highlightTeam, gameResults, onTeamClick, onGameClick }) {
  const results = gameResults || getGameResults();
  const resolved = resolveBracket(bracket, results);

  const qf = resolved.quarterFinals;
  const sf = resolved.semiFinals;
  const final = resolved.final;

  const finalResult = results[final[0]?.gameId];
  const champion = finalResult?.winner || null;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[750px] flex items-stretch gap-0 py-4 px-2">
        {/* Quarter-Finals */}
        <div className="flex flex-col justify-around flex-shrink-0 gap-6" style={{ minHeight: '400px' }}>
          <div className="text-xs text-gray-500 uppercase tracking-wide text-center mb-1">Quarter-Finals</div>
          {qf.map((game) => (
            <MatchupBox
              key={game.gameId}
              game={game}
              result={results[game.gameId]}
              highlightTeam={highlightTeam}
              onTeamClick={onTeamClick}
              onGameClick={onGameClick}
            />
          ))}
        </div>

        {/* Connector lines QF -> SF */}
        <div className="flex flex-col justify-around flex-shrink-0 w-8">
          <div className="flex-1" />
          {[0, 1].map((i) => (
            <div key={i} className="flex-1 flex flex-col justify-center">
              <div className="border-t-2 border-r-2 border-gray-600 h-16 rounded-tr-lg" />
              <div className="border-b-2 border-r-2 border-gray-600 h-16 rounded-br-lg" />
            </div>
          ))}
          <div className="flex-1" />
        </div>

        {/* Semi-Finals */}
        <div className="flex flex-col justify-around flex-shrink-0 gap-24" style={{ minHeight: '400px' }}>
          <div className="text-xs text-gray-500 uppercase tracking-wide text-center mb-1">Semi-Finals</div>
          {sf.map((game) => (
            <MatchupBox
              key={game.gameId}
              game={game}
              result={results[game.gameId]}
              highlightTeam={highlightTeam}
              onTeamClick={onTeamClick}
              onGameClick={onGameClick}
            />
          ))}
        </div>

        {/* Connector lines SF -> F */}
        <div className="flex flex-col justify-center flex-shrink-0 w-8">
          <div className="border-t-2 border-r-2 border-gray-600 h-20 rounded-tr-lg" />
          <div className="border-b-2 border-r-2 border-gray-600 h-20 rounded-br-lg" />
        </div>

        {/* Final */}
        <div className="flex flex-col justify-center flex-shrink-0" style={{ minHeight: '400px' }}>
          <div className="text-xs text-gray-500 uppercase tracking-wide text-center mb-1">Final</div>
          <MatchupBox
            game={final[0]}
            result={results[final[0]?.gameId]}
            highlightTeam={highlightTeam}
            onTeamClick={onTeamClick}
            onGameClick={onGameClick}
          />
          {champion && (
            <div className="mt-3 text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Champion</div>
              <div className="text-orange-400 font-bold text-lg mt-1">{champion}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
