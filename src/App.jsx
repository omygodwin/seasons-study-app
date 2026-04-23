import { useState, useEffect } from 'react';
import SeasonsStudyApp from './SeasonsStudyApp';
import EgyptStudyApp from './EgyptStudyApp';
import RocksStudyApp from './RocksStudyApp';
import VocabStudyApp from './VocabStudyApp';
import TournamentApp from './tournament/TournamentApp';

function getRouteFromHash() {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'tournament') return 'tournament';
  return 'study';
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash);
  const [studyTopic, setStudyTopic] = useState('seasons');

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash());
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route === 'tournament') {
    return <TournamentApp />;
  }

  // Study guides view
  return (
    <div>
      <nav className="bg-gray-800 p-4 text-white flex justify-center space-x-4 sticky top-0 z-10 flex-wrap gap-2">
        <button
          onClick={() => setStudyTopic('seasons')}
          className={`px-4 py-2 rounded font-semibold ${studyTopic === 'seasons' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          Earth Science: Seasons
        </button>
        <button
          onClick={() => setStudyTopic('egypt')}
          className={`px-4 py-2 rounded font-semibold ${studyTopic === 'egypt' ? 'bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          Ancient Egypt
        </button>
        <button
          onClick={() => setStudyTopic('rocks')}
          className={`px-4 py-2 rounded font-semibold ${studyTopic === 'rocks' ? 'bg-stone-600' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          Rocks & Minerals
        </button>
        <button
          onClick={() => setStudyTopic('vocab')}
          className={`px-4 py-2 rounded font-semibold ${studyTopic === 'vocab' ? 'bg-purple-600' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          Vocab Words
        </button>
      </nav>

      {studyTopic === 'seasons' && <SeasonsStudyApp />}
      {studyTopic === 'egypt' && <EgyptStudyApp />}
      {studyTopic === 'rocks' && <RocksStudyApp />}
      {studyTopic === 'vocab' && <VocabStudyApp />}
    </div>
  );
}
