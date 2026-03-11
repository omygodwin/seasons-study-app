import { useState } from 'react';
import { getSelectedChild, getSelectedChildren, getActiveChildIndex, saveSelectedChild, setActiveChildIndex } from '../data/tournamentData';
import PlayerSearch from './components/PlayerSearch';
import ChildSwitcher from './components/ChildSwitcher';
import TournamentCentral from './TournamentCentral';
import AdminPanel from './AdminPanel';
import InstallBanner from './components/InstallBanner';

// Views: 'home' | 'central' | 'admin'

export default function TournamentApp() {
  const [view, setView] = useState('home');
  const [selectedChild, setSelectedChild] = useState(getSelectedChild());
  const [allChildren, setAllChildren] = useState(getSelectedChildren());
  const [activeChildIdx, setActiveChildIdx] = useState(getActiveChildIndex());

  function refreshChildState() {
    setAllChildren(getSelectedChildren());
    setSelectedChild(getSelectedChild());
    setActiveChildIdx(getActiveChildIndex());
  }

  function handlePlayerSelect(player) {
    saveSelectedChild(player.name, player.teamName, player.division);
    refreshChildState();
    setView('central');
  }

  function handleClearChild() {
    setSelectedChild(null);
    setAllChildren([]);
    setActiveChildIdx(0);
  }

  function handleChildSwitch(idx) {
    setActiveChildIndex(idx);
    refreshChildState();
  }

  if (view === 'central') {
    return (
      <TournamentCentral
        selectedChild={selectedChild}
        allChildren={allChildren}
        activeChildIndex={activeChildIdx}
        onChildSwitch={handleChildSwitch}
        onClearChild={handleClearChild}
        onAddChild={() => setView('home')}
        onBack={() => setView('home')}
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
        {allChildren.length > 0 && (
          <div className="space-y-3">
            <ChildSwitcher
              children={allChildren}
              activeIndex={activeChildIdx}
              onSwitch={handleChildSwitch}
              onClear={handleClearChild}
            />
            <button
              onClick={() => setView('central')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Tournament Central
            </button>
          </div>
        )}

        {/* Search */}
        <div>
          <p className="text-gray-300 text-sm mb-2">
            {allChildren.length > 0 ? 'Add another child or search for a different player:' : 'Search for your child\'s name:'}
          </p>
          <PlayerSearch onSelect={handlePlayerSelect} />
        </div>

        {/* Tournament Central button (when no child selected) */}
        {allChildren.length === 0 && (
          <button
            onClick={() => setView('central')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors border border-gray-600"
          >
            Tournament Central
          </button>
        )}

        {/* Admin link */}
        <button
          onClick={() => setView('admin')}
          className="text-gray-500 hover:text-gray-300 text-sm underline transition-colors"
        >
          Admin / Score Entry
        </button>
      </div>

      <InstallBanner />
    </div>
  );
}
