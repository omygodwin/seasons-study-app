import { useState, useEffect, useRef } from 'react';
import SeasonsStudyApp from './SeasonsStudyApp';
import EgyptStudyApp from './EgyptStudyApp';
import RocksStudyApp from './RocksStudyApp';
import VocabStudyApp from './VocabStudyApp';
import GeographyStudyApp from './GeographyStudyApp';
import LatinVocabStudyApp from './LatinVocabStudyApp';
import MiddleAgesStudyApp from './MiddleAgesStudyApp';
import TournamentApp from './tournament/TournamentApp';

const TOPIC_KEY = 'studyTopic';

// Two kids share this app, so it reopens on whichever topic was used last.
function getSavedTopic(valid) {
  try {
    const saved = localStorage.getItem(TOPIC_KEY);
    if (saved && valid.includes(saved)) return saved;
  } catch {
    /* private mode / storage disabled */
  }
  return 'seasons';
}

function getRouteFromHash() {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'tournament') return 'tournament';
  return 'study';
}

const ROSE_TOPICS = [
  { id: 'geography', label: 'Maps & Rivers', emoji: '🗺️' },
  { id: 'vocab', label: 'Vocab Words', emoji: '📚' },
];
const ROSE_TOPIC_IDS = ROSE_TOPICS.map((t) => t.id);

const RAEGAN_TOPICS = [
  { id: 'seasons', label: 'Earth Science: Seasons', emoji: '🌍' },
  { id: 'egypt', label: 'Ancient Egypt', emoji: '🏺' },
  { id: 'rocks', label: 'Rocks & Minerals', emoji: '🪨' },
  { id: 'latin', label: 'Latin Vocab', emoji: '🏛️' },
  { id: 'middleages', label: 'Middle Ages (Western Civ)', emoji: '🏰' },
];
const RAEGAN_TOPIC_IDS = RAEGAN_TOPICS.map((t) => t.id);

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash);
  const [studyTopic, setStudyTopic] = useState(() =>
    getSavedTopic([...ROSE_TOPIC_IDS, ...RAEGAN_TOPIC_IDS]),
  );
  const [roseOpen, setRoseOpen] = useState(false);
  const [raeganOpen, setRaeganOpen] = useState(false);
  const roseRef = useRef(null);
  const raeganRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(TOPIC_KEY, studyTopic);
    } catch {
      /* private mode / storage disabled */
    }
  }, [studyTopic]);

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash());
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!roseOpen && !raeganOpen) return;
    function handlePointerDown(e) {
      if (roseOpen && roseRef.current && !roseRef.current.contains(e.target)) {
        setRoseOpen(false);
      }
      if (raeganOpen && raeganRef.current && !raeganRef.current.contains(e.target)) {
        setRaeganOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') {
        setRoseOpen(false);
        setRaeganOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [roseOpen, raeganOpen]);

  if (route === 'tournament') {
    return <TournamentApp />;
  }

  const roseActive = ROSE_TOPIC_IDS.includes(studyTopic);
  const raeganActive = RAEGAN_TOPIC_IDS.includes(studyTopic);

  return (
    <div>
      <nav className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-center gap-2 border-b border-white/10 bg-slate-900/95 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="relative" ref={raeganRef}>
          <button
            type="button"
            onClick={() => {
              setRaeganOpen((v) => !v);
              setRoseOpen(false);
            }}
            aria-haspopup="menu"
            aria-expanded={raeganOpen}
            className={`flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2.5 font-bold transition ${
              raeganActive
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/40'
                : 'bg-white/10 text-slate-100 hover:bg-white/20 active:bg-white/20'
            }`}
          >
            <span>🌟 Raegan</span>
            <svg
              className={`w-4 h-4 transition-transform ${raeganOpen ? 'rotate-180' : ''}`}
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

          {raeganOpen && (
            <div
              role="menu"
              className="absolute right-0 z-30 mt-2 min-w-[16rem] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl sm:left-0 sm:right-auto"
            >
              {RAEGAN_TOPICS.map((topic) => {
                const active = studyTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    role="menuitem"
                    onClick={() => {
                      setStudyTopic(topic.id);
                      setRaeganOpen(false);
                    }}
                    className={`flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left font-semibold ${
                      active
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-100 hover:bg-white/10 active:bg-white/10'
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

        <div className="relative" ref={roseRef}>
          <button
            type="button"
            onClick={() => {
              setRoseOpen((v) => !v);
              setRaeganOpen(false);
            }}
            aria-haspopup="menu"
            aria-expanded={roseOpen}
            className={`flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2.5 font-bold transition ${
              roseActive
                ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-900/40'
                : 'bg-white/10 text-slate-100 hover:bg-white/20 active:bg-white/20'
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
              className="absolute right-0 z-30 mt-2 min-w-[14rem] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl sm:left-0 sm:right-auto"
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
                    className={`flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left font-semibold ${
                      active
                        ? 'bg-fuchsia-500 text-white'
                        : 'text-slate-100 hover:bg-white/10 active:bg-white/10'
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
      {studyTopic === 'latin' && <LatinVocabStudyApp />}
      {studyTopic === 'middleages' && <MiddleAgesStudyApp />}
      {studyTopic === 'vocab' && <VocabStudyApp />}
      {studyTopic === 'geography' && <GeographyStudyApp />}
    </div>
  );
}
