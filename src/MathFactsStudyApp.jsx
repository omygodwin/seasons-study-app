import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* Ruth's multiplication facts, 1-12.
 *
 * Fact fluency is a different problem from the flashcard topics, so this does
 * not use Flashcards.jsx. The goal is automatic retrieval, not recognition:
 *
 *   Speed is part of the definition. A fact she works out by skip-counting is
 *   not yet learned, so a fact counts as fluent only when it is answered
 *   correctly AND inside FLUENT_MS. Accuracy is still tracked first — nothing
 *   is pushed for speed until she gets it right.
 *
 *   Commutativity halves the work. 7x8 and 8x7 are one fact to learn, so state
 *   is keyed on the sorted pair and 1-12 is 78 facts rather than 144. Both
 *   orders still get shown, which is how the pairing gets noticed.
 *
 *   Small sets, mostly known. Incremental rehearsal: a round is mostly facts
 *   she already has, with at most NEW_PER_ROUND unseen ones folded in. Drilling
 *   a pile of unknowns at once is the common way this goes wrong.
 *
 *   Practice and Mad Minute are deliberately different. Practice corrects her
 *   immediately, which is where the learning happens. Mad Minute stays silent
 *   for the full minute and scores at the end, because it exists to rehearse
 *   the timed sheet she does at school — and a drill she has already met at
 *   home is a smaller event than one she has not. */

const MAX = 12;
const STORAGE_KEY = 'mathfacts:ruth';
const FLUENT_MS = 3000;
const ROUND = 12;
const NEW_PER_ROUND = 2;
const MAD_SECONDS = 60;
const MAD_KEEP = 12;

const pairId = (a, b) => `${Math.min(a, b)}x${Math.max(a, b)}`;

const FACTS = (() => {
  const out = [];
  for (let a = 1; a <= MAX; a++) for (let b = a; b <= MAX; b++) out.push({ id: pairId(a, b), a, b });
  return out;
})();

function todayISO() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const EMPTY = { v: 1, facts: {}, mad: [], keypad: 'onscreen' };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw);
    if (!p || p.v !== 1) return EMPTY;
    return { ...EMPTY, ...p, facts: p.facts && typeof p.facts === 'object' ? p.facts : {} };
  } catch {
    return EMPTY; /* private mode / storage disabled */
  }
}

/* untried -> needs work -> learning -> fluent. "Needs work" is a status, not a
 * stage: any fact she is getting wrong lands there however long she has had it. */
function levelOf(st) {
  if (!st || !st.n) return 'untried';
  if (st.c / st.n < 0.7 || st.streak === 0) return 'needswork';
  if (st.streak >= 3 && st.last && st.last <= FLUENT_MS) return 'fluent';
  return 'learning';
}

const LEVELS = {
  fluent: { label: 'Fluent', dot: 'bg-green-700', cell: 'bg-green-700 text-white', note: 'fast and right' },
  learning: { label: 'Getting it', dot: 'bg-sky-600', cell: 'bg-sky-600 text-white', note: 'right, still slow' },
  needswork: { label: 'Needs work', dot: 'bg-amber-700', cell: 'bg-amber-700 text-white', note: 'missing it' },
  untried: { label: 'Not tried', dot: 'bg-slate-300', cell: 'bg-slate-200 text-slate-500', note: 'not seen yet' },
};

/* One round: mostly facts she is working on, at most NEW_PER_ROUND new ones,
 * and any fluent facts that are due back.
 *
 * Padding order matters. When the round comes up short, it fills with facts she
 * ALREADY knows — reviewing a fluent fact a little early is harmless, whereas
 * introducing a pile of new ones is the failure mode incremental rehearsal
 * exists to prevent. New facts are only allowed to fill a round when she has
 * essentially no known base yet, i.e. the very first sessions. */
function buildRound(facts) {
  const today = todayISO();
  const by = { needswork: [], learning: [], untried: [], due: [], fluent: [] };
  FACTS.forEach((f) => {
    const st = facts[f.id];
    const lvl = levelOf(st);
    if (lvl === 'untried') by.untried.push(f);
    else if (lvl === 'fluent') {
      by.fluent.push(f);
      if (!st.due || st.due <= today) by.due.push(f);
    } else by[lvl].push(f);
  });

  const picked = [];
  const room = () => ROUND - picked.length;
  const take = (list, n) => shuffle(list).slice(0, Math.max(0, n)).forEach((f) => picked.push(f));

  take(by.needswork, 5);
  take(by.learning, 4);
  take(by.due, 3);

  // New facts, easiest first — roughly the order they get taught.
  const knownBase = FACTS.length - by.untried.length;
  if (room() > 0) {
    const cap = knownBase >= 6 ? NEW_PER_ROUND : room();
    [...by.untried]
      .sort((x, y) => x.a * x.b - y.a * y.b)
      .slice(0, Math.min(cap, room()))
      .forEach((f) => picked.push(f));
  }

  // Pad from what she knows before reaching for more new material.
  if (room() > 0) {
    const pool = [...by.fluent, ...by.learning, ...by.needswork].filter((f) => !picked.includes(f));
    take(pool, room());
  }
  if (picked.length === 0) take(FACTS, ROUND);

  // Show either order, so the pair gets noticed rather than memorized one way.
  return shuffle(picked).slice(0, ROUND).map((f) => (Math.random() < 0.5 ? { ...f } : { ...f, a: f.b, b: f.a }));
}

function randomProblem() {
  const a = 1 + Math.floor(Math.random() * MAX);
  const b = 1 + Math.floor(Math.random() * MAX);
  return { id: pairId(a, b), a, b };
}

/* Digits, backspace and a big Next. On-screen by default: iOS's numeric
 * keyboard has no return key, so a device keyboard would mean reaching for a
 * separate Next button between every answer — and it covers half an iPad. This
 * keeps digits and Next one thumb apart and never shifts the layout. A hardware
 * keyboard still works either way (see the keydown handler below), and the
 * device keyboard is available from Settings for anyone who prefers it. */
function Keypad({ onDigit, onBack, onNext, nextLabel, disabled }) {
  const key =
    'min-h-[58px] rounded-xl text-2xl font-bold shadow-sm active:translate-y-px disabled:opacity-40 ' +
    'touch-manipulation select-none';
  return (
    <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onDigit(String(d))}
          disabled={disabled}
          className={`${key} bg-white text-slate-800 hover:bg-sky-50`}
        >
          {d}
        </button>
      ))}
      <button
        type="button"
        onClick={onBack}
        disabled={disabled}
        aria-label="Delete"
        className={`${key} bg-slate-200 text-slate-700 hover:bg-slate-300`}
      >
        ⌫
      </button>
      <button
        type="button"
        onClick={() => onDigit('0')}
        disabled={disabled}
        className={`${key} bg-white text-slate-800 hover:bg-sky-50`}
      >
        0
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className={`${key} bg-sky-600 text-white hover:bg-sky-700`}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function ProblemCard({ a, b, value, flash }) {
  const ring =
    flash === 'right' ? 'ring-4 ring-green-500' : flash === 'wrong' ? 'ring-4 ring-amber-600' : 'ring-1 ring-slate-200';
  return (
    <div className={`rounded-2xl bg-white p-6 text-center shadow-lg sm:p-8 ${ring}`}>
      <p className="font-mono text-4xl font-bold tabular-nums text-slate-800 sm:text-5xl">
        {a} × {b} ={' '}
        <span className="inline-block min-w-[2.2ch] border-b-4 border-sky-600 text-sky-700">
          {value || ' '}
        </span>
      </p>
    </div>
  );
}

export default function MathFactsStudyApp() {
  const [tab, setTab] = useState('practice');
  const [state, setState] = useState(loadState);

  // practice
  const [queue, setQueue] = useState([]);
  const [qAt, setQAt] = useState(0);
  const [entry, setEntry] = useState('');
  const [flash, setFlash] = useState(null);
  const [roundLog, setRoundLog] = useState([]);
  const [phase, setPhase] = useState('start'); // start | run | done

  // mad minute
  const [madPhase, setMadPhase] = useState('start'); // start | run | done
  const [madLeft, setMadLeft] = useState(MAD_SECONDS);
  const [madProblem, setMadProblem] = useState(null);
  const [madLog, setMadLog] = useState([]);
  const shownAt = useRef(Date.now());
  const tick = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private mode — the session still works, it just won't be remembered */
    }
  }, [state]);

  const counts = useMemo(() => {
    const c = { fluent: 0, learning: 0, needswork: 0, untried: 0 };
    FACTS.forEach((f) => { c[levelOf(state.facts[f.id])] += 1; });
    return c;
  }, [state.facts]);

  /* One place records an answer, so Practice and Mad Minute cannot drift on what
   * counts as fluent. Spacing only applies once a fact is actually fluent. */
  const record = useCallback((id, right, ms) => {
    setState((s) => {
      const prev = s.facts[id] ?? { n: 0, c: 0, streak: 0, last: null, best: null };
      const streak = right ? prev.streak + 1 : 0;
      const next = {
        n: prev.n + 1,
        c: prev.c + (right ? 1 : 0),
        streak,
        last: right ? ms : null,
        best: right ? Math.min(prev.best ?? ms, ms) : prev.best,
        due: prev.due,
      };
      if (right && streak >= 3 && ms <= FLUENT_MS) {
        next.due = daysFromNow(Math.min(16, 2 ** (streak - 3) + 1));
      } else {
        next.due = todayISO();
      }
      return { ...s, facts: { ...s.facts, [id]: next } };
    });
  }, []);

  // ---------- practice ----------
  const startRound = () => {
    setQueue(buildRound(state.facts));
    setQAt(0);
    setEntry('');
    setFlash(null);
    setRoundLog([]);
    setPhase('run');
    shownAt.current = Date.now();
  };

  const submitPractice = useCallback(() => {
    if (flash || entry === '') return;
    const q = queue[qAt];
    if (!q) return;
    const ms = Date.now() - shownAt.current;
    const right = Number(entry) === q.a * q.b;
    record(q.id, right, ms);
    setRoundLog((l) => [...l, { ...q, answer: entry, right, ms }]);
    setFlash(right ? 'right' : 'wrong');
    setTimeout(
      () => {
        setFlash(null);
        setEntry('');
        if (qAt + 1 >= queue.length) setPhase('done');
        else { setQAt((i) => i + 1); shownAt.current = Date.now(); }
      },
      right ? 450 : 1500,
    );
  }, [flash, entry, queue, qAt, record]);

  // ---------- mad minute ----------
  const startMad = () => {
    setMadLog([]);
    setMadLeft(MAD_SECONDS);
    setMadProblem(randomProblem());
    setEntry('');
    setMadPhase('run');
    shownAt.current = Date.now();
  };

  const endMad = useCallback(() => {
    if (tick.current) { clearInterval(tick.current); tick.current = null; }
    setMadPhase('done');
    setMadLog((log) => {
      const score = log.filter((x) => x.right).length;
      setState((s) => ({
        ...s,
        mad: [...s.mad, { score, total: log.length, date: todayISO() }].slice(-MAD_KEEP),
      }));
      return log;
    });
  }, []);

  useEffect(() => {
    if (madPhase !== 'run') return undefined;
    tick.current = setInterval(() => {
      setMadLeft((t) => {
        if (t <= 1) { endMad(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [madPhase, endMad]);

  /* No feedback during the minute — same as the paper sheet. */
  const submitMad = useCallback(() => {
    if (entry === '' || !madProblem) return;
    const ms = Date.now() - shownAt.current;
    const right = Number(entry) === madProblem.a * madProblem.b;
    record(madProblem.id, right, ms);
    setMadLog((l) => [...l, { ...madProblem, answer: entry, right }]);
    setEntry('');
    setMadProblem(randomProblem());
    shownAt.current = Date.now();
  }, [entry, madProblem, record]);

  const active = tab === 'practice' ? phase === 'run' : madPhase === 'run';
  const submit = tab === 'practice' ? submitPractice : submitMad;

  const pushDigit = useCallback((d) => {
    if (flash) return;
    setEntry((e) => (e.length >= 3 ? e : e + d));
  }, [flash]);

  // A hardware keyboard works in both keypad modes: iPad Magic Keyboard, laptop.
  useEffect(() => {
    if (!active) return undefined;
    function onKey(e) {
      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); pushDigit(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); setEntry((v) => v.slice(0, -1)); }
      else if (e.key === 'Enter') { e.preventDefault(); submit(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, pushDigit, submit]);

  const useDevice = state.keypad === 'device';
  const renderInput = (label) => (
    <>
      {useDevice && (
        <div className="flex justify-center">
          <input
            ref={inputRef}
            id="mf-answer"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={entry}
            onChange={(e) => setEntry(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
            aria-label="Answer"
            /* text-lg keeps it at 16px+, below which iOS zooms the page on focus */
            className="w-32 rounded-xl border-2 border-sky-300 p-3 text-center text-2xl font-bold tabular-nums"
          />
        </div>
      )}
      {!useDevice && (
        <Keypad
          onDigit={pushDigit}
          onBack={() => setEntry((v) => v.slice(0, -1))}
          onNext={submit}
          nextLabel={label}
          disabled={!!flash}
        />
      )}
      {useDevice && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={submit}
            className="min-h-[58px] w-full max-w-sm rounded-xl bg-sky-600 px-6 text-xl font-bold text-white shadow hover:bg-sky-700"
          >
            {label}
          </button>
        </div>
      )}
    </>
  );

  // ---------- practice ----------
  const renderPractice = () => {
    if (phase === 'start') {
      const ready = counts.needswork + counts.learning + counts.untried;
      return (
        <div className="space-y-5 text-center">
          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-2xl font-bold text-sky-800">
              {counts.fluent} of {FACTS.length} facts fluent
            </p>
            <p className="mx-auto mt-2 max-w-md text-slate-600">
              A round is {ROUND} problems, mostly ones you are working on. Try to
              just <em>know</em> it rather than count it up — that is what makes it stick.
            </p>
            <button
              onClick={startRound}
              disabled={ready === 0 && counts.fluent === 0}
              className="mt-5 min-h-[56px] w-full max-w-xs rounded-xl bg-sky-600 px-8 text-lg font-bold text-white shadow-lg hover:bg-sky-700 disabled:bg-slate-400"
            >
              ▶︎ Start a round
            </button>
          </div>
        </div>
      );
    }

    if (phase === 'done') {
      const right = roundLog.filter((x) => x.right).length;
      const missed = roundLog.filter((x) => !x.right);
      return (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 text-center shadow">
            <p className="text-3xl font-bold text-sky-800">
              {right} / {roundLog.length} right
            </p>
            {missed.length > 0 ? (
              <>
                <p className="mt-3 text-slate-600">These come back next round:</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {missed.map((m, i) => (
                    <span key={i} className="rounded-lg bg-amber-100 px-3 py-1 font-mono font-bold text-amber-900">
                      {m.a} × {m.b} = {m.a * m.b}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 font-semibold text-green-700">Perfect round. 🎉</p>
            )}
            <button
              onClick={startRound}
              className="mt-5 min-h-[56px] w-full max-w-xs rounded-xl bg-sky-600 px-8 text-lg font-bold text-white shadow hover:bg-sky-700"
            >
              Another round
            </button>
          </div>
        </div>
      );
    }

    const q = queue[qAt];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-sky-100">
            <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${(qAt / queue.length) * 100}%` }} />
          </div>
          <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-sky-800">
            {qAt + 1} / {queue.length}
          </span>
        </div>

        <ProblemCard a={q.a} b={q.b} value={entry} flash={flash} />

        <div aria-live="polite" className="min-h-[28px] text-center font-semibold">
          {flash === 'right' && <span className="text-green-700">Yes! ✓</span>}
          {flash === 'wrong' && (
            <span className="text-amber-800">
              {q.a} × {q.b} = {q.a * q.b}
            </span>
          )}
        </div>

        {renderInput('Next →')}
      </div>
    );
  };

  // ---------- mad minute ----------
  const renderMad = () => {
    if (madPhase === 'start') {
      const best = state.mad.reduce((m, r) => Math.max(m, r.score), 0);
      return (
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          <p className="text-2xl font-bold text-sky-800">One minute. How many can you get?</p>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            Just like the sheet at school: no hints until time is up. Skip nothing —
            a wrong answer still moves you on.
          </p>
          {best > 0 && (
            <p className="mt-3 font-semibold text-slate-700">
              Your best so far: <span className="text-sky-700">{best}</span>
            </p>
          )}
          <button
            onClick={startMad}
            className="mt-5 min-h-[56px] w-full max-w-xs rounded-xl bg-sky-600 px-8 text-lg font-bold text-white shadow-lg hover:bg-sky-700"
          >
            ⏱ Start the minute
          </button>
        </div>
      );
    }

    if (madPhase === 'done') {
      const score = madLog.filter((x) => x.right).length;
      const missed = madLog.filter((x) => !x.right);
      const prevBest = state.mad.slice(0, -1).reduce((m, r) => Math.max(m, r.score), 0);
      return (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 text-center shadow">
            <p className="text-5xl font-bold tabular-nums text-sky-800">{score}</p>
            <p className="mt-1 text-slate-600">right out of {madLog.length} tried</p>
            {score > prevBest && prevBest > 0 && (
              <p className="mt-2 font-bold text-green-700">🎉 New best — beat {prevBest}!</p>
            )}
            {missed.length > 0 && (
              <>
                <p className="mt-4 text-slate-600">Missed these — they are queued for practice:</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {missed.map((m, i) => (
                    <span key={i} className="rounded-lg bg-amber-100 px-3 py-1 font-mono font-bold text-amber-900">
                      {m.a} × {m.b} = {m.a * m.b}
                    </span>
                  ))}
                </div>
              </>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={startMad} className="min-h-[56px] rounded-xl bg-sky-600 px-6 font-bold text-white shadow hover:bg-sky-700">
                Go again
              </button>
              <button onClick={() => setTab('practice')} className="min-h-[56px] rounded-xl bg-white px-6 font-bold text-sky-800 shadow hover:bg-sky-50">
                Practice the misses
              </button>
            </div>
          </div>
          {state.mad.length > 0 && renderScores()}
        </div>
      );
    }

    const low = madLeft <= 10;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className={`font-mono text-3xl font-bold tabular-nums ${low ? 'text-amber-700' : 'text-sky-800'}`}>
            0:{String(madLeft).padStart(2, '0')}
          </span>
          <span className="font-mono text-lg font-bold tabular-nums text-slate-600">{madLog.length} done</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-sky-100">
          <div
            className={`h-full rounded-full transition-all ${low ? 'bg-amber-600' : 'bg-sky-600'}`}
            style={{ width: `${(madLeft / MAD_SECONDS) * 100}%` }}
          />
        </div>
        {madProblem && <ProblemCard a={madProblem.a} b={madProblem.b} value={entry} flash={null} />}
        {renderInput('Next →')}
        <div className="flex justify-center">
          <button onClick={endMad} className="min-h-[44px] rounded-lg px-4 text-sm text-slate-500 underline hover:text-slate-700">
            Stop early
          </button>
        </div>
      </div>
    );
  };

  /* Her own last dozen scores. One series, so no legend; the personal best is
   * the only labelled bar because that is the number she is chasing. */
  const renderScores = () => {
    const rows = state.mad.slice(-MAD_KEEP);
    const best = rows.reduce((m, r) => Math.max(m, r.score), 0) || 1;
    // Under four runs there is no shape to see yet, so it stays a sentence.
    if (rows.length < 4) {
      return (
        <div className="rounded-2xl bg-white p-5 text-center shadow">
          <p className="text-slate-700">
            Best so far: <span className="text-xl font-bold text-sky-700">{best}</span> in a minute
            {rows.length > 1 ? ` over ${rows.length} tries` : ''}. A few more and you will see the trend here.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h3 className="mb-3 font-bold text-slate-800">
          Your last {rows.length} {rows.length === 1 ? 'minute' : 'minutes'}
        </h3>
        <div className="flex h-28 items-end justify-center gap-1.5">
          {rows.map((r, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1" style={{ maxWidth: 34 }}>
              <span className="font-mono text-[10px] font-bold tabular-nums text-slate-500">
                {r.score === best ? r.score : ''}
              </span>
              <div
                className={`w-full rounded-t ${r.score === best ? 'bg-green-700' : 'bg-sky-600'}`}
                style={{ height: `${Math.max(6, (r.score / best) * 76)}px` }}
                title={`${r.score} right on ${r.date}`}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">Oldest to newest · best in green</p>
      </div>
    );
  };

  // ---------- progress ----------
  const renderProgress = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {['fluent', 'learning', 'needswork', 'untried'].map((k) => (
          <div key={k} className="rounded-xl bg-white p-3 text-center shadow">
            <p className="text-2xl font-bold tabular-nums text-slate-800">{counts[k]}</p>
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${LEVELS[k].dot}`} aria-hidden="true" />
              {LEVELS[k].label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <h3 className="mb-1 font-bold text-slate-800">Every fact, 1 to 12</h3>
        <p className="mb-3 text-sm text-slate-600">
          Each square is one fact. The grid is symmetric because 7 × 8 and 8 × 7 are the same
          thing to learn — tap any square to see where it stands.
        </p>
        <div className="overflow-x-auto">
          <table className="mx-auto border-separate" style={{ borderSpacing: 2 }}>
            <caption className="sr-only">Multiplication facts 1 to 12 by mastery</caption>
            <thead>
              <tr>
                <th className="w-7 text-[10px] text-slate-400">×</th>
                {Array.from({ length: MAX }, (_, i) => (
                  <th key={i} className="w-7 font-mono text-[10px] font-bold text-slate-500">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: MAX }, (_, r) => (
                <tr key={r}>
                  <th className="w-7 font-mono text-[10px] font-bold text-slate-500">{r + 1}</th>
                  {Array.from({ length: MAX }, (_, c) => {
                    const lvl = levelOf(state.facts[pairId(r + 1, c + 1)]);
                    return (
                      <td key={c}>
                        <span
                          title={`${r + 1} × ${c + 1} = ${(r + 1) * (c + 1)} — ${LEVELS[lvl].label}, ${LEVELS[lvl].note}`}
                          className={`flex h-7 w-7 items-center justify-center rounded font-mono text-[10px] font-bold tabular-nums ${LEVELS[lvl].cell}`}
                        >
                          {(r + 1) * (c + 1)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {['fluent', 'learning', 'needswork', 'untried'].map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`inline-block h-3 w-3 rounded ${LEVELS[k].dot}`} aria-hidden="true" />
              {LEVELS[k].label}
            </span>
          ))}
        </div>
      </div>

      {state.mad.length > 0 && renderScores()}

      <div className="text-center">
        <button
          onClick={() => {
            if (window.confirm('Erase all math fact progress? Mad Minute scores are kept.')) {
              setState((s) => ({ ...s, facts: {} }));
            }
          }}
          className="min-h-[44px] rounded-lg px-4 text-sm text-slate-500 underline hover:text-slate-700"
        >
          Reset fact progress
        </button>
      </div>
    </div>
  );

  // ---------- tables ----------
  const renderTables = () => (
    <div className="space-y-4">
      <p className="text-slate-600">
        The whole set, for looking over before a round. Green means you already have it fast.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: MAX }, (_, i) => i + 1).map((n) => (
          <div key={n} className="rounded-xl bg-white p-4 shadow">
            <h3 className="mb-2 font-bold text-sky-800">{n}× table</h3>
            <ul className="space-y-0.5 font-mono text-sm tabular-nums">
              {Array.from({ length: MAX }, (_, j) => j + 1).map((m) => {
                const lvl = levelOf(state.facts[pairId(n, m)]);
                return (
                  <li key={m} className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${LEVELS[lvl].dot}`} aria-hidden="true" />
                    <span className="text-slate-700">
                      {n} × {m} = <strong className="text-slate-900">{n * m}</strong>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'practice', name: '✏️ Practice' },
    { id: 'mad', name: '⏱ Mad Minute' },
    { id: 'progress', name: '📊 Progress' },
    { id: 'tables', name: '📋 Tables' },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-5xl touch-manipulation bg-sky-50 p-4 font-sans sm:p-6">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-sky-800">Math Facts</h1>
        <h2 className="text-lg text-gray-600">Multiplication, 1 to 12</h2>
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-[48px] rounded-xl px-4 py-2.5 font-semibold transition ${
              tab === t.id
                ? 'bg-sky-800 text-white shadow-lg ring-2 ring-sky-900 ring-offset-2 ring-offset-sky-50'
                : 'bg-sky-600 text-white hover:bg-sky-700'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-white/70 p-4 shadow-lg backdrop-blur-sm sm:p-6">
        {tab === 'practice' && renderPractice()}
        {tab === 'mad' && renderMad()}
        {tab === 'progress' && renderProgress()}
        {tab === 'tables' && renderTables()}
      </div>

      {(tab === 'practice' || tab === 'mad') && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setState((s) => ({ ...s, keypad: s.keypad === 'device' ? 'onscreen' : 'device' }))}
            className="min-h-[44px] rounded-lg px-4 text-sm text-slate-500 underline hover:text-slate-700"
          >
            {useDevice ? 'Use the on-screen keypad' : "Use my device's number keyboard"}
          </button>
        </div>
      )}
    </div>
  );
}
