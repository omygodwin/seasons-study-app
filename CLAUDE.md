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
cd hotel && npm install && npm run build            # → hotel/dist
cd movie-theater && npm install && npm run build    # → movie-theater/dist
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
  tournament/               # Basketball tournament hub
    TournamentApp.jsx, BracketsView.jsx, ScheduleView.jsx, ...
  data/                     # Tournament data
animal-hospital/            # Independent Vite app → dist/hospital/
hotel/                      # Independent Vite app → dist/hotel/
movie-theater/              # Independent Vite app → dist/movie-theater/
```

## Study-app conventions

- Each `*StudyApp.jsx` follows the same pattern: tab state, flashcard state
  (Known/Review sets), randomized 10-question quiz from a larger pool.
- When adding a new Rose study topic:
  1. Create `FooStudyApp.jsx` mirroring `VocabStudyApp.jsx`
  2. Add `{ id, label, emoji }` to `ROSE_TOPICS` in `App.jsx`
  3. Add `{studyTopic === 'foo' && <FooStudyApp />}` render branch
- Touch-first nav: nav buttons use `min-h-[44px]`; the Rose dropdown closes on
  outside tap or Escape. Preserve these when editing nav.
- No test framework — verify with `npm run build` and manual browser check.

## Gotchas

- The `animal-hospital` build uses `npm ci` (lockfile-strict); `hotel/` and
  `movie-theater/` use `npm install` because their lockfiles are intentionally
  absent (see commit 83762e3 for hotel; same pattern for movie-theater).
- PWA manifest lives at `public/manifest.json`.
- Shared Firebase Realtime DB project `roseruthclinic` is used by `hotel/`,
  `animal-hospital/`, and `movie-theater/` (under namespace `movieTheater`),
  not by the main study app.
- Port 5173 is also reserved for other local projects per the workspace
  CLAUDE.md — pin a different port in `vite.config.js` if that conflicts.
