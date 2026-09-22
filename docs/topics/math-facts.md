# Math Facts

**Ruth** · 4th grade · `src/MathFactsStudyApp.jsx` · added 2026-09-22

Multiplication through 12×12, plus a timed drill that mirrors the "Mad Minute"
sheet she does daily at school.

This is the one study app that deliberately does **not** use the shared
flashcard engine. Fact fluency is a different problem from recognition — see
[learning-design.md](../learning-design.md#math-facts-srcmathfactsstudyappjsx)
for the reasoning behind everything below.

## Tabs

| Tab | What it does |
|---|---|
| ✏️ Practice | Adaptive round of 12, corrected immediately |
| ⏱ Mad Minute | 60 seconds, silent, scored at the end |
| 📊 Progress | The 12×12 grid, colored by mastery |
| 📋 Tables | Plain reference tables, 1s through 12s |

## Constants

```js
const MAX = 12;               // tables go to 12×12
const STORAGE_KEY = 'mathfacts:ruth';
const FLUENT_MS = 3000;       // correct AND under 3s to count as fluent
const ROUND = 12;             // questions per practice round
const NEW_PER_ROUND = 2;      // unseen facts folded into a round, at most
const MAD_SECONDS = 60;
```

## State model

State keys on the **sorted** pair:

```js
const pairId = (a, b) => `${Math.min(a, b)}x${Math.max(a, b)}`;
```

7×8 and 8×7 are one fact to learn, so 1–12 is **78 facts, not 144**. Both
orders still get shown — that's how the commutativity gets noticed. The
Progress grid is symmetric across the diagonal for the same reason; that is
correct, not a rendering bug.

Each fact carries one of four levels:

| Level | `levelOf` says | Color |
|---|---|---|
| `untried` | never attempted | `slate-200` |
| `needswork` | accuracy under 70%, or the last answer was wrong | `amber-700` |
| `learning` | getting it right, but not yet three fast in a row | `sky-600` |
| `fluent` | streak of 3+ and the last one under `FLUENT_MS` | `green-700` |

"Needs work" is a **status, not a stage**: a fact she is missing lands there no
matter how long she has had it, and a single wrong answer (`streak === 0`) is
enough. That's intentional — a fact that just broke is the one to rehearse.

Those three colors were checked for colorblind separation — all six checks
pass on white. Every cell also prints its product, so identity never rests on
color alone. Keep it that way if you restyle the grid.

## `buildRound` — read this before editing it

Incremental rehearsal: mostly material she already has, with at most
`NEW_PER_ROUND` unseen facts. **When a round comes up short it pads with known
facts, never with more new ones.** New facts are only used as filler when
`knownBase < 6`, i.e. a genuine cold start.

Both bugs found in review lived in this function:

- A cold start produced a **2-question round** — the new-fact cap fired with
  nothing to interleave against.
- A warm state with nothing due padded the round with **9 brand-new facts** —
  the threshold asked "did this round pull enough?" instead of "does she have
  a known base to pad from?"

After touching it, re-check all four states: cold start, known-but-nothing-due,
some-due, everything-fluent.

## Input

- **On-screen keypad is the default.** iOS's numeric keyboard has no return
  key and covers half an iPad, which makes the native keyboard the worse
  option on the device she actually uses.
- `inputMode="numeric"` is available behind a Settings toggle for anyone who
  prefers it.
- A hardware keyboard works in both modes — digits, Backspace, Enter.
- **Keep answer inputs at 16px or larger.** Below that, iOS zooms the page on
  focus and she loses her place.

## The Mad Minute

Silent for the full sixty seconds, scored at the end. It exists to rehearse
the timed sheet, so it has to feel like the timed sheet. Don't add live
feedback — Practice is where immediate correction belongs.

It reports against her own previous best, not a target or a leaderboard.
