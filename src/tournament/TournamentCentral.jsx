import { useState } from 'react';
import BracketsView from './BracketsView';
import ScheduleView from './ScheduleView';
import TeamsView from './TeamsView';
import ChildBanner from './components/ChildBanner';

const TABS = [
  { id: 'brackets', label: 'Brackets' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'teams', label: 'Teams' },
];

export default function TournamentCentral({ selectedChild, onClearChild, onBack }) {
  const [activeTab, setActiveTab] = useState('brackets');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
            >
              &larr; Back
            </button>
            <h1 className="text-xl font-bold text-orange-400">Tournament Central</h1>
            <div className="w-16" />
          </div>
          {selectedChild && <ChildBanner child={selectedChild} onClear={onClearChild} />}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-gray-850 border-b border-gray-700">
        <div className="max-w-5xl mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center font-semibold text-sm transition-colors relative ${
                activeTab === tab.id
                  ? 'text-orange-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto p-4">
        {activeTab === 'brackets' && <BracketsView selectedChild={selectedChild} />}
        {activeTab === 'schedule' && <ScheduleView selectedChild={selectedChild} />}
        {activeTab === 'teams' && <TeamsView selectedChild={selectedChild} />}
      </div>
    </div>
  );
}
