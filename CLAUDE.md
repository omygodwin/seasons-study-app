# seasons-study-app

Interactive study guide PWA for my daughter Rose, with an embedded basketball
tournament hub and three separately-built sub-apps.

## Commands

```bash
npm install
npm run dev       # Vite dev server (default port 5173)
npm run build     # Builds main app into dist/
npm run preview   # Preview production build
npm run lint
```

Sub-apps build independently:

```bash
cd animal-hospital && npm ci && npm run build       # → animal-hospital/dist
cd hotel && npm ci && npm run build                 # → hotel/dist
cd movie-theater && npm ci && npm run build         # → movie-theater/dist
```

## Deployment

- Pushing to `main` triggers `.github/workflows/deploy.yml`, which:
  1. Builds the main app into `dist/`
  2. Builds `animal-hospital/` → copied into `dist/hospital/`
  3. Builds `hotel/` → copied into `dist/hotel/`
  4. Builds `movie-theater/` → copied into `dist/movie-theater/`
  5. Deploys the merged `dist/` to GitHub Pages
- Live: https://omygodwin.github.io/seasons-study-app/
- Vite `base` is `/seasons-study-app/` — do not change without updating links

## Routing (non-obvious)

Hash-based in `src/App.jsx`:

- `#` (root) → study guides (default)
- `#tournament` → basketball tournament hub (`TournamentApp`)

Study topics are nav-state, not hash-based. The "Rose" dropdown groups
per-child items; add new ones by appending to `ROSE_TOPICS` in App.jsx.

## Structure

```
src/
  App.jsx                   # Hash route + study nav + Rose dropdown
  SeasonsStudyApp.jsx       # Earth science topic
  EgyptStudyApp.jsx         # Ancient Egypt topic
  RocksStudyApp.jsx         # Rocks & Minerals topic
  VocabStudyApp.jsx         # Rose's vocab flashcards + quiz
  GeographyStudyApp.jsx     # Rose's Maps & Rivers (interactive + printable)
  ScienceInquiryStudyApp.jsx # Rose's Unit 1: Thinking Like a Scientist
  SocialStudiesStudyApp.jsx # Rose's Social Studies Unit 1 (regions, tribes,
                            #   explorers, colonies) + regions map
  MathFactsStudyApp.jsx     # Ruth's multiplication facts + Mad Minute
  Flashcards.jsx            # Shared spaced-repetition note-card engine
                            #   (every study app except Geography and Math Facts)
  Guidance.jsx              # "Tips" panel: study advice + a grown-ups section
  guidanceContext.js        # its context + useGuidanceTab hook
  guidance.js               # the Tips content, per topic and per tab
  tournament/               # Basketball tournament hub
    TournamentApp.jsx, BracketsView.jsx, ScheduleView.jsx, ...
  data/                     # Tournament data + generated map path data
                            #   (mapPaths.js, regionPaths.js) + mapFeatures.js
scripts/                    # Map data generation + app icon (see scripts/README.md)
animal-hospital/            # Independent Vite app → dist/hospital/
hotel/                      # Independent Vite app → dist/hotel/
movie-theater/              # Independent Vite app → dist/movie-theater/
```

### Geography topic specifics

- `src/data/mapPaths.js` is **generated** from Natural Earth data — do not
  hand-edit. Regenerate with `scripts/gen_maps.py`; see `scripts/README.md`.
- Maps are SVG; labels and the ocean tap-targets are HTML positioned over the
  SVG as a percentage of the `viewBox`, so they stay legible at phone widths
  instead of scaling down with the drawing. Rivers use
  `vector-effect="non-scaling-stroke"` for the same reason, and carry a wide
  transparent hit stroke so thin lines are still tappable.
- The world `viewBox` is inset — see `scripts/README.md` for why.
- Map progress lives in `GeographyStudyApp` itself, not the tab components, so
  switching tabs doesn't wipe it.
- The Print tab renders blank uncolored maps for printing. Print rules live in
  `src/index.css`; anything that shouldn't print gets `className="no-print"`
  (including the nav in `App.jsx`).

### Social Studies Unit 1 (Rose) specifics

- Built from her 31-question paper study guide; it follows the Virginia SOL
  USI.2–USI.5 sequence. Where her first answer and the teacher's correction on
  the sheet disagree, the correction wins (Puritans, not debtors, settled
  Massachusetts Bay; the Iroquois and Pueblo farmed).
- The rivers and world maps are **reused** from `GeographyStudyApp.jsx`, which
  exports `RiverMap`, `WorldMap` and their small pieces for that reason. The
  feature lists (`RIVERS`, `CONTINENTS`, `OCEANS`) live in
  `src/data/mapFeatures.js` because exporting arrays from a component file
  trips the fast-refresh lint rule. The `geo-shake` keyframes moved to
  `index.css` for the same sharing.
- `src/data/regionPaths.js` is **generated** by `scripts/gen_regions.py` — do
  not hand-edit. The eight regions are hand-drawn lon/lat outlines clipped to
  real coastlines, claimed in priority order, then simplified as one coverage;
  see `scripts/README.md`. `REGIONS` in the app is in the worksheet's number
  order (1 Coastal Range … 8 Canadian Shield) so the printable blank map's key
  matches hers.
- The practice test is sectioned Map / Multiple Choice / Fill in the Blank /
  Short Answer because that is all the teacher has said about the test. Map
  questions are generated from the map data (one region, one river, one
  continent or ocean per test), not written into the bank.
- "Who Am I?" is **mixed by default**, unlike the cards: telling similar
  regions or tribes apart is a discrimination task, the case where
  interleaving helps. Same reasoning as Math Facts — see
  `docs/learning-design.md`.

### movie-theater specifics

- Data model differs from hotel/animal-hospital: each `schedule/{showId}` has its
  own `seats: {1A, 1B, 2A, 2B, 2C}` map (no global `seats` collection). Today's
  schedule auto-seeds from `FEATURED_DEFAULTS` if empty; manager can regenerate
  via Schedule tab → "Generate Default" (atomically clears old shows first).
- 5 seat statuses: `available | sold | seated | dirty | broken`. `seated` is the
  30-min-early arrival flow — customers tap "🪑 Take Seat" on their own ticket
  card in the Now Playing view to flip `sold` → `seated`.
- Public is the default landing (no login wall). Small `🔑 Staff` button switches
  `mode` to 'staff' for the PIN login flow.
- Login screen falls back to hardcoded `DEFAULT_STAFF` and `DEFAULT_GROUPS`
  constants when Firebase reads return empty — so login stays usable even if
  rules temporarily block writes.

### Math facts (Ruth) specifics

- **Several people can use it.** Storage is `mathfacts:people`
  (`{v:3, activeId, profiles:[]}`); each profile owns its `facts`, `mad`
  history, keypad preference and both screens' mode/focus. Every read goes
  through `profile`, every per-person write through `setProfile` — a bare
  `setStore` write would land on the wrong person.
  - The pre-v3 single-person blob at `mathfacts:ruth` is read once, folded in
    as a profile named Ruth with id `ruth`, and then **left where it is on
    purpose**. It is the backup if the migration is ever found to be wrong;
    don't "tidy" it away. It also means a re-seed of that key is ignored once
    `mathfacts:people` exists.
  - `loadStore` defends against a missing `activeId`, duplicate ids (a write
    would otherwise hit two people), an empty list, unparseable JSON and more
    than `MAX_PROFILES`.
  - Switching profiles calls `resetDrills()`. A queue built for one person
    answered as another would record against the wrong facts.
  - The chips sit **beside the h1 at `sm:`** and are **hidden mid-drill**.
    Under the title they pushed Next below the fold on a 768px-tall iPad;
    hiding them while drilling also stops an accidental switch.
  - No cross-profile leaderboard, deliberately — see `docs/learning-design.md`
    on self-competition. Each person's Mad Minute compares to their own best.
- `MathFactsStudyApp.jsx` deliberately does NOT use `Flashcards.jsx`. Fact
  fluency is a different problem from recognition: the target is automatic
  retrieval, so a fact counts as `fluent` only when answered correctly **and**
  within `FLUENT_MS` (3s). A fact she works out by skip-counting is not learned
  yet, so speed is part of the state, not a nice-to-have.
- State is keyed on the **sorted** pair (`pairId`), because 7×8 and 8×7 are one
  fact to learn — 1-12 is 78 facts, not 144. Both orders are still shown. The
  × Progress grid is symmetric for this reason; that is correct, not a bug.
- **Division is not commutative**, so it does not share that model: 56÷7 and
  56÷8 are two facts (a square like 64÷8 is one), giving 144 division facts
  keyed on `(product, divisor)`. Keys are namespaced `m:` / `d:` and storage
  is `v: 2`; `loadState` migrates bare v1 keys rather than resetting, because
  her multiplication progress is what unlocks division. The ÷ grid is
  deliberately NOT symmetric.
- **A division fact only unlocks once its × pair is fluent.** That gate is the
  whole point — the inverse is nearly free once the product is automatic
  (CCSS 3.OA.C.7), and worthless if met cold. Locked cells render a `·`, not a
  number, so the state is never conveyed by color alone.
- **Mixing × and ÷ in one round is the default, and that is the opposite of
  the blocked-decks rule in `Flashcards.jsx`.** Both are correct; interleaving
  helps when it forces a *discrimination* (which operation?) and hurts for
  verbal term/definition material. Read `docs/learning-design.md` →
  "Interleaving cuts both ways" before changing either to match the other.
- Strategy hints fire only on a miss or a right-but-slow answer — never on a
  fast correct one. `MUL_RULES` covers every multiplier except 7; 7×7 lands on
  the squares case. Division always hints the inverse.
- The Practice/Mad Minute feedback slot has a **fixed** height and the problem
  card a **fixed** content height. Both are load-bearing: the answer field's
  `border-b-4` grows the line box by 4px the moment it holds a digit, and a
  hint appearing used to push the keypad down mid-question. Re-measure the
  keypad's position with and without a hint after touching that layout.
- `buildRound` is incremental rehearsal: mostly known material, at most
  `NEW_PER_ROUND` (2) unseen facts. **When a round comes up short it pads with
  facts she already knows, never with more new ones** — both bugs found in
  review were here (a 2-question cold-start round, then a round padded with 9
  new facts when nothing was due). Re-test all four states after touching it:
  cold start, known-but-nothing-due, some-due, everything-fluent.
- **Practice and Mad Minute each keep their OWN mode and number selection**
  (`practiceMode`/`practiceFocus`, `madMode`/`madFocus`). They were one shared
  pair, which meant setting Practice to "÷ only" silently changed what the next
  timed minute asked. `loadState` migrates the old shared `mode`/`focus` into
  both. Both screens render the same `DrillSettings` block, so they can't drift
  in what they offer.
- The **mode picker is always visible on both screens**. "÷ only" is *disabled*
  rather than hidden until a division fact unlocks — hiding it made the whole
  feature invisible to anyone who hadn't got a times fact fast yet, which is
  every new user.
- `settings.mode` (what rounds use) and `settings.shownMode` (what the picker
  highlights) differ **only while division is locked**. Mixed and ×-only ask
  identical questions then, but tapping Mixed must still light up Mixed — merge
  the two and Mixed becomes a dead button.
- The **number picker** is 1-12 with All/None. A fact counts if EITHER operand
  is selected, so picking 9 and 12 gets 9x7, 12x4 and 9x12 — every fact carries
  `pa`/`pb` (its pair operands) so one filter covers multiplication and division
  alike. An empty selection disables that screen's Start, and `eligibleFacts`
  still falls back to a non-empty pool rather than handing back a round with
  nothing in it.
- Mad Minute has **Skip**, and a skip must never call `record()` — she didn't
  answer, so scoring it wrong would push a fact into "needs work" on no evidence
  and teach her to guess rather than move on. Skips are excluded from `total`
  (attempts), from the "done" counter and from the missed list, and are shown
  separately on the results screen. Skip lives in the **timer row**: under the
  keypad it fell below the fold on a 768px-tall iPad, and it is needed
  mid-minute when scrolling costs seconds.
- Mad Minute has **Restart**, which opens a warning rather than restarting.
  Four things are load-bearing there:
  1. **The clock stops** while the warning is up (`madPaused` bails the timer
     effect), which is exactly what makes it abusable — hence the cap.
  2. **`MAD_MAX_PAUSES` (2) per run.** Opening the dialog counts, whether or
     not she confirms; after two the button greys out for the rest of that
     minute. A confirmed restart begins a new run, so the allowance resets —
     the cap limits *stopping the clock*, not restarts.
  3. **The backdrop is fully opaque**, not the usual translucent scrim: a
     see-through overlay would turn a stopped clock into free time to work out
     the problem behind it. It is also **portalled to `document.body`** — the
     app's own content wrapper carries `backdrop-blur-sm`, so rendered in place
     it would be clipped to that box (same trap as the Tips panel).
  4. **`shownAt` is pushed forward by the paused duration on resume.** Without
     it a long interruption lands in the current problem's elapsed time and
     marks a fact she was mid-way through as slow; resetting it outright would
     instead hand her free thinking time. Also `active` goes false while
     paused, or the document-level keydown handler keeps taking digits behind
     the dialog.
  A confirmed restart discards the run — it is never scored.
- Practice corrects immediately; **Mad Minute stays silent for the full minute**
  and scores at the end, because it exists to rehearse the timed sheet she does
  at school. Don't "improve" it by adding live feedback.
- Input: an on-screen keypad is the default because iOS's numeric keyboard has
  no return key and covers half an iPad. `inputMode="numeric"` is available via
  the Settings toggle; a hardware keyboard (digits / Backspace / Enter) works in
  both modes. Keep answer inputs at 16px+ or iOS zooms the page on focus.
- Mastery colors were validated for colorblind separation (`amber-700`,
  `sky-600`, `green-700` on white pass all six checks). Every cell also carries
  its product, so identity is never color-alone — keep it that way.

## Study-app conventions

- Each `*StudyApp.jsx` follows the same pattern: tab state, flashcard state
  (Known/Review sets), randomized 10-question quiz from a larger pool.
- **All flashcards go through `Flashcards.jsx`.** Every study app uses it
  (Geography has no cards; Math Facts has its own model — see above). Don't hand-roll a card UI in a study app again.
  It takes `decks` (`[{id, label, emoji, cards: [{term, definition, note?}]}]`),
  a `storageKey` (`flashcards:<topic>`, and it must be unique — two topics
  sharing one would merge their schedules), and a `theme` naming one of the
  presets at the top of the file. It owns its own deck picker, so a topic needs
  one Note Cards tab, not one tab per deck, and it hides the picker entirely
  for a single-deck topic. Three rules it exists to enforce — breaking any of
  them is what makes flashcards feel productive while teaching much less:
  1. **Never render a term next to its definition on a study tab.** The answer
     is hidden behind the flip, and the grade buttons only appear after a
     reveal. A browsable term/definition list belongs on its own tab (see the
     "All Notes" tab), never under the cards.
  2. **Card scheduling must persist.** Leitner boxes with 1/3/7/16-day
     intervals in `localStorage` — spacing does nothing if it resets on
     reload, which is what the old in-component `Set`s did.
  3. **A card leaves the round only when graded "Knew it."** "Almost" and
     "Study Again" requeue it, so every round ends on successful recall, and
     they also trigger the own-words prompt (below).
  4. **Rounds are blocked by deck; mixing is opt-in.** This was reversed once
     and put back deliberately — don't "fix" it. Interleaving measures g = 0.42
     overall but the moderators run the other way for term-and-definition
     material: Brunmair & Richter (2019) estimate a *negative* effect for
     verbal material (against g = 0.67 for visual categories), and Hwang (2025)
     finds blocked practice first matters for new declarative knowledge in
     younger learners. "Mix It Up" sits last in the picker with a line saying
     to use it once a topic is mostly Strong.
  5. **Only a missed card asks her to write it in her own words.** Generation
     plus self-explanation on the cards retrieval just showed are weak; doing
     it for all 50 is the opportunity-cost trap (time spent making cards
     instead of retrieving from them). Her wording persists as `cards[id].own`,
     shows under the real definition on the *answer* face only, and survives
     both a regrade and a progress reset — the boxes are the app's state, the
     notes are hers.
  The `lg:` card height is deliberately *shorter* than `sm:` — `lg` width is
  the iPad in landscape, where the grade buttons have to stay above the fold.
- When adding a new Rose study topic:
  1. Create `FooStudyApp.jsx` mirroring `VocabStudyApp.jsx`
  2. Add `{ id, label, emoji, date }` to `ROSE_TOPICS` in `App.jsx`, where
     `date` is the `YYYY-MM-DD` the unit was studied
  3. Add `{studyTopic === 'foo' && <FooStudyApp />}` render branch
- Topic menu ordering lives in `src/topicSchedule.js`. Dated topics are grouped
  into month sections, newest first, inside the one dropdown — no nested
  menus. ISO date strings are what make this sort correctly across the
  September → January school-year rollover, so keep the `YYYY-MM-DD` format
  and don't swap in `Date` objects or `M/D/YY` strings. Several topics can
  share a month. A child whose topics have no `date` (currently Raegan) just
  renders as a flat list; add dates to their entries to switch them over.
- Touch-first nav: nav buttons use `min-h-[44px]`; the Rose dropdown closes on
  outside tap or Escape. Preserve these when editing nav.
- **The Tips panel** (`Guidance.jsx`) sits in the nav on every study topic. Two
  audiences: study advice for the child, and a "For grown-ups" section tying
  the page to the research. Content lives in `guidance.js`, keyed by topic and
  tab; a tab entry that is a string names a shared role (`cards` / `quiz` /
  `notes` / `overview`) so nine topics don't each carry a copy. A study app
  opts in with one line: `useGuidanceTab(activeTab)`.
  - **The panel MUST stay portalled to `document.body`.** The nav carries
    `backdrop-blur`, and `backdrop-filter` makes an element a containing block
    for `fixed` descendants — rendered in place, the panel inherited the nav's
    68px height and silently clipped while still reporting all its text to the
    DOM. A presence check will not catch this; assert its height.
  - Adding a topic means adding a `GUIDANCE` entry, or the button hides itself
    for that topic.
- The selected topic is remembered in `localStorage` (`studyTopic`) so the app
  reopens on whichever child used it last.
- No test framework — verify with `npm run build` and manual browser check.

## Gotchas

- All four apps commit a lockfile and install with `npm ci`. `hotel/` and
  `movie-theater/` previously had no lockfile (commit 83762e3, to dodge an
  esbuild version clash), which forced `npm install` to re-resolve the whole
  tree from the registry on every deploy — that was the difference between an
  80-second and a 14-minute deploy. Lockfiles were regenerated and the clash
  did not recur; keep them committed and keep the installs on `npm ci`.
- `npm run lint` will NOT catch a missing component import. `no-undef` doesn't
  flag undefined JSX element names and `eslint-plugin-react` isn't installed,
  so a dropped `import Flashcards from './Flashcards'` lints clean, builds
  clean, and only blows up as "Flashcards is not defined" at render. A study
  app's tabs have to be clicked in a browser before you trust a refactor of
  one — `npm run build` passing means nothing here.
- PWA manifest lives at `public/manifest.json`. The app icon (the **RG**
  monogram — all three girls are R. Godwin) is generated: see
  `scripts/icons/README.md`, don't hand-edit the PNGs in `public/`. Three
  variants exist for good reasons — the favicon is a **simplified** mark
  (heavier strokes, no amber bar) because the full one is illegible below
  ~48px, `apple-touch-icon.png` is **square and opaque** because iOS masks it
  itself and composites transparency onto black, and the maskable icon is
  scaled to 78% to survive Android's circle crop.
- The tab title is set from `App.jsx` (`SITE_NAME` + the topic label, derived
  from the same arrays the menus use). It said "Basketball Tournament" on every
  page for months — if you add a topic list, it titles itself.
- `manifest.json` `orientation` is **`any`**, not `portrait`. The iPad is used
  in landscape and the Flashcards `lg:` height exists for exactly that.
- Shared Firebase Realtime DB project `roseruthclinic` is used by `hotel/`,
  `animal-hospital/`, and `movie-theater/` (under namespace `movieTheater`),
  not by the main study app.
- Firebase RTDB rules (Console → roseruthclinic → Realtime Database → Rules) must
  stay `{".read": true, ".write": true}`. Default test-mode rules use a 30-day
  timestamp expiry that silently breaks ALL writes — watch for `permission_denied`
  warnings in the browser console when seeds/writes don't take effect.
- Worktree gotcha: `main` is owned by the primary worktree at
  `C:/Users/bgodwin/Documents/GitHub/seasons-study-app`. From feature worktrees,
  branch via `git checkout -b foo origin/main` — `git checkout main` errors
  with "already used by worktree".
- Port 5173 is also reserved for other local projects per the workspace
  CLAUDE.md — pin a different port in `vite.config.js` if that conflicts.
- `movie-theater/` dev server pinned to port 5188 in `.claude/launch.json`.
