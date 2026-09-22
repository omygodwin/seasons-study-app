import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* Ruth's multiplication and division facts, 1-12.
 *
 * Fact fluency is a different problem from the flashcard topics, so this does
 * not use Flashcards.jsx. The goal is automatic retrieval, not recognition:
 *
 *   Speed is part of the definition. A fact she works out by skip-counting is
 *   not yet learned, so a fact counts as fluent only when it is answered
 *   correctly AND inside FLUENT_MS. Accuracy is still tracked first — nothing
 *   is pushed for speed until she gets it right.
 *
 *   Commutativity halves the multiplication work. 7x8 and 8x7 are one fact to
 *   learn, so state is keyed on the sorted pair and 1-12 is 78 facts rather
 *   than 144. Both orders still get shown, which is how the pairing gets
 *   noticed. Division is NOT commutative: 56/7 and 56/8 are two separate
 *   facts, which is why they are keyed on (product, divisor) instead.
 *
 *   Division is gated on the multiplication. A division fact only enters the
 *   pool once its multiplication pair is fluent, because the whole reason to
 *   add division is that it is nearly free once the product is known --
 *   "knowing that 8 x 5 = 40, one knows 40 / 5 = 8" (CCSS 3.OA.C.7). Met cold,
 *   it is just a harder unknown. Siegler et al. (2012) found fifth-grade
 *   fraction AND DIVISION knowledge predicts high-school algebra, controlling
 *   for whole-number multiplication — so division is where the value is once
 *   the times tables are in.
 *
 *   Mixing the two is the point, not a convenience. Interleaving problem types
 *   is one of the larger effects in maths instruction (Rohrer et al. 2020 RCT,
 *   787 students, d = 0.83) because it forces her to pick an operation instead
 *   of running the same one twelve times. Note this is the OPPOSITE of the
 *   call in Flashcards.jsx, where decks are blocked — that asymmetry is real
 *   and deliberate, see docs/learning-design.md before "fixing" either one.
 *
 *   Small sets, mostly known. Incremental rehearsal: a round is mostly facts
 *   she already has, with at most NEW_PER_ROUND unseen ones folded in. Drilling
 *   a pile of unknowns at once is the common way this goes wrong.
 *
 *   Strategy hints only where she is slow. Fluency is supposed to be a
 *   reasoning strategy that became automatic, not a lookup that was memorised
 *   (Bay-Williams & Kling). A right-but-slow answer is the signature of
 *   skip-counting, so that is exactly where the derived route is shown -- and
 *   nowhere else, because a hint on a fast correct answer is just noise.
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
const mulId = (a, b) => `m:${pairId(a, b)}`;
const divId = (product, divisor) => `d:${product}/${divisor}`;

/* Every question carries the same shape: an `id` to key state on, a `kind`,
 * the numbers to print, and the `answer`. `weight` orders "new" facts easiest
 * first, roughly the order they get taught. */
const MUL_FACTS = (() => {
  const out = [];
  for (let a = 1; a <= MAX; a++) {
    for (let b = a; b <= MAX; b++) {
      out.push({ kind: 'mul', id: mulId(a, b), a, b, answer: a * b, weight: a * b });
    }
  }
  return out;
})();

/* Two division facts per pair (56/7 and 56/8), one for a square (64/8).
 * (product, divisor) is unique across pairs, so these ids never collide. */
const DIV_FACTS = (() => {
  const out = [];
  for (let a = 1; a <= MAX; a++) {
    for (let b = a; b <= MAX; b++) {
      const product = a * b;
      const divisors = a === b ? [a] : [a, b];
      divisors.forEach((d) => {
        out.push({
          kind: 'div',
          id: divId(product, d),
          mulKey: mulId(a, b),
          product,
          divisor: d,
          answer: product / d,
          weight: product,
        });
      });
    }
  }
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

const MODES = [
  { id: 'mixed', label: 'Mixed', hint: 'both, jumbled up' },
  { id: 'mul', label: '× only', hint: 'multiplication' },
  { id: 'div', label: '÷ only', hint: 'division' },
];

const EMPTY = { v: 2, facts: {}, mad: [], keypad: 'onscreen', mode: 'mixed' };

/* v1 stored multiplication facts under a bare sorted pair ("3x4"). v2 adds
 * division, so keys are namespaced ("m:3x4", "d:12/3") — migrate rather than
 * reset, because her multiplication progress is the thing that unlocks it. */
function migrateFacts(raw) {
  const out = {};
  Object.entries(raw && typeof raw === 'object' ? raw : {}).forEach(([k, v]) => {
    out[k.startsWith('m:') || k.startsWith('d:') ? k : `m:${k}`] = v;
  });
  return out;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return EMPTY;
    if (p.v !== 1 && p.v !== 2) return EMPTY;
    return {
      ...EMPTY,
      mad: Array.isArray(p.mad) ? p.mad : [],
      keypad: p.keypad === 'device' ? 'device' : 'onscreen',
      mode: MODES.some((m) => m.id === p.mode) ? p.mode : 'mixed',
      facts: p.v === 1 ? migrateFacts(p.facts) : (p.facts && typeof p.facts === 'object' ? p.facts : {}),
    };
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
  /* Display only — a division fact whose × fact is not fluent yet. Shows a dot
   * rather than its number, so it never reads as "grey = not tried". */
  locked: { label: 'Locked', dot: 'bg-slate-200', cell: 'bg-slate-100 text-slate-400', note: 'learn the × fact first' },
};

/* A division fact is only in play once its multiplication pair is fluent. */
const divReady = (facts, f) => levelOf(facts[f.mulKey]) === 'fluent';

function eligibleFacts(facts, mode) {
  const out = [];
  if (mode !== 'div') out.push(...MUL_FACTS);
  if (mode !== 'mul') out.push(...DIV_FACTS.filter((f) => divReady(facts, f)));
  return out.length ? out : MUL_FACTS;
}

/* The derived route for a fact, shown only when she was wrong or slow.
 *
 * Rules are ordered by how useful the route is, not by the size of the number,
 * and each is tried against both operands — so 9 x 12 gets the x10-minus-one
 * route rather than the x12 one. Every multiplier 1-12 except 7 has a rule;
 * the only pair that reaches the square/anchor fallbacks is 7 x 7. */
const MUL_RULES = [
  [1, (n) => `Anything times 1 is itself — so it is just ${n}.`],
  [10, (n) => `Times 10: put a zero on the end. ${n} → ${n * 10}.`],
  [2, (n) => `Double it: ${n} + ${n} = ${n * 2}.`],
  [5, (n) => `Half of ten times. 10 × ${n} = ${n * 10}, half of that is ${n * 5}.`],
  [9, (n) => `One less than ten times. 10 × ${n} = ${n * 10}, take away one ${n} → ${n * 9}.`],
  [11, (n) => (n <= 9
    ? `Elevens under ten just repeat the digit: ${n}${n}.`
    : `11 × ${n} = 10 × ${n} plus one more ${n}: ${n * 10} + ${n} = ${n * 11}.`)],
  [4, (n) => `Double twice: ${n} → ${n * 2} → ${n * 4}.`],
  [3, (n) => `Double it and add one more: ${n * 2} + ${n} = ${n * 3}.`],
  [6, (n) => `Five times plus one more: ${n * 5} + ${n} = ${n * 6}.`],
  [8, (n) => `Double three times: ${n} → ${n * 2} → ${n * 4} → ${n * 8}.`],
  [12, (n) => `Ten times plus two times: ${n * 10} + ${n * 2} = ${n * 12}.`],
];

function mulStrategy(a, b) {
  for (const [m, say] of MUL_RULES) {
    if (a === m) return say(b);
    if (b === m) return say(a);
  }
  if (a === b) return `${a} × ${a} = ${a * a}. Squares are worth just knowing.`;
  // Unreachable for 1-12 (only 7 has no rule, and 7 × 7 is a square), but a
  // near-square anchor is the right fallback if MAX ever grows.
  const lo = Math.min(a, b);
  return `Start from ${lo} × ${lo} = ${lo * lo} and add ${Math.abs(a - b)} more ${lo}${Math.abs(a - b) === 1 ? '' : 's'} → ${a * b}.`;
}

function strategyFor(q) {
  if (q.kind === 'div') {
    const other = q.answer;
    return `Turn it round: what times ${q.divisor} makes ${q.product}? ${q.divisor} × ${other} = ${q.product}, so the answer is ${other}.`;
  }
  return mulStrategy(q.a, q.b);
}

/* One round: mostly facts she is working on, at most NEW_PER_ROUND new ones,
 * and any fluent facts that are due back.
 *
 * Padding order matters. When the round comes up short, it fills with facts she
 * ALREADY knows — reviewing a fluent fact a little early is harmless, whereas
 * introducing a pile of new ones is the failure mode incremental rehearsal
 * exists to prevent. New facts are only allowed to fill a round when she has
 * essentially no known base yet, i.e. the very first sessions.
 *
 * Multiplication and division are drawn from one pool rather than alternated,
 * so a round mixes the two by whatever she actually needs. That is the
 * interleaving that matters: she has to read the sign before answering. */
function buildRound(facts, mode) {
  const today = todayISO();
  const pool = eligibleFacts(facts, mode);
  const by = { needswork: [], learning: [], untried: [], due: [], fluent: [] };
  pool.forEach((f) => {
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
  const knownBase = pool.length - by.untried.length;
  if (room() > 0) {
    const cap = knownBase >= 6 ? NEW_PER_ROUND : room();
    [...by.untried]
      .sort((x, y) => x.weight - y.weight)
      .slice(0, Math.min(cap, room()))
      .forEach((f) => picked.push(f));
  }

  // Pad from what she knows before reaching for more new material.
  if (room() > 0) {
    const rest = [...by.fluent, ...by.learning, ...by.needswork].filter((f) => !picked.includes(f));
    take(rest, room());
  }
  if (picked.length === 0) take(pool, ROUND);

  return shuffle(picked).slice(0, ROUND).map(flipMaybe);
}

/* Show either order for multiplication, so the pair gets noticed rather than
 * memorised one way round. Division has no order to flip. */
function flipMaybe(f) {
  if (f.kind === 'mul' && Math.random() < 0.5) return { ...f, a: f.b, b: f.a };
  return { ...f };
}

/* The Mad Minute does not adapt — the paper sheet does not either. It draws
 * uniformly from whatever is in play for the current mode. */
function randomProblem(facts, mode) {
  const pool = eligibleFacts(facts, mode);
  return flipMaybe(pool[Math.floor(Math.random() * pool.length)]);
}

const questionText = (q) => (q.kind === 'mul' ? `${q.a} × ${q.b}` : `${q.product} ÷ ${q.divisor}`);
const fullLine = (q) => `${questionText(q)} = ${q.answer}`;

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

function ProblemCard({ q, value, flash }) {
  const ring =
    flash === 'right' ? 'ring-4 ring-green-500' : flash === 'wrong' ? 'ring-4 ring-amber-600' : 'ring-1 ring-slate-200';
  return (
    <div className={`rounded-2xl bg-white p-4 text-center shadow-lg sm:p-6 ${ring}`}>
      {/* Fixed height, because the answer span's underline adds 4px to the line
        * box the moment it holds a digit rather than a space — which nudged the
        * whole keypad down mid-question. */}
      <div className="flex h-[52px] items-center justify-center sm:h-[64px]">
        <p className="font-mono text-4xl font-bold tabular-nums text-slate-800 sm:text-5xl">
          {questionText(q)} ={' '}
          <span className="inline-block min-w-[2.2ch] border-b-4 border-sky-600 text-sky-700">
            {value || ' '}
          </span>
        </p>
      </div>
    </div>
  );
}

/* Only offered once some division is actually unlocked — before that "÷ only"
 * would hand her an empty round. */
function ModePicker({ mode, onPick }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onPick(m.id)}
          aria-pressed={mode === m.id}
          className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold transition ${
            mode === m.id
              ? 'bg-sky-700 text-white shadow ring-2 ring-sky-800'
              : 'bg-white text-slate-700 shadow-sm hover:bg-sky-50'
          }`}
        >
          {m.label}
          <span className={`ml-1.5 font-normal ${mode === m.id ? 'text-sky-100' : 'text-slate-500'}`}>
            {m.hint}
          </span>
        </button>
      ))}
    </div>
  );
}

/* Feedback and the strategy hint share one slot of FIXED height. Reserving the
 * space matters more than saving it: the keypad must not move between questions
 * — her thumb is already where Next was — and a hint that pushed the keypad down
 * shifted the layout AND dropped Next below the fold on a 768px-tall iPad. */
function Feedback({ q, flash, hint }) {
  return (
    <div aria-live="polite" className="mx-auto flex h-[70px] max-w-md flex-col justify-center gap-1 overflow-hidden text-center">
      {flash === 'right' && !hint && <p className="font-semibold text-green-700">Yes! ✓</p>}
      {flash === 'right' && hint && <p className="font-semibold text-sky-700">Right — now for the speed.</p>}
      {flash === 'wrong' && <p className="font-semibold text-amber-800">{fullLine(q)}</p>}
      {hint && (
        <p className="text-sm leading-snug text-sky-900">
          <span className="font-bold">Try this: </span>
          {hint}
        </p>
      )}
    </div>
  );
}

/* Module scope, not inside the component: a component defined in a render body
 * is a new type every render, which remounts its whole subtree. */
function Tiles({ of, keys }) {
  return (
    <div className={`grid gap-2 ${keys.length === 5 ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {keys.map((k) => (
        <div key={k} className="rounded-xl bg-white p-3 text-center shadow">
          <p className="text-2xl font-bold tabular-nums text-slate-800">{of[k]}</p>
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${LEVELS[k].dot}`} aria-hidden="true" />
            {LEVELS[k].label}
          </p>
        </div>
      ))}
    </div>
  );
}

function Legend({ keys }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
      {keys.map((k) => (
        <span key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className={`inline-block h-3 w-3 rounded ${LEVELS[k].dot}`} aria-hidden="true" />
          {LEVELS[k].label}
        </span>
      ))}
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
  const [hint, setHint] = useState(null);
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
    const mul = { fluent: 0, learning: 0, needswork: 0, untried: 0 };
    const div = { fluent: 0, learning: 0, needswork: 0, untried: 0, locked: 0 };
    MUL_FACTS.forEach((f) => { mul[levelOf(state.facts[f.id])] += 1; });
    DIV_FACTS.forEach((f) => {
      if (!divReady(state.facts, f)) div.locked += 1;
      else div[levelOf(state.facts[f.id])] += 1;
    });
    return { mul, div };
  }, [state.facts]);

  const divOpen = counts.div.locked < DIV_FACTS.length;
  const mode = divOpen ? state.mode : 'mul';
  const setMode = (m) => setState((s) => ({ ...s, mode: m }));

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
    setQueue(buildRound(state.facts, mode));
    setQAt(0);
    setEntry('');
    setFlash(null);
    setHint(null);
    setRoundLog([]);
    setPhase('run');
    shownAt.current = Date.now();
  };

  /* Pause length is set by what there is to read: a miss carries a hint and a
   * correct answer, a slow-but-right carries a hint, a fast one carries a tick. */
  const submitPractice = useCallback(() => {
    if (flash || entry === '') return;
    const q = queue[qAt];
    if (!q) return;
    const ms = Date.now() - shownAt.current;
    const right = Number(entry) === q.answer;
    const slow = right && ms > FLUENT_MS;
    record(q.id, right, ms);
    /* `given`, not `answer`: the spread carries the fact's own correct answer
     * and naming the typed value `answer` would overwrite it — which is what
     * fullLine() and strategyFor() read back on the round-done screen. */
    setRoundLog((l) => [...l, { ...q, given: entry, right, slow, ms }]);
    setFlash(right ? 'right' : 'wrong');
    setHint(right && !slow ? null : strategyFor(q));
    setTimeout(
      () => {
        setFlash(null);
        setHint(null);
        setEntry('');
        if (qAt + 1 >= queue.length) setPhase('done');
        else { setQAt((i) => i + 1); shownAt.current = Date.now(); }
      },
      right ? (slow ? 2000 : 450) : 3200,
    );
  }, [flash, entry, queue, qAt, record]);

  // ---------- mad minute ----------
  const startMad = () => {
    setMadLog([]);
    setMadLeft(MAD_SECONDS);
    setMadProblem(randomProblem(state.facts, mode));
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
    const right = Number(entry) === madProblem.answer;
    record(madProblem.id, right, ms);
    setMadLog((l) => [...l, { ...madProblem, given: entry, right }]);
    setEntry('');
    setMadProblem(randomProblem(state.facts, mode));
    shownAt.current = Date.now();
  }, [entry, madProblem, record, state.facts, mode]);

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
      const ready =
        counts.mul.needswork + counts.mul.learning + counts.mul.untried +
        counts.div.needswork + counts.div.learning + counts.div.untried;
      return (
        <div className="space-y-5 text-center">
          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-2xl font-bold text-sky-800">
              {counts.mul.fluent} of {MUL_FACTS.length} × facts fluent
            </p>
            {divOpen && (
              <p className="mt-1 font-semibold text-slate-600">
                {counts.div.fluent} of {DIV_FACTS.length - counts.div.locked} ÷ facts unlocked and fluent
              </p>
            )}
            <p className="mx-auto mt-2 max-w-md text-slate-600">
              A round is {ROUND} problems, mostly ones you are working on. Try to
              just <em>know</em> it rather than count it up — that is what makes it stick.
            </p>
            {divOpen && (
              <div className="mt-4">
                <ModePicker mode={mode} onPick={setMode} />
              </div>
            )}
            <button
              onClick={startRound}
              disabled={ready === 0 && counts.mul.fluent === 0}
              className="mt-5 min-h-[56px] w-full max-w-xs rounded-xl bg-sky-600 px-8 text-lg font-bold text-white shadow-lg hover:bg-sky-700 disabled:bg-slate-400"
            >
              ▶︎ Start a round
            </button>
          </div>
          {!divOpen && (
            <p className="mx-auto max-w-md text-sm text-slate-500">
              Division unlocks one fact at a time: get a times fact fast and right,
              and both of its division facts join the rounds.
            </p>
          )}
        </div>
      );
    }

    if (phase === 'done') {
      const right = roundLog.filter((x) => x.right).length;
      const review = roundLog.filter((x) => !x.right || x.slow);
      return (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 text-center shadow">
            <p className="text-3xl font-bold text-sky-800">
              {right} / {roundLog.length} right
            </p>
            {review.length > 0 ? (
              <>
                <p className="mt-3 text-slate-600">
                  Worth another look — missed, or worked out rather than known:
                </p>
                <ul className="mx-auto mt-3 max-w-lg space-y-2 text-left">
                  {review.map((m, i) => (
                    <li key={i} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                      <p className="font-mono font-bold text-slate-900">
                        {fullLine(m)}
                        {!m.right && <span className="ml-2 font-sans text-xs font-semibold text-amber-800">you put {m.given}</span>}
                        {m.right && m.slow && <span className="ml-2 font-sans text-xs font-semibold text-sky-700">right, but slow</span>}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{strategyFor(m)}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 font-semibold text-green-700">Perfect round, all of them fast. 🎉</p>
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
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-sky-100">
            <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${(qAt / queue.length) * 100}%` }} />
          </div>
          <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-sky-800">
            {qAt + 1} / {queue.length}
          </span>
        </div>

        <ProblemCard q={q} value={entry} flash={flash} />

        <Feedback q={q} flash={flash} hint={hint} />

        {renderInput('Next →')}
      </div>
    );
  };

  // ---------- mad minute ----------
  const renderMad = () => {
    if (madPhase === 'start') {
      const best = state.mad.reduce((m, r) => Math.max(m, r.score), 0);
      return (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 text-center shadow">
            <p className="text-2xl font-bold text-sky-800">One minute. How many can you get?</p>
            <p className="mx-auto mt-2 max-w-md text-slate-600">
              Just like the sheet at school: no hints until time is up. Skip nothing —
              a wrong answer still moves you on.
            </p>
            {divOpen && (
              <>
                <div className="mt-4">
                  <ModePicker mode={mode} onPick={setMode} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {mode === 'mul'
                    ? 'This minute is multiplication only.'
                    : mode === 'div'
                      ? 'This minute is division only.'
                      : 'This minute mixes × and ÷ — read the sign before you answer.'}
                </p>
              </>
            )}
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
                      {fullLine(m)}
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
        {madProblem && <ProblemCard q={madProblem} value={entry} flash={null} />}
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
      <div>
        <h3 className="mb-2 font-bold text-slate-800">Multiplication</h3>
        <Tiles of={counts.mul} keys={['fluent', 'learning', 'needswork', 'untried']} />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <h3 className="mb-1 font-bold text-slate-800">Every × fact, 1 to 12</h3>
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
                    const lvl = levelOf(state.facts[mulId(r + 1, c + 1)]);
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
        <Legend keys={['fluent', 'learning', 'needswork', 'untried']} />
      </div>

      <div>
        <h3 className="mb-2 font-bold text-slate-800">Division</h3>
        <Tiles of={counts.div} keys={['fluent', 'learning', 'needswork', 'untried', 'locked']} />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <h3 className="mb-1 font-bold text-slate-800">Every ÷ fact, 1 to 12</h3>
        <p className="mb-3 text-sm text-slate-600">
          Row is what you divide <em>by</em>, column is the answer, and the square shows the number
          you start from. This one is <em>not</em> symmetric — 56 ÷ 7 and 56 ÷ 8 are two different
          facts. A faint dot means the times fact is not fast yet, so it has not unlocked.
        </p>
        <div className="overflow-x-auto">
          <table className="mx-auto border-separate" style={{ borderSpacing: 2 }}>
            <caption className="sr-only">Division facts 1 to 12 by mastery</caption>
            <thead>
              <tr>
                <th className="w-7 text-[10px] text-slate-400">÷</th>
                {Array.from({ length: MAX }, (_, i) => (
                  <th key={i} className="w-7 font-mono text-[10px] font-bold text-slate-500">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: MAX }, (_, r) => {
                const divisor = r + 1;
                return (
                  <tr key={r}>
                    <th className="w-7 font-mono text-[10px] font-bold text-slate-500">{divisor}</th>
                    {Array.from({ length: MAX }, (_, c) => {
                      const quotient = c + 1;
                      const product = divisor * quotient;
                      const ready = levelOf(state.facts[mulId(divisor, quotient)]) === 'fluent';
                      const lvl = ready ? levelOf(state.facts[divId(product, divisor)]) : 'locked';
                      return (
                        <td key={c}>
                          <span
                            title={
                              ready
                                ? `${product} ÷ ${divisor} = ${quotient} — ${LEVELS[lvl].label}, ${LEVELS[lvl].note}`
                                : `${product} ÷ ${divisor} — locked until ${divisor} × ${quotient} is fluent`
                            }
                            className={`flex h-7 w-7 items-center justify-center rounded font-mono text-[10px] font-bold tabular-nums ${LEVELS[lvl].cell}`}
                          >
                            {ready ? product : '·'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Legend keys={['fluent', 'learning', 'needswork', 'untried', 'locked']} />
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
  /* Each line carries its fact family, because that is the whole argument for
   * adding division: one known product hands you both division facts free. */
  const renderTables = () => (
    <div className="space-y-4">
      <p className="text-slate-600">
        The whole set, for looking over before a round. Green means you already have it fast.
        Each line shows its division facts too — if you know 8 × 5 = 40, you already know 40 ÷ 5.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: MAX }, (_, i) => i + 1).map((n) => (
          <div key={n} className="rounded-xl bg-white p-4 shadow">
            <h3 className="mb-2 font-bold text-sky-800">{n}× table</h3>
            <ul className="space-y-1 font-mono text-sm tabular-nums">
              {Array.from({ length: MAX }, (_, j) => j + 1).map((m) => {
                const lvl = levelOf(state.facts[mulId(n, m)]);
                return (
                  <li key={m} className="flex items-start gap-2">
                    <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${LEVELS[lvl].dot}`} aria-hidden="true" />
                    <span>
                      <span className="text-slate-700">
                        {n} × {m} = <strong className="text-slate-900">{n * m}</strong>
                      </span>
                      <span className="block text-xs text-slate-400">
                        {n * m} ÷ {n} = {m}
                        {n !== m && <> · {n * m} ÷ {m} = {n}</>}
                      </span>
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
        <h2 className="text-lg text-gray-600">Multiplication &amp; division, 1 to 12</h2>
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
