import { useState } from 'react';
import { getSelectedChild, saveSelectedChild } from '../data/tournamentData';
import PlayerSearch from './components/PlayerSearch';
import ChildBanner from './components/ChildBanner';
import TeamPage from './TeamPage';
import TournamentCentral from './TournamentCentral';
import AdminPanel from './AdminPanel';

// Views: 'home' | 'team' | 'central' | 'admin'

export default function TournamentApp() {
  const [view, setView] = useState('home');
  const [selectedChild, setSelectedChild] = useState(getSelectedChild());

  function handlePlayerSelect(player) {
    const child = { playerName: player.name, teamName: player.teamName, division: player.division };
    saveSelectedChild(player.name, player.teamName, player.division);
    setSelectedChild(child);
    setView('team');
  }

  function handleClearChild() {
    setSelectedChild(null);
  }

  if (view === 'team' && selectedChild) {
    return (
      <TeamPage
        selectedChild={selectedChild}
        onViewCentral={() => setView('central')}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'central') {
    return (
      <TournamentCentral
        selectedChild={selectedChild}
        onClearChild={handleClearChild}
        onBack={() => selectedChild ? setView('team') : setView('home')}
      />
    );
  }

  if (view === 'admin') {
    return <AdminPanel onBack={() => setView('home')} />;
  }

  // Home view
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold text-orange-400 mb-2">Basketball Tournament</h1>
          <p className="text-gray-400">Find your child's team, schedule, and live bracket updates</p>
        </div>

        {/* Child banner if already selected */}
        {selectedChild && (
          <div className="space-y-3">
            <ChildBanner child={selectedChild} onClear={handleClearChild} />
            <button
              onClick={() => setView('team')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Go to {selectedChild.teamName}'s Page
            </button>
          </div>
        )}

        {/* Search */}
        <div>
          <p className="text-gray-300 text-sm mb-2">
            {selectedChild ? 'Search for a different player:' : 'Search for your child\'s name:'}
          </p>
          <PlayerSearch onSelect={handlePlayerSelect} />
        </div>

        {/* Tournament Central button */}
        <button
          onClick={() => setView('central')}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors border border-gray-600"
        >
          Tournament Central
        </button>

        {/* Admin link */}
        <button
          onClick={() => setView('admin')}
          className="text-gray-500 hover:text-gray-300 text-sm underline transition-colors"
        >
          Admin / Score Entry
        </button>
      </div>
    </div>
  );
}
