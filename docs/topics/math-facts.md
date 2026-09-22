# Math Facts

**Ruth** · 4th grade · `src/MathFactsStudyApp.jsx` · added 2026-09-22

Multiplication and division through 12×12, plus a timed drill that mirrors the
"Mad Minute" sheet she does daily at school.

This is the one study app that deliberately does **not** use the shared
flashcard engine. Fact fluency is a different problem from recognition — see
[learning-design.md](../learning-design.md#math-facts-srcmathfactsstudyappjsx)
for the reasoning behind everything below.

## Tabs

| Tab | What it does |
|---|---|
| ✏️ Practice | Adaptive round of 12, corrected immediately, × and ÷ mixed, filterable by number |
| ⏱ Mad Minute | 60 seconds, silent, scored at the end, skippable |
| 📊 Progress | Two 12×12 grids — × (symmetric) and ÷ (not) — colored by mastery |
| 📋 Tables | Reference tables, 1s through 12s, each line with its fact family |

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

There are **78 multiplication facts and 144 division facts.**

Multiplication keys on the **sorted** pair:

```js
const pairId = (a, b) => `${Math.min(a, b)}x${Math.max(a, b)}`;
```

7×8 and 8×7 are one fact to learn, so 1–12 is **78 facts, not 144**. Both
orders still get shown — that's how the commutativity gets noticed. The
Progress grid is symmetric across the diagonal for the same reason; that is
correct, not a rendering bug.

Division does **not** get that treatment, because it isn't commutative:
`56 ÷ 7 = 8` and `56 ÷ 8 = 7` are two separate things to know. Those key on
`(product, divisor)` as `d:56/7`. A square gives only one (`64 ÷ 8`), so the
count is 66 pairs × 2 + 12 squares = 144.

Keys are namespaced (`m:7x8`, `d:56/7`) and storage is at `v: 2`. `loadState`
**migrates** bare v1 keys instead of resetting — her multiplication progress is
precisely what unlocks the division, so wiping it would undo the feature.

## Division unlocks per pair

A division fact enters the pool only once its multiplication pair is `fluent`.
That gate is the whole argument for adding division at all: the inverse is
nearly free once the product is automatic — which is how CCSS 3.OA.C.7 frames
it, "knowing that 8 × 5 = 40, one knows 40 ÷ 5 = 8" — and is just another
unknown if met cold.

In the ÷ grid a locked cell shows a `·` rather than its number, so lock state
is never carried by color alone. Rows are the divisor, columns the answer. It
is **not** symmetric, unlike the × grid, and that asymmetry is the point.

## Mixing is the default here — the opposite of Flashcards

`Flashcards.jsx` blocks its decks and makes mixing opt-in. This app mixes × and
÷ by default. Both are right, for reasons in
[learning-design.md](../learning-design.md#interleaving-cuts-both-ways):
interleaving pays when it forces a *discrimination*, and a round that mixes
`7 × 8` with `56 ÷ 8` makes her read the sign before answering. Don't
"harmonize" the two.

A `Mixed / × only / ÷ only` picker appears on Practice and Mad Minute once
anything has unlocked, and applies to both.

## Settings are per screen

Practice and Mad Minute each keep their **own** mode (`Mixed` / `× only` /
`÷ only`) and their own number selection. They used to share one pair, which
meant setting Practice to division-only silently changed what the next timed
minute asked — and the two exist for different things, since the minute is
meant to look like the sheet at school.

Both render the same `DrillSettings` block so they can't drift in what they
offer. `loadState` migrates the old shared `mode`/`focus` into both.

The mode picker is **always visible**, on both. `÷ only` is *disabled* rather
than hidden until a division fact unlocks — hiding it made the feature
invisible to anyone who hadn't got a times fact fast yet, which is every new
user.

One subtlety worth keeping: `settings.mode` (what rounds use) and
`settings.shownMode` (what the picker highlights) differ **only while division
is locked**. Mixed and ×-only ask identical questions then, but tapping Mixed
still has to light up Mixed — collapse the two and Mixed becomes a dead button.

## The number picker

Twelve toggles plus **All** and **None**, so "just my 12s" or "9s and 12s" is a
couple of taps. Stored as `state.focus`.

A fact counts if **either** operand is selected — picking 9 and 12 gets 9 × 7,
12 × 4 and 9 × 12, not only the facts where both sides are chosen. Every fact
carries `pa` / `pb` (its pair operands) so the one filter covers multiplication
and division alike: `108 ÷ 9 = 12` is both a 9 fact and a 12 fact.

Two guards worth keeping:

- An empty selection **disables Start**, with the summary line saying why.
- `eligibleFacts` still falls back to a non-empty pool if it is ever reached
  with nothing selected, so a stale selection degrades to something askable
  rather than to a blank round.

Mad Minute starts unfiltered — it never had a number filter before, so the
migration leaves it on everything rather than inheriting Practice's selection.

At `sm` and up the chips render as a single row of 12 rather than 6 × 2 — that
is what keeps the Start button above the fold on a 768px-tall iPad.

## Skip, in the Mad Minute

She can jump around on the paper sheet, so she can here.

**A skip never calls `record()`.** She didn't answer it, so scoring it wrong
would push a fact into "needs work" on no evidence, and would teach her to
guess rather than move on. Skips are excluded from `total` (which counts
attempts), from the "done" counter, and from the missed list; they get their own
line on the results screen saying they don't count against her.

Skip sits in the **timer row**, not under the keypad. Under the keypad it fell
below the fold on a 768px-tall iPad and on phones — and it is needed
mid-minute, when scrolling costs her seconds.

## Strategy hints

Shown on a miss, and on a right-but-slow answer — the signature of
skip-counting. **Never on a fast correct answer.** `MUL_RULES` has a rule for
every multiplier 1–12 except 7; `7 × 7` falls through to the squares case, so
every pair resolves. Division always hints the inverse ("what times 8 makes
56?").

## Levels

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

## The layout is pinned on purpose

The feedback slot has a **fixed** height and the problem card a **fixed**
content height. Both were needed to stop the keypad moving mid-question:

- The answer field's `border-b-4` grows the line box by 4px the instant it
  holds a digit rather than a space, so the card grew as she typed.
- A hint appearing pushed the keypad down and, on a 768px-tall iPad, dropped
  the Next button below the fold.

Her thumb is already where Next was. After touching this layout, re-measure
the Next button's position with and without a hint showing.

## The Mad Minute

Silent for the full sixty seconds, scored at the end. It exists to rehearse
the timed sheet, so it has to feel like the timed sheet. Don't add live
feedback — Practice is where immediate correction belongs.

It reports against her own previous best, not a target or a leaderboard.
