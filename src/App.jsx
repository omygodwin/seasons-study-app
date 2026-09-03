import { useState, useEffect, useRef } from 'react';
import SeasonsStudyApp from './SeasonsStudyApp';
import EgyptStudyApp from './EgyptStudyApp';
import RocksStudyApp from './RocksStudyApp';
import VocabStudyApp from './VocabStudyApp';
import LatinVocabStudyApp from './LatinVocabStudyApp';
import MiddleAgesStudyApp from './MiddleAgesStudyApp';
import GeographyStudyApp from './GeographyStudyApp';
import TournamentApp from './tournament/TournamentApp';
import { groupTopicsByMonth } from './topicSchedule';

/* Topics carry the date the unit was studied. The menu groups and sorts on
 * that date, so the list stays in order by itself as topics are added through
 * the school year — ISO dates sort correctly straight through the September →
 * January rollover, and several topics can share a month without any extra
 * nesting. To start dating a child's topics, add `date` to each of their
 * entries; a list with no dates just renders flat. */
const ROSE_TOPICS = [
  { id: 'geography', label: 'Maps & Rivers', emoji: '🗺️', date: '2026-09-03' },
  { id: 'vocab', label: 'Vocab Words', emoji: '📚', date: '2026-04-22' },
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

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
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
  );
}

function TopicMenu({ name, emoji, topics, active, selected, open, onToggle, onSelect, accent }) {
  const ref = useRef(null);
  const groups = groupTopicsByMonth(topics);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onToggle(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') onToggle(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onToggle]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2.5 font-bold transition ${
          active
            ? `${accent.trigger} text-white shadow-md`
            : 'bg-white/10 text-slate-100 hover:bg-white/20 active:bg-white/20'
        }`}
      >
        <span>
          {emoji} {name}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 max-h-[70vh] min-w-[16rem] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 py-1 shadow-2xl sm:left-0 sm:right-auto"
        >
          {groups.map((group) => (
            <div key={group.key}>
              {group.label && (
                <p className="px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
              )}
              {group.items.map((topic) => (
                <button
                  key={topic.id}
                  role="menuitem"
                  onClick={() => onSelect(topic.id)}
                  className={`flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left font-semibold ${
                    selected === topic.id
                      ? `${accent.item} text-white`
                      : 'text-slate-100 hover:bg-white/10 active:bg-white/10'
                  }`}
                >
                  <span aria-hidden="true">{topic.emoji}</span>
                  <span>{topic.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash);
  const [studyTopic, setStudyTopic] = useState(() =>
    getSavedTopic([...ROSE_TOPIC_IDS, ...RAEGAN_TOPIC_IDS]),
  );
  const [openMenu, setOpenMenu] = useState(null);

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

  if (route === 'tournament') {
    return <TournamentApp />;
  }

  const selectTopic = (id) => {
    setStudyTopic(id);
    setOpenMenu(null);
  };

  const menus = [
    {
      key: 'raegan',
      name: 'Raegan',
      emoji: '🌟',
      topics: RAEGAN_TOPICS,
      active: RAEGAN_TOPIC_IDS.includes(studyTopic),
      accent: { trigger: 'bg-emerald-500 shadow-emerald-900/40', item: 'bg-emerald-500' },
    },
    {
      key: 'rose',
      name: 'Rose',
      emoji: '🌹',
      topics: ROSE_TOPICS,
      active: ROSE_TOPIC_IDS.includes(studyTopic),
      accent: { trigger: 'bg-fuchsia-500 shadow-fuchsia-900/40', item: 'bg-fuchsia-500' },
    },
  ];

  return (
    <div>
      <nav className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-center gap-2 border-b border-white/10 bg-slate-900/95 px-4 py-3 text-white shadow-lg backdrop-blur">
        {menus.map((menu) => (
          <TopicMenu
            key={menu.key}
            name={menu.name}
            emoji={menu.emoji}
            topics={menu.topics}
            active={menu.active}
            accent={menu.accent}
            selected={studyTopic}
            open={openMenu === menu.key}
            onToggle={(next) => setOpenMenu(next ? menu.key : null)}
            onSelect={selectTopic}
          />
        ))}
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
