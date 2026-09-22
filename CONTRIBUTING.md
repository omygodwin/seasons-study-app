# Working on this repo

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
```

The three pretend-play apps are separate npm projects:

```bash
cd hotel && npm ci && npm run dev
```

Install sub-apps with **`npm ci`**, not `npm install` — the lockfiles are
committed on purpose ([docs/deploying.md](docs/deploying.md)).

Port 5173 is shared with other local projects. If it clashes, pin a different
one in `vite.config.js`. `movie-theater/` is already pinned to 5188.

## Before you trust a change

There is no test framework. Two checks, and the second is not optional:

```bash
npm run build
npm run lint
```

**Then click through it in a browser.** `npm run lint` will not catch a
missing component import: `no-undef` doesn't flag undefined JSX element
names, and `eslint-plugin-react` isn't installed. A dropped
`import Flashcards from './Flashcards'` lints clean, builds clean, and only
fails at render. That has actually shipped here once.

A green build means nothing for a study-app refactor. Open the app, switch to
the topic, and click every tab.

## Repo layout

```
src/
  App.jsx                    # hash route + per-child nav
  *StudyApp.jsx              # one per topic
  Flashcards.jsx             # shared spaced-repetition card engine
  MathFactsStudyApp.jsx      # Ruth's math facts (own model, see below)
  GeographyStudyApp.jsx      # maps (no cards)
  tournament/                # basketball hub, at #tournament
  data/                      # tournament data + generated map paths
scripts/                     # map generation (see scripts/README.md)
animal-hospital/  hotel/  movie-theater/     # independent Vite apps
docs/topics/                 # one file per study topic
```

## Adding a study topic

1. Create `src/FooStudyApp.jsx`. If it uses cards, render `<Flashcards>` —
   **don't hand-roll a card UI.** It takes `decks`, a unique `storageKey`
   (`flashcards:<topic>`) and a `theme` naming a preset at the top of the file.
2. Add `{ id, label, emoji, date }` to the right child's topic array in
   `src/App.jsx`. `date` is the `YYYY-MM-DD` the unit was studied, and it must
   stay an ISO string — that's what sorts the menu correctly across the
   September → January school-year rollover.
3. Add the render branch: `{studyTopic === 'foo' && <FooStudyApp />}`.
4. Write `docs/topics/foo.md`.

## Adding a child

`src/App.jsx` holds one topic array and one `menus` entry per child. Add both,
add the new ids to the `getSavedTopic` list, and give her an accent color that
isn't already taken — currently emerald (Raegan), fuchsia (Rose) and sky
(Ruth).

## Conventions that exist for a reason

- **Touch first.** Nav buttons are `min-h-[44px]`; dropdowns close on outside
  tap and on Escape. These are used on iPads, not laptops.
- **Read [docs/learning-design.md](docs/learning-design.md) before changing
  how practice behaves.** Several decisions look like bugs and are not: the
  answer list lives on its own tab, rounds study one topic at a time, the Mad
  Minute gives no feedback until time is up. Each has a reason and a citation.
- **Tailwind classes must be literal.** The JIT only sees class names written
  out in full, so `bg-${color}-800` gets purged. Themes are named presets, not
  color props.
- The selected topic persists in `localStorage` (`studyTopic`) so the app
  reopens on whoever used it last.

## Agent notes

[CLAUDE.md](CLAUDE.md) carries the working notes for AI coding agents — the
same conventions in more detail, plus the specific mistakes made here before.
