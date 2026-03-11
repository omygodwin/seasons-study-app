import { useState, useRef, useEffect } from 'react';
import { teams } from '../../data/tournamentData';

// Build flat list of all players with their team info
const allPlayers = [];
teams.forEach((team) => {
  team.roster.forEach((player) => {
    allPlayers.push({ name: player, teamName: team.name, division: team.division });
  });
});

export default function PlayerSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    setHighlightIndex(-1);
    if (val.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const lower = val.toLowerCase();
    const matches = allPlayers.filter((p) => p.name.toLowerCase().includes(lower));
    setResults(matches);
    setShowDropdown(matches.length > 0);
  }

  function handleSelect(player) {
    setQuery(player.name);
    setShowDropdown(false);
    onSelect(player);
  }

  function handleKeyDown(e) {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        placeholder="Search for your child's name..."
        className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none text-lg"
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((player, i) => (
            <button
              key={`${player.name}-${player.teamName}`}
              onClick={() => handleSelect(player)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${
                i === highlightIndex ? 'bg-gray-700' : ''
              } ${i < results.length - 1 ? 'border-b border-gray-700' : ''}`}
            >
              <span className="text-white font-medium">{player.name}</span>
              <span className="text-gray-400 text-sm ml-2">
                — {player.teamName} ({player.division})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
