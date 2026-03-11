import { useState, useEffect } from 'react';
import { divisions, getBracket, getGameResults } from '../data/tournamentData';
import BracketDisplay from './BracketDisplay';

export default function BracketsView({ selectedChild, onTeamClick, onGameClick }) {
  const defaultDiv = selectedChild ? selectedChild.division : divisions[0];
  const [activeDivision, setActiveDivision] = useState(defaultDiv);
  const [gameResults, setGameResults] = useState(getGameResults());

  useEffect(() => {
    function handleFocus() { setGameResults(getGameResults()); }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (selectedChild) setActiveDivision(selectedChild.division);
  }, [selectedChild]);

  const bracket = getBracket(activeDivision);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {divisions.map((div) => (
          <button
            key={div}
            onClick={() => setActiveDivision(div)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeDivision === div
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } ${selectedChild && selectedChild.division === div ? 'ring-2 ring-orange-400' : ''}`}
          >
            {div}
          </button>
        ))}
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{activeDivision} Bracket</h3>

      {bracket ? (
        <BracketDisplay
          bracket={bracket}
          highlightTeam={selectedChild?.teamName}
          gameResults={gameResults}
          onTeamClick={onTeamClick}
          onGameClick={onGameClick}
        />
      ) : (
        <p className="text-gray-400">No bracket data available for {activeDivision}.</p>
      )}
    </div>
  );
}
