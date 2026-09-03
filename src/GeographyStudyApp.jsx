import React, { useState, useMemo, useEffect } from 'react';
import {
  US_VIEWBOX,
  WORLD_VIEWBOX,
  US_LAND,
  US_STATE_LINES,
  US_LAKES,
  US_RIVER_PATHS,
  CONTINENT_PATHS,
  US_RIVER_LABELS,
  CONTINENT_LABELS,
  OCEAN_LABELS,
} from './data/mapPaths';

/* ------------------------------------------------------------------ data --
 * Colors match the crayon key on Rose's own worksheets so the app and the
 * paper study guide look like the same thing.
 */
const RIVERS = [
  {
    id: 'missouri',
    name: 'Missouri',
    color: '#dc2626',
    fact: 'The LONGEST river in North America.',
  },
  {
    id: 'mississippi',
    name: 'Mississippi',
    color: '#38bdf8',
    fact: 'The most famous river — and the largest watershed.',
  },
  {
    id: 'ohio',
    name: 'Ohio',
    color: '#a16207',
    fact: 'The Gateway to the West.',
  },
  {
    id: 'stlawrence',
    name: 'St. Lawrence',
    color: '#1d4ed8',
    fact: 'Connects the Great Lakes with the Atlantic Ocean.',
  },
  {
    id: 'columbia',
    name: 'Columbia',
    color: '#f97316',
    fact: 'Flows across the Northwest into the Pacific Ocean.',
  },
  {
    id: 'colorado',
    name: 'Colorado',
    color: '#16a34a',
    fact: 'The river that carved the Grand Canyon.',
  },
  {
    id: 'riogrande',
    name: 'Rio Grande',
    color: '#ec4899',
    fact: 'Forms the border between Texas and Mexico.',
  },
];

const CONTINENTS = [
  { id: 'northamerica', name: 'North America', color: '#3b82f6', fact: 'The continent we live on.' },
  { id: 'southamerica', name: 'South America', color: '#84cc16', fact: 'Home of the Amazon rainforest.' },
  { id: 'europe', name: 'Europe', color: '#a97142', fact: 'Joined to Asia — together they are Eurasia.' },
  { id: 'asia', name: 'Asia', color: '#ef4444', fact: 'The largest continent.' },
  { id: 'africa', name: 'Africa', color: '#f9a8d4', fact: 'Home of the Nile, the longest river on Earth.' },
  { id: 'australia', name: 'Australia', color: '#38bdf8', fact: 'The smallest continent.' },
  { id: 'antarctica', name: 'Antarctica', color: '#bae6fd', fact: 'The frozen continent at the South Pole.' },
];

const OCEANS = [
  { id: 'pacific', name: 'Pacific', color: '#0284c7', fact: 'The biggest ocean — west of the United States.' },
  { id: 'atlantic', name: 'Atlantic', color: '#0369a1', fact: 'Between the Americas and Europe/Africa.' },
  { id: 'indian', name: 'Indian', color: '#0891b2', fact: 'South of Asia, east of Africa.' },
  { id: 'arctic', name: 'Arctic', color: '#38bdf8', fact: 'The frozen ocean at the North Pole.' },
];

/* The fill-in-the-blanks exactly as they appear on the study sheet. */
const RIVER_FACTS = [
  { clue: '______ ______ lived alongside the rivers.', answer: 'Native Americans' },
  { clue: '______ explored via the rivers.', answer: 'Europeans' },
  { clue: '______ River — the longest river.', answer: 'Missouri' },
  { clue: '______ River — the most famous river.', answer: 'Mississippi' },
  { clue: 'The Mississippi River has the largest ______.', answer: 'watershed' },
  { clue: '______ River — the Gateway to the West.', answer: 'Ohio' },
  { clue: 'The Ohio River was the Gateway to the ______.', answer: 'West' },
  { clue: '______ ______ — connects the Great Lakes with the Atlantic.', answer: 'Saint Lawrence' },
  { clue: 'The Saint Lawrence connects the ______ Lakes with the ______.', answer: 'Great / Atlantic' },
];

const QUIZ_POOL = [
  { q: 'Which river is the LONGEST river?', options: ['Missouri', 'Mississippi', 'Ohio', 'Colorado'], correct: 0 },
  { q: 'Which river is the most famous, with the largest watershed?', options: ['Rio Grande', 'Mississippi', 'Columbia', 'St. Lawrence'], correct: 1 },
  { q: 'Which river was the "Gateway to the West"?', options: ['Ohio', 'Colorado', 'Missouri', 'Columbia'], correct: 0 },
  { q: 'Which river connects the Great Lakes with the Atlantic Ocean?', options: ['Ohio', 'Mississippi', 'St. Lawrence', 'Rio Grande'], correct: 2 },
  { q: 'The Mississippi River has the largest ______.', options: ['delta', 'watershed', 'canyon', 'harbor'], correct: 1 },
  { q: 'The Ohio River was the gateway to the ______.', options: ['North', 'South', 'East', 'West'], correct: 3 },
  { q: 'The St. Lawrence connects the Great Lakes with the ______ Ocean.', options: ['Pacific', 'Atlantic', 'Arctic', 'Indian'], correct: 1 },
  { q: 'Who lived alongside the rivers?', options: ['Native Americans', 'Europeans', 'Explorers', 'Settlers'], correct: 0 },
  { q: 'Who explored via the rivers?', options: ['Native Americans', 'Europeans', 'Farmers', 'Miners'], correct: 1 },
  { q: 'How many continents are there?', options: ['5', '6', '7', '8'], correct: 2 },
  { q: 'Which continent do we live on?', options: ['South America', 'North America', 'Europe', 'Asia'], correct: 1 },
  { q: 'Which is the LARGEST continent?', options: ['Africa', 'Asia', 'North America', 'Antarctica'], correct: 1 },
  { q: 'Which is the SMALLEST continent?', options: ['Europe', 'Antarctica', 'Australia', 'South America'], correct: 2 },
  { q: 'Which continent is at the South Pole?', options: ['Antarctica', 'Australia', 'Africa', 'Asia'], correct: 0 },
  { q: 'Which ocean is WEST of the United States?', options: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], correct: 1 },
  { q: 'Which ocean is between North America and Europe?', options: ['Pacific', 'Indian', 'Atlantic', 'Arctic'], correct: 2 },
  { q: 'Which ocean is at the North Pole?', options: ['Arctic', 'Atlantic', 'Indian', 'Pacific'], correct: 0 },
  { q: 'Which ocean is east of Africa and south of Asia?', options: ['Atlantic', 'Arctic', 'Pacific', 'Indian'], correct: 3 },
  { q: 'Which river forms the border between Texas and Mexico?', options: ['Colorado', 'Rio Grande', 'Missouri', 'Ohio'], correct: 1 },
  { q: 'Which river carved the Grand Canyon?', options: ['Colorado', 'Columbia', 'Rio Grande', 'Missouri'], correct: 0 },
];

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* [minX, minY, width, height] - the world viewBox is inset, so label
 * positions have to be measured from its origin, not from 0,0. */
const vb = (s) => s.split(' ').map(Number);
const US_VIEW = vb(US_VIEWBOX);
const WORLD_VIEW = vb(WORLD_VIEWBOX);

/* --------------------------------------------------------------- pieces -- */

function Pill({ x, y, view, children, className = '', style, onClick, title }) {
  const [vx, vy, vw, vh] = view;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={title}
      style={{
        left: `${((x - vx) / vw) * 100}%`,
        top: `${((y - vy) / vh) * 100}%`,
        ...style,
      }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full
        px-2 py-0.5 text-[10px] font-bold leading-tight shadow-sm sm:px-2.5 sm:py-1 sm:text-xs ${className}`}
    >
      {children}
    </Tag>
  );
}

function CrayonChip({ item, state, selected, onClick }) {
  const done = state === 'done';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={done}
      className={`flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold
        transition ${
          done
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 opacity-70'
            : selected
              ? 'scale-105 border-slate-800 bg-white text-slate-900 shadow-lg ring-4 ring-amber-300/60'
              : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-400 active:scale-95'
        }`}
    >
      <span
        className="h-5 w-5 shrink-0 rounded-md border border-black/20"
        style={{ background: item.color }}
      />
      <span>{item.name}</span>
      {done && <span aria-hidden="true">✓</span>}
    </button>
  );
}

function Toolbar({ done, total, onReveal, onReset, revealed, hints, onHints }) {
  const pct = Math.round((done / total) * 100);
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="flex-1 min-w-[140px]">
        <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
          <span>
            {done} of {total} labeled
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-sky-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onHints}
        className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-bold ${
          hints ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {hints ? '💡 Hints on' : '💡 Hints off'}
      </button>
      <button
        type="button"
        onClick={onReveal}
        className="min-h-[44px] rounded-lg bg-slate-700 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800"
      >
        {revealed ? '🙈 Hide' : '👀 Show all'}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="min-h-[44px] rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50"
      >
        ↺ Reset
      </button>
    </div>
  );
}

function Feedback({ message }) {
  if (!message) return null;
  const good = message.tone === 'good';
  return (
    <div
      className={`mb-3 rounded-xl px-4 py-2 text-center text-sm font-bold ${
        good ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
      }`}
    >
      {message.text}
    </div>
  );
}

/* ------------------------------------------------------------- rivers map -- */

function RiverMap({ progress, setProgress }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [hints, setHints] = useState(false);
  const [wrong, setWrong] = useState(null);
  const [message, setMessage] = useState(null);

  const done = RIVERS.filter((r) => progress[r.id]).length;
  const finished = done === RIVERS.length;

  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => setMessage(null), 2600);
    return () => clearTimeout(t);
  }, [message]);

  const handleRiver = (river) => {
    if (progress[river.id]) return;
    if (!selected) {
      if (hints) setMessage({ tone: 'good', text: `That one is the ${river.name} River. Now find its crayon!` });
      else setMessage({ tone: 'bad', text: 'Pick a crayon color first, then tap its river.' });
      return;
    }
    if (selected === river.id) {
      setProgress((p) => ({ ...p, [river.id]: true }));
      setSelected(null);
      setMessage({ tone: 'good', text: `✅ ${river.name} — ${river.fact}` });
    } else {
      const picked = RIVERS.find((r) => r.id === selected);
      setWrong(river.id);
      setTimeout(() => setWrong(null), 600);
      setMessage(
        hints
          ? { tone: 'bad', text: `That's the ${river.name}, not the ${picked.name}. Try again!` }
          : { tone: 'bad', text: 'Not quite — try again!' },
      );
    }
  };

  const shown = (id) => progress[id] || revealed;

  return (
    <div>
      <Toolbar
        done={done}
        total={RIVERS.length}
        revealed={revealed}
        hints={hints}
        onHints={() => setHints((v) => !v)}
        onReveal={() => setRevealed((v) => !v)}
        onReset={() => {
          setProgress({});
          setRevealed(false);
          setSelected(null);
          setMessage(null);
        }}
      />

      <Feedback message={message} />

      {finished && (
        <div className="mb-3 rounded-xl bg-gradient-to-r from-amber-200 to-yellow-100 px-4 py-3 text-center font-bold text-amber-900">
          🎉 All 7 rivers labeled! You know this map.
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-sky-100 ring-1 ring-slate-300">
        <svg viewBox={US_VIEWBOX} className="block w-full" role="img" aria-label="Map of the United States rivers">
          {US_LAND.map((d, i) => (
            <path key={`l${i}`} d={d} fill="#fbfbf9" stroke="#475569" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          {US_STATE_LINES.map((d, i) => (
            <path key={`s${i}`} d={d} fill="none" stroke="#e6eaf0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          {US_LAKES.map((d, i) => (
            <path key={`k${i}`} d={d} fill="#d6ecfb" stroke="#93c5fd" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}

          {RIVERS.map((r) => {
            const d = US_RIVER_PATHS[r.id].join('');
            const on = shown(r.id);
            return (
              <g key={r.id}>
                <path
                  d={d}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  stroke={wrong === r.id ? '#e11d48' : on ? r.color : '#7f93ab'}
                  strokeWidth={on ? 4.5 : 3}
                  className="transition-all duration-300"
                  style={wrong === r.id ? { animation: 'geo-shake .5s' } : undefined}
                />
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="22"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="stroke"
                  className={progress[r.id] ? '' : 'cursor-pointer'}
                  onClick={() => handleRiver(r)}
                />
              </g>
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0">
          {RIVERS.filter((r) => shown(r.id)).map((r) => (
            <Pill
              key={r.id}
              x={US_RIVER_LABELS[r.id].x}
              y={US_RIVER_LABELS[r.id].y}
              view={US_VIEW}
              className="bg-white/95 text-slate-800 ring-1"
              style={{ color: r.color, boxShadow: `0 0 0 2px ${r.color}` }}
            >
              {r.name}
            </Pill>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-sm font-semibold text-slate-600">
        {selected
          ? `Now tap the ${RIVERS.find((r) => r.id === selected).name} River on the map 👆`
          : 'Pick a crayon, then tap its river on the map.'}
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {RIVERS.map((r) => (
          <CrayonChip
            key={r.id}
            item={r}
            state={progress[r.id] ? 'done' : 'todo'}
            selected={selected === r.id}
            onClick={() => setSelected(selected === r.id ? null : r.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- world map -- */

function WorldMap({ progress, setProgress }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [hints, setHints] = useState(false);
  const [wrong, setWrong] = useState(null);
  const [message, setMessage] = useState(null);

  const ALL = [...CONTINENTS, ...OCEANS];
  const done = ALL.filter((x) => progress[x.id]).length;
  const finished = done === ALL.length;

  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => setMessage(null), 2600);
    return () => clearTimeout(t);
  }, [message]);

  const handleTarget = (item, kind) => {
    if (progress[item.id]) return;
    if (!selected) {
      if (hints) setMessage({ tone: 'good', text: `That is ${item.name}${kind === 'ocean' ? ' Ocean' : ''}. Now find its label!` });
      else setMessage({ tone: 'bad', text: 'Pick a label first, then tap the map.' });
      return;
    }
    if (selected === item.id) {
      setProgress((p) => ({ ...p, [item.id]: true }));
      setSelected(null);
      setMessage({ tone: 'good', text: `✅ ${item.name} — ${item.fact}` });
    } else {
      const picked = ALL.find((x) => x.id === selected);
      setWrong(item.id);
      setTimeout(() => setWrong(null), 600);
      setMessage(
        hints
          ? { tone: 'bad', text: `That's ${item.name}, not ${picked.name}. Try again!` }
          : { tone: 'bad', text: 'Not quite — try again!' },
      );
    }
  };

  const shown = (id) => progress[id] || revealed;

  return (
    <div>
      <Toolbar
        done={done}
        total={ALL.length}
        revealed={revealed}
        hints={hints}
        onHints={() => setHints((v) => !v)}
        onReveal={() => setRevealed((v) => !v)}
        onReset={() => {
          setProgress({});
          setRevealed(false);
          setSelected(null);
          setMessage(null);
        }}
      />

      <Feedback message={message} />

      {finished && (
        <div className="mb-3 rounded-xl bg-gradient-to-r from-amber-200 to-yellow-100 px-4 py-3 text-center font-bold text-amber-900">
          🎉 All 7 continents and 4 oceans! Nailed it.
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-sky-100 ring-1 ring-slate-300">
        <svg viewBox={WORLD_VIEWBOX} className="block w-full" role="img" aria-label="World map of continents and oceans">
          {CONTINENTS.map((c) => {
            const on = shown(c.id);
            return (
              <path
                key={c.id}
                d={CONTINENT_PATHS[c.id].join('')}
                fillRule="evenodd"
                fill={wrong === c.id ? '#fda4af' : on ? c.color : '#e8eaee'}
                stroke="#1e293b"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className={`transition-colors duration-300 ${progress[c.id] ? '' : 'cursor-pointer'}`}
                style={wrong === c.id ? { animation: 'geo-shake .5s' } : undefined}
                onClick={() => handleTarget(c, 'continent')}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0">
          {CONTINENTS.filter((c) => shown(c.id)).map((c) => (
            <Pill
              key={c.id}
              x={CONTINENT_LABELS[c.id].x}
              y={CONTINENT_LABELS[c.id].y}
              view={WORLD_VIEW}
              className="bg-white/90 text-slate-900 ring-1 ring-slate-400"
            >
              {c.name}
            </Pill>
          ))}

          {OCEANS.map((o) => {
            const on = shown(o.id);
            return (
              <Pill
                key={o.id}
                x={OCEAN_LABELS[o.id].x}
                y={OCEAN_LABELS[o.id].y}
                view={WORLD_VIEW}
                onClick={() => handleTarget(o, 'ocean')}
                title={on ? o.name : 'Which ocean is this?'}
                style={wrong === o.id ? { animation: 'geo-shake .5s' } : undefined}
                className={`pointer-events-auto min-h-[26px] border-2 ${
                  on
                    ? 'border-sky-600 bg-white text-sky-800'
                    : 'border-dashed border-sky-500/80 bg-white/70 text-sky-600 hover:bg-white'
                }`}
              >
                {on ? o.name : '?'}
              </Pill>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-center text-sm font-semibold text-slate-600">
        {selected
          ? `Now tap ${ALL.find((x) => x.id === selected).name} on the map 👆`
          : 'Pick a label, then tap it on the map. Oceans are the dotted circles.'}
      </p>

      <div className="mt-3">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
          7 Continents
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {CONTINENTS.map((c) => (
            <CrayonChip
              key={c.id}
              item={c}
              state={progress[c.id] ? 'done' : 'todo'}
              selected={selected === c.id}
              onClick={() => setSelected(selected === c.id ? null : c.id)}
            />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
          4 Oceans
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {OCEANS.map((o) => (
            <CrayonChip
              key={o.id}
              item={o}
              state={progress[o.id] ? 'done' : 'todo'}
              selected={selected === o.id}
              onClick={() => setSelected(selected === o.id ? null : o.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ river facts -- */

function RiverFacts() {
  const [order, setOrder] = useState(() => RIVER_FACTS.map((_, i) => i));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [review, setReview] = useState(new Set());
  // Answers stay hidden until asked for - this page is for studying, not reading.
  const [revealedRows, setRevealedRows] = useState(new Set());
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showReference, setShowReference] = useState(false);

  const toggleRow = (i) =>
    setRevealedRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const card = RIVER_FACTS[order[index]];
  const next = () => {
    setIndex((i) => (i + 1) % order.length);
    setFlipped(false);
  };
  const prev = () => {
    setIndex((i) => (i - 1 + order.length) % order.length);
    setFlipped(false);
  };

  const mark = (status) => {
    const key = card.answer;
    if (status === 'known') {
      setKnown((s) => new Set(s).add(key));
      setReview((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    } else {
      setReview((s) => new Set(s).add(key));
      setKnown((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
    setTimeout(next, 180);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center text-sm font-bold">
        <div className="rounded-xl bg-emerald-100 py-2 text-emerald-800">✅ Known {known.size}</div>
        <div className="rounded-xl bg-amber-100 py-2 text-amber-800">🤔 Review {review.size}</div>
        <div className="rounded-xl bg-sky-100 py-2 text-sky-800">
          {index + 1} / {order.length}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200 transition active:scale-[0.99]"
      >
        <p className="text-xl font-semibold leading-relaxed text-slate-800 sm:text-2xl">{card.clue}</p>
        {flipped ? (
          <p className="mt-5 text-3xl font-black text-teal-700 sm:text-4xl">{card.answer}</p>
        ) : (
          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">
            tap to reveal
          </p>
        )}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => mark('review')}
          className="min-h-[44px] rounded-xl bg-amber-500 px-4 py-3 font-bold text-white hover:bg-amber-600"
        >
          🤔 Still learning
        </button>
        <button
          type="button"
          onClick={() => mark('known')}
          className="min-h-[44px] rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700"
        >
          ✅ Got it
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={prev}
          className="min-h-[44px] rounded-lg bg-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-300"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => {
            setOrder(shuffle(RIVER_FACTS.map((_, i) => i)));
            setIndex(0);
            setFlipped(false);
          }}
          className="min-h-[44px] rounded-lg bg-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-300"
        >
          🔀 Shuffle
        </button>
        <button
          type="button"
          onClick={next}
          className="min-h-[44px] rounded-lg bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-900"
        >
          Next →
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-800">📜 The whole sheet</h3>
          <button
            type="button"
            onClick={() => {
              setShowAllAnswers((v) => !v);
              setRevealedRows(new Set());
            }}
            className="min-h-[44px] rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
          >
            {showAllAnswers ? '🙈 Hide answers' : '👀 Show answers'}
          </button>
        </div>
        <ul className="space-y-1 text-sm text-slate-700">
          {RIVER_FACTS.map((f, i) => {
            const open = showAllAnswers || revealedRows.has(i);
            return (
              <li key={f.clue} className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleRow(i)}
                  className="flex min-h-[44px] w-full flex-wrap items-baseline gap-x-2 py-2 text-left"
                >
                  <span>{f.clue.replace(/______/g, '_____')}</span>
                  {open ? (
                    <span className="font-bold text-teal-700">{f.answer}</span>
                  ) : (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                      tap
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <button
          type="button"
          onClick={() => setShowReference((v) => !v)}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 text-left"
        >
          <h3 className="text-lg font-bold text-slate-800">🌊 Know each river</h3>
          <span className="text-sm font-bold text-slate-500">
            {showReference ? 'Hide' : 'Show'}
          </span>
        </button>
        <ul className={`space-y-2 ${showReference ? 'mt-3' : 'hidden'}`}>
          {RIVERS.map((r) => (
            <li key={r.id} className="flex items-center gap-3 border-b border-slate-100 pb-2 text-sm">
              <span
                className="h-4 w-4 shrink-0 rounded border border-black/20"
                style={{ background: r.color }}
              />
              <span className="w-28 shrink-0 font-bold text-slate-800">{r.name}</span>
              <span className="text-slate-600">{r.fact}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- quiz -- */

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const start = () => {
    setQuestions(shuffle(QUIZ_POOL).slice(0, 10));
    setAnswers({});
    setShowResults(false);
  };

  useEffect(start, []);

  const score = questions.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold text-slate-700">
          {showResults ? `You got ${score} of ${questions.length}` : `${Object.keys(answers).length} of ${questions.length} answered`}
        </p>
        <button
          type="button"
          onClick={start}
          className="min-h-[44px] rounded-lg bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-900"
        >
          🔀 New quiz
        </button>
      </div>

      {showResults && (
        <div
          className={`rounded-2xl px-4 py-4 text-center font-bold ${
            score === questions.length
              ? 'bg-emerald-100 text-emerald-800'
              : score >= questions.length - 2
                ? 'bg-sky-100 text-sky-800'
                : 'bg-amber-100 text-amber-800'
          }`}
        >
          {score === questions.length
            ? '🌟 Perfect score! You are ready for the quiz.'
            : score >= questions.length - 2
              ? '👏 So close — check the ones you missed below.'
              : '📚 Good practice. Look over the misses, then try again.'}
        </div>
      )}

      {questions.map((q, qi) => (
        <div key={qi} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="mb-3 font-bold text-slate-800">
            {qi + 1}. {q.q}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, oi) => {
              const picked = answers[qi] === oi;
              let cls = 'border-slate-200 bg-slate-50 hover:bg-slate-100';
              if (showResults) {
                if (oi === q.correct) cls = 'border-emerald-400 bg-emerald-50 text-emerald-900';
                else if (picked) cls = 'border-rose-400 bg-rose-50 text-rose-900';
                else cls = 'border-slate-200 bg-white text-slate-400';
              } else if (picked) {
                cls = 'border-sky-500 bg-sky-50 text-sky-900';
              }
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={showResults}
                  onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                  className={`min-h-[44px] rounded-xl border-2 px-3 py-2 text-left font-semibold transition ${cls}`}
                >
                  {opt}
                  {showResults && oi === q.correct && ' ✅'}
                  {showResults && picked && oi !== q.correct && ' ❌'}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!showResults && (
        <button
          type="button"
          disabled={!allAnswered}
          onClick={() => setShowResults(true)}
          className="min-h-[52px] w-full rounded-2xl bg-teal-600 px-4 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-teal-700 disabled:bg-slate-300 disabled:shadow-none"
        >
          {allAnswered ? 'Check my answers' : `Answer all ${questions.length} questions`}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ print -- */

function BlankKeyRows({ count }) {
  return (
    <div className="print-key">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="print-key-row">
          <span className="print-swatch" />
          <span className="print-eq">=</span>
          <span className="print-line" />
        </div>
      ))}
    </div>
  );
}

function PrintTab() {
  const [sheet, setSheet] = useState('world');

  return (
    <div>
      <div className="no-print space-y-3">
        <p className="text-sm text-slate-600">
          A clean, uncolored map to print and fill in by hand — no word bank, just blank
          outlines and an empty key.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'world', label: '🌍 World map' },
            { id: 'rivers', label: '🏞️ Rivers map' },
            { id: 'both', label: '📄 Both pages' },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSheet(o.id)}
              className={`min-h-[44px] rounded-xl px-4 py-2 font-bold ${
                sheet === o.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {o.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] rounded-xl bg-teal-600 px-5 py-2 font-bold text-white hover:bg-teal-700"
          >
            🖨️ Print
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Preview below is exactly what prints. Nothing else on the page will print.
        </p>
      </div>

      <div className="mt-4 space-y-6">
        {(sheet === 'world' || sheet === 'both') && (
          <section className="print-sheet rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
            <div className="print-head">
              <span>Name: ______________________</span>
              <span>Date: ______________</span>
            </div>
            <h2 className="print-title">World Map</h2>
            <svg viewBox={WORLD_VIEWBOX} className="block w-full">
              {CONTINENTS.map((c) => (
                <path
                  key={c.id}
                  d={CONTINENT_PATHS[c.id].join('')}
                  fillRule="evenodd"
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="1.1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            <BlankKeyRows count={7} />
            <p className="print-note">Label the 4 oceans directly on the map.</p>
          </section>
        )}

        {(sheet === 'rivers' || sheet === 'both') && (
          <section className="print-sheet rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
            <div className="print-head">
              <span>Name: ______________________</span>
              <span>Date: ______________</span>
            </div>
            <h2 className="print-title">North American Map</h2>
            <svg viewBox={US_VIEWBOX} className="block w-full">
              {US_LAND.map((d, i) => (
                <path key={`l${i}`} d={d} fill="#ffffff" stroke="#000000" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
              ))}
              {US_STATE_LINES.map((d, i) => (
                <path key={`s${i}`} d={d} fill="none" stroke="#c8cdd4" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
              ))}
              {US_LAKES.map((d, i) => (
                <path key={`k${i}`} d={d} fill="#ffffff" stroke="#000000" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
              ))}
              {RIVERS.map((r) => (
                <path
                  key={r.id}
                  d={US_RIVER_PATHS[r.id].join('')}
                  fill="none"
                  stroke="#000000"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            <BlankKeyRows count={7} />
          </section>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- app -- */

const TABS = [
  { id: 'rivers', name: '🏞️ Rivers' },
  { id: 'world', name: '🌍 World' },
  { id: 'facts', name: '📖 Facts' },
  { id: 'quiz', name: '📝 Quiz' },
  { id: 'print', name: '🖨️ Print' },
];

export default function GeographyStudyApp() {
  const [tab, setTab] = useState('rivers');
  // Held here so switching tabs never throws away map progress.
  const [riverProgress, setRiverProgress] = useState({});
  const [worldProgress, setWorldProgress] = useState({});

  const totalDone = useMemo(
    () =>
      Object.keys(riverProgress).length +
      Object.keys(worldProgress).length,
    [riverProgress, worldProgress],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-sky-50 to-white font-sans">
      <style>{`
        @keyframes geo-shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>

      <div className="mx-auto max-w-4xl p-4">
        <header className="no-print mb-4 text-center">
          <h1 className="text-3xl font-black tracking-tight text-teal-800 sm:text-4xl">
            Maps &amp; Rivers
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Color the rivers, fill in the world map, learn the river facts.
          </p>
          {totalDone > 0 && (
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-teal-600">
              {totalDone} labels placed so far
            </p>
          )}
        </header>

        <nav className="no-print mb-4 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-bold transition sm:px-4 sm:text-base ${
                tab === t.id
                  ? 'bg-teal-700 text-white shadow-lg'
                  : 'bg-white text-teal-800 shadow-sm ring-1 ring-teal-200 hover:bg-teal-50'
              }`}
            >
              {t.name}
            </button>
          ))}
        </nav>

        <div className={tab === 'print' ? '' : 'rounded-2xl bg-white/70 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur-sm sm:p-6'}>
          {tab === 'rivers' && <RiverMap progress={riverProgress} setProgress={setRiverProgress} />}
          {tab === 'world' && <WorldMap progress={worldProgress} setProgress={setWorldProgress} />}
          {tab === 'facts' && <RiverFacts />}
          {tab === 'quiz' && <Quiz />}
          {tab === 'print' && <PrintTab />}
        </div>
      </div>
    </div>
  );
}
