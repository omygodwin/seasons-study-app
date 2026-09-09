import React, { useState, useEffect, useMemo } from 'react';

/* One routine, rendered from a config in routines.js — the checklist, the
 * schedule and the printable sheet are the same for every routine, only the
 * steps and the wording differ.
 *
 * `minutes` is how long each step usually takes. The schedule is built
 * BACKWARDS from the time she has to leave, so changing the leave time moves
 * every other time with it — no math on a school morning. */
const WEEKDAYS = ['M', 'T', 'W', 'Th', 'F'];
const SHEET_STYLES = [
  { id: 'day', name: '📄 One day' },
  { id: 'week', name: '🗓️ Whole week' },
];
/* Local date, not UTC — at 11pm Central a UTC date would already be tomorrow
 * and would wipe the checklist mid-evening. */
function todayKey() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function parseTime(value, fallback) {
  const [h, m] = String(value).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    const [fh, fm] = fallback.split(':').map(Number);
    return fh * 60 + fm;
  }
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
// Each routine has its own storage key, so ticking one never touches the other.
function loadSaved(storageKey, defaultLeave) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    return {
      leaveTime: typeof saved.leaveTime === 'string' ? saved.leaveTime : defaultLeave,
      done: saved.date === todayKey() && Array.isArray(saved.done) ? saved.done : [],
    };
  } catch {
    /* private mode / storage disabled / bad JSON */
    return null;
  }
}

export default function RoutineApp({ routine }) {
  const { steps, storageKey, defaultLeave, title, subtitle, sheetTitle, doneMessage } = routine;
  const totalMinutes = useMemo(
    () => steps.reduce((sum, step) => sum + step.minutes, 0),
    [steps],
  );

  const [saved] = useState(() => loadSaved(storageKey, defaultLeave));
  const [activeTab, setActiveTab] = useState('checklist');
  const [sheetStyle, setSheetStyle] = useState('day');
  const [leaveTime, setLeaveTime] = useState(saved?.leaveTime ?? defaultLeave);
  const [done, setDone] = useState(() => new Set(saved?.done ?? []));

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ date: todayKey(), leaveTime, done: [...done] }),
      );
    } catch {
      /* private mode / storage disabled */
    }
  }, [storageKey, leaveTime, done]);

  /* Times run backwards from the leave time: each step starts as late as it
   * can while still leaving room for everything after it. */
  const schedule = useMemo(() => {
    const leaveAt = parseTime(leaveTime, defaultLeave);
    let remaining = totalMinutes;
    return steps.map((step) => {
      const startsAt = leaveAt - remaining;
      remaining -= step.minutes;
      return { ...step, startsAt, time: formatTime(startsAt) };
    });
  }, [steps, totalMinutes, leaveTime, defaultLeave]);

  const toggleStep = (id) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const nextStep = schedule.find((step) => !done.has(step.id));
  const finished = done.size === steps.length;
  const percent = Math.round((done.size / steps.length) * 100);

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
            {schedule[0].emoji} {schedule[0].label} at {schedule[0].time} ({totalMinutes} min
            routine)
          </p>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-baseline justify-between text-sm font-bold">
            <span className="text-pink-500">
              {done.size} / {steps.length} done
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
            <span className="text-pink-500">{doneMessage}</span>
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

  /* Blank version for the bathroom mirror — same steps, boxes to tick with a
   * pen. One copy of this is always rendered inside a `.print-only` wrapper
   * below, so Ctrl+P from either tab prints the sheet and never the
   * interactive checklist. Print rules live in src/index.css. */
  const renderSheet = () => (
    <div className="print-sheet mx-auto max-w-3xl rounded-lg bg-white p-6 text-slate-900 shadow">
      <div className="print-head">
        <span>Name: ______________________</span>
        <span>{sheetStyle === 'week' ? 'Week of: ____________' : 'Date: ____________'}</span>
      </div>
      <h3 className="print-title">{sheetTitle}</h3>

      {sheetStyle === 'week' ? (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-slate-500 p-2 text-left text-sm">Step</th>
              <th className="border border-slate-500 p-2 text-sm">Time</th>
              {WEEKDAYS.map((day) => (
                <th key={day} className="w-10 border border-slate-500 p-2 text-sm">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.map((step) => (
              <tr key={step.id}>
                <td className="border border-slate-500 p-2 font-bold">
                  <span aria-hidden="true">{step.emoji}</span> {step.label}
                </td>
                <td className="whitespace-nowrap border border-slate-500 p-2 text-center text-sm font-semibold">
                  {step.time}
                </td>
                {WEEKDAYS.map((day) => (
                  <td key={day} className="h-9 border border-slate-500" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul>
          {schedule.map((step) => (
            <li key={step.id} className="flex items-center gap-4 border-b border-slate-300 py-3">
              <span className="h-7 w-7 flex-none rounded border-2 border-slate-900" />
              <span className="text-2xl" aria-hidden="true">
                {step.emoji}
              </span>
              <span className="flex-1 text-lg font-bold">{step.label}</span>
              <span className="whitespace-nowrap text-base font-semibold text-slate-700">
                {step.time}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="print-note">Out the door by {formatTime(parseTime(leaveTime, defaultLeave))} ✨</p>
    </div>
  );

  const renderPrintTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SHEET_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => setSheetStyle(style.id)}
            className={`min-h-[44px] rounded-full border-2 px-4 font-semibold ${
              sheetStyle === style.id
                ? 'border-pink-200 bg-pink-50 text-pink-500'
                : 'border-transparent bg-white/70 text-slate-500 hover:bg-pink-50'
            }`}
          >
            {style.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-[44px] rounded-full border-2 border-sky-200 bg-sky-50 px-5 font-bold text-sky-600 hover:bg-sky-100"
        >
          🖨️ Print this sheet
        </button>
      </div>
      <p className="text-center text-sm text-slate-500">
        {sheetStyle === 'week'
          ? 'One sheet covers Monday to Friday — a box to tick per day.'
          : 'One day per sheet, with room to tick each step off.'}{' '}
        Times follow the leave time on the Checklist tab.
      </p>
      {renderSheet()}
    </div>
  );

  const tabs = [
    { id: 'checklist', name: '✅ Checklist' },
    { id: 'print', name: '🖨️ Print' },
  ];

  return (
    <div className="print-page min-h-screen bg-gradient-to-b from-pink-50 via-white to-sky-50 p-4 font-sans">
      <div className="no-print mx-auto max-w-3xl">
        <header className="no-print mb-6 text-center">
          <h1 className="bg-gradient-to-r from-pink-400 to-sky-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            {title}
          </h1>
          <h2 className="text-lg text-slate-600">{subtitle}</h2>
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
        {activeTab === 'print' && renderPrintTab()}
      </div>

      {/* The paper copy. Hidden on screen, so what prints is the same sheet
          whichever tab happens to be open. */}
      <div className="print-only">{renderSheet()}</div>
    </div>
  );
}
