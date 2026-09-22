# Movie Theater

A pretend cinema — box office, concession stand, ushers and an audience.
State is shared live through Firebase across devices.

Deployed at **`/movie-theater/`** on the main site.

## Running it

```bash
npm ci
npm run dev       # pinned to port 5188 in .claude/launch.json
npm run build     # → dist/, copied to dist/movie-theater/ by the root deploy
```

Separate npm project from the root app. Install with `npm ci`, not
`npm install` — see [../docs/deploying.md](../docs/deploying.md).

## Roles

Public is the landing view — no login wall. A small **🔑 Staff** button
switches to the PIN login for the staff roles.

| View | What they do |
| --- | --- |
| **Now Playing** (public) | Browse showtimes, buy a ticket, take a seat |
| **Manager** | Schedule, pricing, staff and groups |
| **Concessions** | Popcorn, snacks, candy, drinks |
| **Usher** | Seat status and cleanup |
| **Vote** | Audience poll for what plays next |

## Data

Firebase Realtime Database, project `roseruthclinic`, namespaced under
**`movieTheater/`**.

Its seat model differs from the other two apps and is easy to get wrong:

- There is **no global `seats` collection**. Each show owns its seats at
  `schedule/{showId}/seats`, a map of `{1A, 1B, 2A, 2B, 2C}`.
- Seats have five states: `available | sold | seated | dirty | broken`.
- `seated` is the early-arrival flow — a customer taps **🪑 Take Seat** on
  their own ticket card in Now Playing, flipping `sold` → `seated`.
- Today's schedule auto-seeds from `FEATURED_DEFAULTS` when empty. The
  manager can rebuild it from Schedule → **Generate Default**, which clears
  the old shows atomically first.

## Gotchas

- The login screen falls back to the hardcoded `DEFAULT_STAFF` and
  `DEFAULT_GROUPS` constants when Firebase reads come back empty, so staff
  login keeps working even if rules temporarily block reads. Don't remove
  that fallback.
- Silent write failures are usually expired database rules, not code. See
  [../docs/firebase.md](../docs/firebase.md).
