import { useState } from 'react';
import SeasonsStudyApp from './SeasonsStudyApp';
import EgyptStudyApp from './EgyptStudyApp';
import RocksStudyApp from './RocksStudyApp';

export default function App() {
  const [mainTopic, setMainTopic] = useState('seasons');

  return (
    <div>
      {/* Main navigation to switch between study guides */}
      <nav className="bg-gray-800 p-4 text-white flex justify-center space-x-4 sticky top-0 z-10">
        <button
          onClick={() => setMainTopic('seasons')}
          className={`px-4 py-2 rounded font-semibold ${mainTopic === 'seasons' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          🌍 Earth Science: Seasons
        </button>
        <button
          onClick={() => setMainTopic('egypt')}
          className={`px-4 py-2 rounded font-semibold ${mainTopic === 'egypt' ? 'bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          📜 Ancient Egypt
        </button>
        <button
          onClick={() => setMainTopic('rocks')}
          className={`px-4 py-2 rounded font-semibold ${mainTopic === 'rocks' ? 'bg-stone-600' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          🪨 Rocks & Minerals
        </button>
      </nav>

      {/* Conditionally render the selected study guide */}
      {mainTopic === 'seasons' && <SeasonsStudyApp />}
      {mainTopic === 'egypt' && <EgyptStudyApp />}
      {mainTopic === 'rocks' && <RocksStudyApp />}
    </div>
  );
}