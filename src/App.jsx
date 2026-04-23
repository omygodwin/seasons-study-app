import { useState, useEffect, useRef } from 'react';
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

const ROSE_TOPICS = [
  { id: 'vocab', label: 'Vocab Words', emoji: '📚' },
];
const ROSE_TOPIC_IDS = ROSE_TOPICS.map((t) => t.id);

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash);
  const [studyTopic, setStudyTopic] = useState('seasons');
  const [roseOpen, setRoseOpen] = useState(false);
  const roseRef = useRef(null);

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash());
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!roseOpen) return;
    function handlePointerDown(e) {
      if (roseRef.current && !roseRef.current.contains(e.target)) {
        setRoseOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setRoseOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [roseOpen]);

  if (route === 'tournament') {
    return <TournamentApp />;
  }

  const roseActive = ROSE_TOPIC_IDS.includes(studyTopic);

  return (
    <div>
      <nav className="bg-gray-800 p-4 text-white flex justify-center items-center sticky top-0 z-20 flex-wrap gap-2">
        <button
          onClick={() => setStudyTopic('seasons')}
          className={`px-4 py-3 min-h-[44px] rounded font-semibold ${studyTopic === 'seasons' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700 active:bg-gray-700'}`}
        >
          Earth Science: Seasons
        </button>
        <button
          onClick={() => setStudyTopic('egypt')}
          className={`px-4 py-3 min-h-[44px] rounded font-semibold ${studyTopic === 'egypt' ? 'bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700 active:bg-gray-700'}`}
        >
          Ancient Egypt
        </button>
        <button
          onClick={() => setStudyTopic('rocks')}
          className={`px-4 py-3 min-h-[44px] rounded font-semibold ${studyTopic === 'rocks' ? 'bg-stone-600' : 'bg-gray-600 hover:bg-gray-700 active:bg-gray-700'}`}
        >
          Rocks & Minerals
        </button>

        <div className="relative" ref={roseRef}>
          <button
            type="button"
            onClick={() => setRoseOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={roseOpen}
            className={`px-4 py-3 min-h-[44px] rounded font-semibold flex items-center gap-2 ${
              roseActive ? 'bg-purple-600' : 'bg-gray-600 hover:bg-gray-700 active:bg-gray-700'
            }`}
          >
            <span>🌹 Rose</span>
            <svg
              className={`w-4 h-4 transition-transform ${roseOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {roseOpen && (
            <div
              role="menu"
              className="absolute right-0 sm:right-auto sm:left-0 mt-2 min-w-[14rem] rounded-lg bg-gray-900 shadow-2xl ring-1 ring-black/40 overflow-hidden z-30"
            >
              {ROSE_TOPICS.map((topic) => {
                const active = studyTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    role="menuitem"
                    onClick={() => {
                      setStudyTopic(topic.id);
                      setRoseOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 min-h-[44px] flex items-center gap-3 font-semibold ${
                      active
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-100 hover:bg-gray-700 active:bg-gray-700'
                    }`}
                  >
                    <span aria-hidden="true">{topic.emoji}</span>
                    <span>{topic.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {studyTopic === 'seasons' && <SeasonsStudyApp />}
      {studyTopic === 'egypt' && <EgyptStudyApp />}
      {studyTopic === 'rocks' && <RocksStudyApp />}
      {studyTopic === 'vocab' && <VocabStudyApp />}
    </div>
  );
}
