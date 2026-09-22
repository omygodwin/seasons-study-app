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
  Flashcards.jsx            # Shared spaced-repetition note-card engine
                            #   (used by every study app except Geography)
  tournament/               # Basketball tournament hub
    TournamentApp.jsx, BracketsView.jsx, ScheduleView.jsx, ...
  data/                     # Tournament data + generated map path data
scripts/                    # Map data generation (see scripts/README.md)
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

## Study-app conventions

- Each `*StudyApp.jsx` follows the same pattern: tab state, flashcard state
  (Known/Review sets), randomized 10-question quiz from a larger pool.
- **All flashcards go through `Flashcards.jsx`.** Every study app uses it
  (Geography has no cards). Don't hand-roll a card UI in a study app again.
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
- PWA manifest lives at `public/manifest.json`.
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
