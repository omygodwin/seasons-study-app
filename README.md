# Study Apps

A small collection of study tools built for my three daughters, plus a
basketball tournament hub and three pretend-play apps they run together.
Everything is static and deploys to GitHub Pages.

**Live: <https://omygodwin.github.io/seasons-study-app/>**

---

## What's in here

### Study guides

The main app opens on whichever child used it last. Each child has her own
menu in the nav.

| Child | Topic | What it is |
| --- | --- | --- |
| **Ruth** (4th) | ✖️ Math Facts | Multiplication 1–12: adaptive practice plus a one-minute timed drill |
| **Rose** (middle school) | 🔬 Thinking Like a Scientist | Unit 1 — inquiry, scientific method, measurement, lab write-up |
| | 🗺️ Maps & Rivers | Interactive continents, oceans and rivers, with printable blank maps |
| | 📚 Vocab Words | 22 vocabulary words |
| **Raegan** (9th) | 🌍 Earth Science: Seasons | Tilt, solstices, climate zones, plus an orbit simulation |
| | 🏺 Ancient Egypt | Pharaohs, gods, terms and periods |
| | 🪨 Rocks & Minerals | Rock types, the rock cycle, minerals and properties |
| | 🏛️ Latin Vocab | Chapter 13, lessons 48–51 |
| | 🏰 Middle Ages | Feudalism, the Church, the Crusades, Magna Carta |

### Basketball tournament hub

At `#tournament` — brackets, schedule and team pages for a school tournament.

### Pretend-play apps

Three separate apps the girls run together on their own devices, each with
staff and customer roles and shared live state. They build independently and
are stitched into the same deploy:

| App | Path | What they play |
| --- | --- | --- |
| [Animal Hospital](animal-hospital/) | `/hospital/` | Vet clinic — check-in, records, treatment timers |
| [Hotel](hotel/) | `/hotel/` | Front desk, housekeeping, bellhop, themed rooms |
| [Movie Theater](movie-theater/) | `/movie-theater/` | Box office, concessions, seating, showtimes |

---

## How the study material works

Cards are not just cards. The flashcard engine and the math facts app are
both built around the two study techniques with the strongest evidence behind
them, and several design decisions look odd until you know why:

- The answer is hidden until she has tried to recall it, and the browsable
  term-and-definition list lives on a separate tab. Reading a term beside its
  definition feels productive and teaches much less.
- Scheduling persists across days rather than resetting each session.
- Rounds study one topic at a time by default; mixing is opt-in.
- The Mad Minute deliberately gives no feedback until time is up.

The reasoning, with the research behind it, is in
**[docs/learning-design.md](docs/learning-design.md)** — read that before
changing how practice behaves.

---

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/
npm run preview
npm run lint
```

The sub-apps are separate npm projects and build on their own:

```bash
cd hotel && npm ci && npm run build
```

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for setup, conventions and how to
add a new child or topic, and **[docs/deploying.md](docs/deploying.md)** for
the deploy pipeline.

---

## Documentation

| File | What it covers |
| --- | --- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, conventions, adding a topic or a child |
| [CLAUDE.md](CLAUDE.md) | Working notes for AI coding agents |
| [docs/learning-design.md](docs/learning-design.md) | Why practice behaves the way it does |
| [docs/deploying.md](docs/deploying.md) | GitHub Pages pipeline and its history |
| [docs/firebase.md](docs/firebase.md) | Shared Realtime Database, rules, namespaces |
| [docs/topics/](docs/topics/) | One file per study topic |
| [docs/tips-panel.md](docs/tips-panel.md) | The in-app Tips panel and its content model |
| [scripts/README.md](scripts/README.md) | Regenerating the map data |
