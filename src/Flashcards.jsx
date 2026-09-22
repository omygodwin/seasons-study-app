import { useCallback, useEffect, useMemo, useState } from 'react';

/* Spaced-repetition note cards.
 *
 * Built around the two study techniques with the strongest evidence behind
 * them — Dunlosky et al. (2013) rate both "high utility":
 *
 *   Retrieval practice. The answer stays hidden until she asks for it, so a
 *   card is an attempt to remember rather than something to re-read. Reading a
 *   term next to its definition feels like learning but mostly builds
 *   familiarity, which is why the browsable term/definition list belongs on
 *   its own tab and never under the cards.
 *
 *   Distributed practice. A Leitner box schedule: a card she knows moves up a
 *   box and comes back later (1 → 3 → 7 → 16 days), a card she misses drops to
 *   box 1 and returns inside the same round. Spacing only does anything if the
 *   schedule outlives the sitting, so boxes and due dates persist to
 *   localStorage.
 *
 * A round is also capped, so a sitting is a finishable chunk instead of an
 * endless deck.
 *
 * Rounds are BLOCKED by deck by default, and mixing is opt-in. An earlier
 * version defaulted to mixing every deck together on the strength of
 * interleaving being a "moderate utility" technique in that 2013 review. The
 * moderators undercut that for this material: Brunmair & Richter (2019) put
 * interleaving at g = 0.42 overall but estimate a NEGATIVE effect for verbal
 * material, against g = 0.67 for visual categories, and Hwang (2025) finds
 * blocked practice first matters for new declarative knowledge in younger
 * learners. Term-and-definition cards are exactly the weak case, so mixing is
 * offered as something to turn on once a deck is familiar rather than as the
 * default.
 *
 * Self-grading is the known weak spot: children systematically over-rate their
 * own recall. Two things push back on that — the middle "Almost" grade gives
 * the half-known card somewhere honest to go, and nothing leaves the round
 * until it is graded "Knew it".
 *
 * A card graded "Almost" or "Study Again" then asks her to put the answer in
 * her own words. That is the generation effect plus self-explanation (g ≈ 0.55,
 * Bisra et al. 2018), layered onto the retrieval she has just attempted. It is
 * deliberately NOT offered for a card she knew: writing out all fifty would be
 * the opportunity-cost trap the flashcard-creation research warns about, where
 * time goes into making cards instead of retrieving from them. Her wording is
 * kept and shown beneath the real definition next time — never on the question
 * face, which would give the answer away.
 *
 * Each study topic keeps its own palette, so themes are named presets below
 * rather than colour props: Tailwind's JIT only sees class names it can find
 * as literal text, so `bg-${color}-800` would be purged. To add a topic, add a
 * preset — don't build class names from fragments at the call site. */

const THEMES = {
  teal: {
    deckOn: 'bg-teal-800 text-white shadow-md',
    deckOff: 'bg-white text-teal-900 shadow hover:bg-teal-50',
    pillOff: 'bg-teal-100 text-teal-900',
    heading: 'text-teal-900',
    front: 'text-teal-900',
    back: 'bg-teal-800',
    track: 'bg-teal-100',
    fill: 'bg-teal-600',
    primary: 'bg-teal-700 hover:bg-teal-800',
    ghost: 'bg-white text-teal-800 shadow hover:bg-teal-50',
  },
  purple: {
    deckOn: 'bg-purple-800 text-white shadow-md',
    deckOff: 'bg-white text-purple-900 shadow hover:bg-purple-50',
    pillOff: 'bg-purple-100 text-purple-900',
    heading: 'text-purple-900',
    front: 'text-purple-900',
    back: 'bg-purple-800',
    track: 'bg-purple-100',
    fill: 'bg-purple-600',
    primary: 'bg-purple-700 hover:bg-purple-800',
    ghost: 'bg-white text-purple-800 shadow hover:bg-purple-50',
  },
  rose: {
    deckOn: 'bg-rose-800 text-white shadow-md',
    deckOff: 'bg-white text-rose-900 shadow hover:bg-rose-50',
    pillOff: 'bg-rose-100 text-rose-900',
    heading: 'text-rose-900',
    front: 'text-rose-900',
    back: 'bg-rose-800',
    track: 'bg-rose-100',
    fill: 'bg-rose-600',
    primary: 'bg-rose-700 hover:bg-rose-800',
    ghost: 'bg-white text-rose-800 shadow hover:bg-rose-50',
  },
  amber: {
    deckOn: 'bg-amber-800 text-white shadow-md',
    deckOff: 'bg-white text-amber-900 shadow hover:bg-amber-50',
    pillOff: 'bg-amber-100 text-amber-900',
    heading: 'text-amber-900',
    front: 'text-amber-900',
    back: 'bg-amber-800',
    track: 'bg-amber-100',
    fill: 'bg-amber-600',
    primary: 'bg-amber-700 hover:bg-amber-800',
    ghost: 'bg-white text-amber-800 shadow hover:bg-amber-50',
  },
  stone: {
    deckOn: 'bg-stone-800 text-white shadow-md',
    deckOff: 'bg-white text-stone-900 shadow hover:bg-stone-50',
    pillOff: 'bg-stone-200 text-stone-900',
    heading: 'text-stone-900',
    front: 'text-stone-900',
    back: 'bg-stone-800',
    track: 'bg-stone-200',
    fill: 'bg-stone-600',
    primary: 'bg-stone-700 hover:bg-stone-800',
    ghost: 'bg-white text-stone-800 shadow hover:bg-stone-50',
  },
  sky: {
    deckOn: 'bg-sky-800 text-white shadow-md',
    deckOff: 'bg-white text-sky-900 shadow hover:bg-sky-50',
    pillOff: 'bg-sky-100 text-sky-900',
    heading: 'text-sky-900',
    front: 'text-sky-900',
    back: 'bg-sky-800',
    track: 'bg-sky-100',
    fill: 'bg-sky-600',
    primary: 'bg-sky-700 hover:bg-sky-800',
    ghost: 'bg-white text-sky-800 shadow hover:bg-sky-50',
  },
};

const BOX_DAYS = [0, 1, 3, 7, 16];
const MAX_BOX = BOX_DAYS.length - 1;
const ROUND_SIZE = 12;
const STATE_VERSION = 1;

const MIXED = '__mixed';

function shuffle(array) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* Day-granularity scheduling in the user's own timezone: she studies about
 * once a day, and an ISO date string compares correctly and survives a reload
 * without any timezone drift. */
function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0); // midday, so a DST shift can't roll the date over
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const todayISO = () => isoDaysFromNow(0);

function loadState(key) {
  const empty = { v: STATE_VERSION, deck: null, direction: 'term', cards: {} };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.v !== STATE_VERSION) return empty;
    return { ...empty, ...parsed, cards: parsed.cards && typeof parsed.cards === 'object' ? parsed.cards : {} };
  } catch {
    return empty; /* private mode / storage disabled / corrupt value */
  }
}

export default function Flashcards({ decks, storageKey, theme = 'teal' }) {
  const t = THEMES[theme] ?? THEMES.teal;
  const [state, setState] = useState(() => loadState(storageKey));
  const [queue, setQueue] = useState([]);
  const [roundTotal, setRoundTotal] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState('start'); // 'start' | 'study' | 'done'
  const [tally, setTally] = useState({ knew: 0, almost: 0, again: 0 });
  const [confirmReset, setConfirmReset] = useState(false);
  // { id, text } while she is writing a missed card up in her own words
  const [composing, setComposing] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* private mode / storage disabled — the session still works, it just
         won't be scheduled across days */
    }
  }, [state, storageKey]);

  const allCards = useMemo(() => {
    const list = [];
    decks.forEach((deck) =>
      deck.cards.forEach((card) =>
        list.push({
          id: `${deck.id}::${card.term}`,
          deckId: deck.id,
          deckLabel: deck.label,
          deckEmoji: deck.emoji,
          term: card.term,
          definition: card.definition,
          note: card.note,
        }),
      ),
    );
    return list;
  }, [decks]);

  const byId = useMemo(() => new Map(allCards.map((c) => [c.id, c])), [allCards]);

  /* The deck actually in play. Nothing saved yet means the first deck, not
   * MIXED — see the note at the top about why blocked is the default. A saved
   * id can also go stale if a deck is renamed, so an id that matches nothing
   * falls back rather than producing an empty round. */
  const deckId = useMemo(() => {
    if (state.deck === MIXED) return MIXED;
    if (state.deck && allCards.some((c) => c.deckId === state.deck)) return state.deck;
    return decks[0]?.id ?? MIXED;
  }, [state.deck, allCards, decks]);

  const pool = useMemo(
    () => (deckId === MIXED ? allCards : allCards.filter((c) => c.deckId === deckId)),
    [allCards, deckId],
  );

  const today = todayISO();

  // Progress for the deck picker and the start screen.
  const stats = useMemo(() => {
    let fresh = 0;
    let learning = 0;
    let strong = 0;
    let due = 0;
    pool.forEach((card) => {
      const st = state.cards[card.id];
      if (!st) {
        fresh++;
        due++;
        return;
      }
      if (st.box >= 3) strong++;
      else learning++;
      if (st.due <= today) due++;
    });
    return { fresh, learning, strong, due, total: pool.length };
  }, [pool, state.cards, today]);

  const deckDue = useCallback(
    (id) => {
      const cards = id === MIXED ? allCards : allCards.filter((c) => c.deckId === id);
      return cards.filter((c) => {
        const st = state.cards[c.id];
        return !st || st.due <= today;
      }).length;
    },
    [allCards, state.cards, today],
  );

  const startRound = useCallback(() => {
    const scored = pool.map((card) => ({ card, due: state.cards[card.id]?.due ?? today }));
    const dueNow = scored.filter((s) => s.due <= today);
    // Nothing due yet is a good thing, so an early round pulls whatever is
    // closest to due rather than refusing to start.
    const chosen = dueNow.length
      ? shuffle(dueNow)
      : shuffle([...scored].sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0)).slice(0, ROUND_SIZE));
    const ids = chosen.slice(0, ROUND_SIZE).map((s) => s.card.id);
    setQueue(ids);
    setRoundTotal(ids.length);
    setTally({ knew: 0, almost: 0, again: 0 });
    setFlipped(false);
    setRevealed(false);
    setPhase(ids.length ? 'study' : 'start');
  }, [pool, state.cards, today]);

  const flip = useCallback(() => {
    setFlipped((f) => !f);
    setRevealed(true);
  }, []);

  /* Move past the current card. `retire` drops it from the round; otherwise it
   * goes to the back, so every card in a round ends on a successful recall. */
  const advance = useCallback(
    (id, retire) => {
      const remaining = retire ? queue.slice(1) : [...queue.slice(1), id];
      setQueue(remaining);
      setFlipped(false);
      setRevealed(false);
      if (remaining.length === 0) setPhase('done');
    },
    [queue],
  );

  const grade = useCallback(
    (result) => {
      const id = queue[0];
      if (!id) return;
      const prev = state.cards[id] ?? { box: 0, seen: 0, right: 0 };
      let next;
      if (result === 'again') {
        next = { box: 0, due: today, seen: prev.seen + 1, right: prev.right };
      } else if (result === 'almost') {
        next = { box: prev.box, due: isoDaysFromNow(1), seen: prev.seen + 1, right: prev.right };
      } else {
        const box = Math.min(MAX_BOX, prev.box + 1);
        next = { box, due: isoDaysFromNow(BOX_DAYS[box]), seen: prev.seen + 1, right: prev.right + 1 };
      }

      // Her own wording survives a regrade — it is hers, not part of the schedule.
      setState((s) => ({ ...s, cards: { ...s.cards, [id]: { ...next, own: prev.own } } }));
      setTally((t) => ({ ...t, [result]: t[result] + 1 }));

      if (result === 'knew') {
        advance(id, true);
      } else {
        // A missed card gets the own-words prompt before the round moves on.
        setComposing({ id, text: prev.own ?? '' });
      }
    },
    [queue, state.cards, today, advance],
  );

  const finishComposing = useCallback(
    (save) => {
      if (!composing) return;
      const { id, text } = composing;
      const trimmed = text.trim();
      if (save && trimmed) {
        setState((s) => ({
          ...s,
          cards: { ...s.cards, [id]: { ...s.cards[id], own: trimmed } },
        }));
      }
      setComposing(null);
      advance(id, false);
    },
    [composing, advance],
  );

  // Physical keyboard (iPad Magic Keyboard / laptop): space flips, 1-2-3 grade.
  useEffect(() => {
    if (phase !== 'study' || composing) return undefined;
    function onKey(e) {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flip();
      } else if (revealed && (e.key === '1' || e.key === '2' || e.key === '3')) {
        e.preventDefault();
        grade({ 1: 'again', 2: 'almost', 3: 'knew' }[e.key]);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase, revealed, composing, flip, grade]);

  const setDeck = (deck) => {
    setState((s) => ({ ...s, deck }));
    setPhase('start');
    setQueue([]);
  };

  const toggleDirection = () =>
    setState((s) => ({ ...s, direction: s.direction === 'term' ? 'definition' : 'term' }));

  /* Reset clears the schedule, not her writing: the boxes are the app's state
   * but the own-words notes are hers, and losing them to a stray tap on a
   * button a nine-year-old is curious about would be the wrong trade. */
  const resetProgress = () => {
    setState((s) => {
      const kept = {};
      Object.entries(s.cards).forEach(([id, st]) => {
        if (st.own) kept[id] = { box: 0, due: todayISO(), seen: 0, right: 0, own: st.own };
      });
      return { ...s, cards: kept };
    });
    setConfirmReset(false);
    setPhase('start');
    setQueue([]);
  };

  const card = byId.get(queue[0]);
  const ownWords = card ? state.cards[card.id]?.own : null;
  const askTerm = state.direction === 'term';
  const front = card ? (askTerm ? card.term : card.definition) : '';
  const back = card ? (askTerm ? card.definition : card.term) : '';
  const done = roundTotal - queue.length;

  const multiDeck = decks.length > 1;
  const deckOptions = multiDeck ? [...decks, { id: MIXED, label: 'Mix It Up', emoji: '🎲' }] : [];

  // --- deck picker, shown above every phase so she can switch at any time ---

  const renderPicker = () => (
    <div className="space-y-3">
      {multiDeck && (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {deckOptions.map((option) => {
          const selected = deckId === option.id;
          const due = deckDue(option.id);
          return (
            <button
              key={option.id}
              onClick={() => setDeck(option.id)}
              aria-pressed={selected}
              className={`flex min-h-[56px] items-center justify-between gap-2 rounded-xl px-4 py-3 text-left font-semibold transition ${
                selected
                  ? t.deckOn
                  : t.deckOff
              }`}
            >
              <span className="truncate">
                <span aria-hidden="true">{option.emoji}</span> {option.label}
              </span>
              {due > 0 && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                    selected ? 'bg-white/25 text-white' : t.pillOff
                  }`}
                >
                  {due} due
                </span>
              )}
            </button>
          );
        })}
      </div>
      )}

      {multiDeck && (
        <p className="text-center text-xs text-slate-500">
          One topic at a time while it is new. Mix It Up once a topic is mostly
          &ldquo;Strong&rdquo; — mixing too early makes new material harder, not stickier.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={toggleDirection}
          className="min-h-[44px] rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {askTerm ? '🔄 Asking: word → meaning' : '🔄 Asking: meaning → word'}
        </button>
      </div>
    </div>
  );

  // --- start screen ---

  const renderStart = () => (
    <div className="space-y-6">
      {renderPicker()}

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white p-3 shadow">
          <p className="text-2xl font-bold text-slate-700">{stats.fresh}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">New</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow">
          <p className="text-2xl font-bold text-amber-600">{stats.learning}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Learning</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow">
          <p className="text-2xl font-bold text-green-600">{stats.strong}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Strong</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 text-center shadow">
        {stats.due > 0 ? (
          <>
            <p className={`text-xl font-bold ${t.heading}`}>
              {Math.min(stats.due, ROUND_SIZE)} card{Math.min(stats.due, ROUND_SIZE) === 1 ? '' : 's'} ready
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Try to answer out loud <em>before</em> you flip — the trying is what makes it stick.
            </p>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-green-700">✅ All caught up!</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Nothing is due yet — resting between rounds is what makes it stick. You can still
              run an early round any time.
            </p>
          </>
        )}
        <button
          onClick={startRound}
          disabled={stats.total === 0}
          className={`mt-4 min-h-[56px] w-full max-w-xs rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg disabled:bg-gray-400 sm:w-auto ${t.primary}`}
        >
          {stats.due > 0 ? '▶️ Start Round' : '▶️ Early Round'}
        </button>
      </div>

      <div className="text-center">
        {confirmReset ? (
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-xl bg-red-50 p-3">
            <span className="text-sm text-red-900">
              Start the schedule over? Your own-words notes are kept.
            </span>
            <button
              onClick={resetProgress}
              className="min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Yes, erase
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="min-h-[44px] rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
            >
              Keep it
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="min-h-[44px] rounded-lg px-4 py-2 text-sm text-slate-500 underline hover:text-slate-700"
          >
            Reset card progress
          </button>
        )}
      </div>
    </div>
  );

  // --- study screen ---

  const renderStudy = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`h-3 flex-1 overflow-hidden rounded-full ${t.track}`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${t.fill}`}
            style={{ width: `${roundTotal ? (done / roundTotal) * 100 : 0}%` }}
          />
        </div>
        <p className={`shrink-0 text-sm font-bold ${t.heading}`} aria-live="polite">
          {done} / {roundTotal}
        </p>
      </div>

      {deckId === MIXED && card && (
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          {card.deckEmoji} {card.deckLabel}
        </p>
      )}

      {/* Tap target is the whole card. touch-manipulation removes iOS's
          double-tap-to-zoom delay; select-none stops a long word turning into
          a text selection mid-tap.

          The lg height is deliberately SHORTER than the sm one: width-wise, lg
          is the iPad in landscape, where only ~830px of height is left to fit
          the card and the grade buttons. The vh cap keeps the buttons above the
          fold there, because a card you have to scroll past to answer breaks
          the whole flip-then-grade loop. */}
      <div className="[perspective:1600px]">
        <div
          role="button"
          tabIndex={0}
          aria-label={revealed ? 'Card answer, tap to see the question again' : 'Tap to show the answer'}
          onClick={flip}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              flip();
            }
          }}
          className={`relative h-[19rem] w-full cursor-pointer touch-manipulation select-none transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none sm:h-[24rem] lg:h-[min(22rem,38vh)] ${
            flipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* question */}
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-2xl bg-white p-6 text-center shadow-xl [backface-visibility:hidden] sm:p-10">
            <p
              className={`font-bold ${t.front} ${
                askTerm ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-xl font-medium sm:text-2xl lg:text-3xl'
              }`}
            >
              {front}
            </p>
            {card?.note && askTerm && (
              <p className="mt-2 text-sm italic text-slate-500">{card.note}</p>
            )}
            <p className="mt-6 text-xs uppercase tracking-wide text-slate-400">
              Say it out loud, then tap
            </p>
          </div>

          {/* answer */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-2xl p-6 text-center text-white shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-10 ${t.back}`}>
            <p
              className={`leading-relaxed ${
                askTerm ? 'text-lg sm:text-xl lg:text-2xl' : 'text-3xl font-bold sm:text-4xl lg:text-5xl'
              }`}
            >
              {back}
            </p>
            {ownWords && (
              <p className="mt-5 max-w-prose border-t border-white/25 pt-4 text-sm italic text-white/80 sm:text-base">
                Your words: {ownWords}
              </p>
            )}
          </div>
        </div>
      </div>

      {composing ? (
        <div className="rounded-2xl bg-white p-4 shadow sm:p-6">
          <label htmlFor="own-words" className="block font-bold text-slate-800">
            Now say it in your own words
          </label>
          <p className="mt-1 text-sm text-slate-600">
            Not the book&rsquo;s words — yours. Explaining it yourself is what moves it
            from &ldquo;almost&rdquo; to &ldquo;known&rdquo;.
          </p>
          <textarea
            id="own-words"
            rows={3}
            autoFocus
            value={composing.text}
            onChange={(e) => setComposing((c) => ({ ...c, text: e.target.value }))}
            placeholder="In my own words..."
            className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-base"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => finishComposing(true)}
              disabled={!composing.text.trim()}
              className={`min-h-[52px] flex-1 rounded-xl px-5 py-3 font-bold text-white shadow disabled:bg-gray-400 ${t.primary}`}
            >
              Save &amp; Keep Going
            </button>
            <button
              onClick={() => finishComposing(false)}
              className="min-h-[52px] rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300"
            >
              Skip
            </button>
          </div>
        </div>
      ) : revealed ? (
        <div>
          <p className="mb-2 text-center text-sm font-semibold text-slate-600">
            How did that go?
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => grade('again')}
              className="min-h-[60px] rounded-xl bg-rose-600 px-2 py-3 text-sm font-bold leading-tight text-white shadow hover:bg-rose-700 sm:px-4 sm:text-base"
            >
              🔁 Study Again
            </button>
            <button
              onClick={() => grade('almost')}
              className="min-h-[60px] rounded-xl bg-amber-500 px-2 py-3 text-sm font-bold leading-tight text-white shadow hover:bg-amber-600 sm:px-4 sm:text-base"
            >
              🤏 Almost
            </button>
            <button
              onClick={() => grade('knew')}
              className="min-h-[60px] rounded-xl bg-green-600 px-2 py-3 text-sm font-bold leading-tight text-white shadow hover:bg-green-700 sm:px-4 sm:text-base"
            >
              ✅ Knew It
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={flip}
          className={`min-h-[56px] w-full rounded-xl px-6 py-4 text-lg font-bold text-white shadow-lg ${t.primary}`}
        >
          Show Answer
        </button>
      )}

      {!composing && (
        <div className="flex justify-center">
          <button
            onClick={() => setPhase('start')}
            className="min-h-[44px] rounded-lg px-4 py-2 text-sm text-slate-500 underline hover:text-slate-700"
          >
            End round
          </button>
        </div>
      )}
    </div>
  );

  // --- round summary ---

  const renderDone = () => {
    const nextDue = pool
      .map((c) => state.cards[c.id]?.due)
      .filter(Boolean)
      .sort()[0];
    const soonest = nextDue && nextDue > today ? nextDue : null;
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          <p className={`text-3xl font-bold ${t.heading}`}>🎉 Round complete!</p>
          <p className="mt-2 text-slate-600">
            You finished all {roundTotal} card{roundTotal === 1 ? '' : 's'}.
          </p>
          <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-green-50 p-3">
              <p className="text-2xl font-bold text-green-700">{tally.knew}</p>
              <p className="text-xs font-semibold text-slate-600">Knew it</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-2xl font-bold text-amber-600">{tally.almost}</p>
              <p className="text-xs font-semibold text-slate-600">Almost</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3">
              <p className="text-2xl font-bold text-rose-600">{tally.again}</p>
              <p className="text-xs font-semibold text-slate-600">Studied again</p>
            </div>
          </div>
          {soonest && (
            <p className="mt-4 text-sm text-slate-600">
              Next cards come back on{' '}
              <span className="font-semibold">
                {new Date(`${soonest}T12:00:00`).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              . Coming back later beats cramming now.
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              onClick={startRound}
              disabled={stats.total === 0}
              className={`min-h-[56px] rounded-xl px-6 py-3 font-bold text-white shadow disabled:bg-gray-400 ${t.primary}`}
            >
              ▶️ Another Round
            </button>
            <button
              onClick={() => setPhase('start')}
              className={`min-h-[56px] rounded-xl px-6 py-3 font-bold ${t.ghost}`}
            >
              Back to Decks
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      {phase === 'start' && renderStart()}
      {phase === 'study' && renderStudy()}
      {phase === 'done' && renderDone()}
    </div>
  );
}
