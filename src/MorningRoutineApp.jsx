import React, { useState, useEffect, useMemo } from 'react';

/* Rose's morning routine — her own list, in her own order, in her colors.
 *
 * This is a checklist rather than a study topic, so it doesn't follow the
 * flashcard/quiz pattern the *StudyApp files share. What it does share: tabs,
 * a printable tab, and touch-first 44px targets.
 *
 * `minutes` is how long each step usually takes. The schedule is built
 * BACKWARDS from the time she has to leave, so changing the leave time moves
 * every other time with it — no math on a school morning. */
const STEPS = [
  {
    id: 'wake',
    label: 'Wake up',
    emoji: '☀️',
    minutes: 5,
    note: 'Feet on the floor. Snooze steals the whole routine.',
  },
  {
    id: 'tea',
    label: 'Get tea',
    emoji: '🍵',
    minutes: 5,
    note: 'Start it first — it can steep while you shower.',
  },
  {
    id: 'shower',
    label: 'Shower',
    emoji: '🚿',
    minutes: 15,
    note: 'Warm, not hot. Hot water is hard on your skin.',
  },
  {
    id: 'change',
    label: 'Change',
    emoji: '👚',
    minutes: 5,
    note: 'Outfit picked last night = 5 free minutes this morning.',
  },
  {
    id: 'breakfast',
    label: 'Breakfast',
    emoji: '🥞',
    minutes: 15,
    note: 'Something with protein so you still have legs at practice.',
  },
  {
    id: 'blowdry',
    label: 'Blow dry hair',
    emoji: '💨',
    minutes: 15,
    note: 'Finish on the cool shot — it sets the style.',
  },
  {
    id: 'skincare',
    label: 'Skincare',
    emoji: '🧴',
    minutes: 10,
    note: 'Cleanse → serum → moisturizer → SPF. Sunscreen every single day.',
  },
  {
    id: 'shoes',
    label: 'Shoes & socks',
    emoji: '👟',
    minutes: 5,
    note: 'Sports socks if it is a practice day.',
  },
  {
    id: 'leave',
    label: 'Leave',
    emoji: '🎒',
    minutes: 0,
    note: 'Bag, water bottle, tea. Go have a great day. 💖',
  },
];

const TOTAL_MINUTES = STEPS.reduce((sum, step) => sum + step.minutes, 0);
const STORAGE_KEY = 'roseMorningRoutine';
const DEFAULT_LEAVE = '07:30';

/* Local date, not UTC — at 11pm Central a UTC date would already be tomorrow
 * and would wipe the checklist mid-evening. */
function todayKey() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function parseTime(value) {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 7 * 60 + 30;
  return h * 60 + m;
}

function formatTime(totalMinutes) {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${hour24 < 12 ? 'AM' : 'PM'}`;
}

// Checked-off steps are kept for today only, so the list is fresh every morning.
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    return {
      leaveTime: typeof saved.leaveTime === 'string' ? saved.leaveTime : DEFAULT_LEAVE,
      done: saved.date === todayKey() && Array.isArray(saved.done) ? saved.done : [],
    };
  } catch {
    /* private mode / storage disabled / bad JSON */
    return null;
  }
}

export default function MorningRoutineApp() {
  const [saved] = useState(loadSaved);
  const [activeTab, setActiveTab] = useState('checklist');
  const [leaveTime, setLeaveTime] = useState(saved?.leaveTime ?? DEFAULT_LEAVE);
  const [done, setDone] = useState(() => new Set(saved?.done ?? []));

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: todayKey(), leaveTime, done: [...done] }),
      );
    } catch {
      /* private mode / storage disabled */
    }
  }, [leaveTime, done]);

  /* Times run backwards from the leave time: each step starts as late as it
   * can while still leaving room for everything after it. */
  const schedule = useMemo(() => {
    const leaveAt = parseTime(leaveTime);
    let remaining = TOTAL_MINUTES;
    return STEPS.map((step) => {
      const startsAt = leaveAt - remaining;
      remaining -= step.minutes;
      return { ...step, startsAt, time: formatTime(startsAt) };
    });
  }, [leaveTime]);

  const toggleStep = (id) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const nextStep = schedule.find((step) => !done.has(step.id));
  const finished = done.size === STEPS.length;
  const percent = Math.round((done.size / STEPS.length) * 100);

  const renderChecklist = () => (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 font-semibold text-slate-700">
            <span aria-hidden="true">🕗</span>
            <span>I have to leave at</span>
            <input
              type="time"
              value={leaveTime}
              onChange={(e) => setLeaveTime(e.target.value)}
              className="min-h-[44px] rounded-xl border-2 border-pink-200 bg-pink-50 px-3 font-bold text-pink-500 focus:border-pink-300 focus:outline-none"
            />
          </label>
          <p className="text-sm font-semibold text-sky-600">
            ☀️ Wake up at {schedule[0].time} ({TOTAL_MINUTES} min routine)
          </p>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-baseline justify-between text-sm font-bold">
            <span className="text-pink-500">
              {done.size} / {STEPS.length} done
            </span>
            <span className="text-sky-500">{percent}%</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-pink-50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-300 to-sky-300 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <p className="mt-3 text-center text-sm font-semibold text-slate-600">
          {finished ? (
            <span className="text-pink-500">
              🏆 Whole routine done — glowing and out the door. Have the best day! 💖
            </span>
          ) : (
            <>
              Next up: {nextStep.emoji} <span className="text-sky-600">{nextStep.label}</span> at{' '}
              {nextStep.time}
            </>
          )}
        </p>
      </div>

      <ol className="space-y-3">
        {schedule.map((step, index) => {
          const isDone = done.has(step.id);
          const isNext = !finished && step.id === nextStep.id;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => toggleStep(step.id)}
                aria-pressed={isDone}
                className={`flex min-h-[64px] w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
                  isDone
                    ? 'border-pink-100 bg-pink-50'
                    : isNext
                      ? 'border-sky-300 bg-white shadow-lg ring-2 ring-sky-100'
                      : 'border-pink-100 bg-white shadow-sm hover:border-sky-200'
                }`}
              >
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 text-lg font-bold ${
                    isDone
                      ? 'border-pink-300 bg-pink-200 text-pink-600'
                      : 'border-pink-200 text-slate-400'
                  }`}
                  aria-hidden="true"
                >
                  {isDone ? '✓' : index + 1}
                </span>
                <span className="text-3xl" aria-hidden="true">
                  {step.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-lg font-bold ${
                      isDone ? 'text-pink-400 line-through' : 'text-slate-800'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className={`block text-sm ${isDone ? 'text-pink-300' : 'text-slate-500'}`}>
                    {step.note}
                  </span>
                </span>
                <span className="flex-none text-right">
                  <span
                    className={`block text-sm font-bold ${
                      isDone ? 'text-pink-300' : 'text-sky-600'
                    }`}
                  >
                    {step.time}
                  </span>
                  {step.minutes > 0 && (
                    <span className="block text-xs text-slate-400">{step.minutes} min</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setDone(new Set())}
          className="min-h-[44px] rounded-full border-2 border-pink-200 bg-white px-6 font-semibold text-pink-500 hover:bg-pink-50"
        >
          🔄 Start Over
        </button>
      </div>
    </div>
  );

  /* Blank version for the bathroom mirror — same steps, boxes to check with a
   * pen. Print rules live in src/index.css. */
  const renderPrint = () => (
    <div className="space-y-4">
      <p className="no-print text-center text-sm text-slate-600">
        Print this and tape it up. The times come from the leave time on the Checklist tab.
      </p>
      <div className="print-sheet rounded-lg bg-white p-6 shadow">
        <div className="print-head">
          <span>Name: ______________________</span>
          <span>Date: ____________</span>
        </div>
        <h3 className="print-title">September Morning Routine 💖🏀</h3>
        <ul className="space-y-2">
          {schedule.map((step) => (
            <li key={step.id} className="flex items-center gap-3 border-b border-slate-200 py-2">
              <span className="h-6 w-6 flex-none rounded border-2 border-slate-800" />
              <span className="text-xl" aria-hidden="true">
                {step.emoji}
              </span>
              <span className="flex-1 font-bold text-slate-900">{step.label}</span>
              <span className="text-sm font-semibold text-slate-700">{step.time}</span>
            </li>
          ))}
        </ul>
        <p className="print-note">Out the door by {formatTime(parseTime(leaveTime))} ✨</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'checklist', name: '✅ Checklist' },
    { id: 'print', name: '🖨️ Print' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-sky-50 p-4 font-sans">
      <div className="mx-auto max-w-3xl">
        <header className="no-print mb-6 text-center">
          <h1 className="bg-gradient-to-r from-pink-400 to-sky-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            September Morning Routine
          </h1>
          <h2 className="text-lg text-slate-600">Tea, skincare, and out the door 💖🏀</h2>
        </header>

        <div className="no-print mb-6 flex flex-wrap justify-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`min-h-[44px] rounded-lg px-4 font-semibold transition-transform duration-200 ${
                activeTab === t.id
                  ? 'scale-110 border-2 border-pink-200 bg-gradient-to-r from-pink-100 to-sky-100 text-slate-700 shadow-md'
                  : 'border-2 border-transparent bg-white/70 text-slate-500 shadow-sm hover:bg-pink-50'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {activeTab === 'checklist' && renderChecklist()}
        {activeTab === 'print' && renderPrint()}
      </div>
    </div>
  );
}
