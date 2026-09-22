# Firebase

The three pretend-play apps share one Firebase Realtime Database. The study
apps and the tournament hub do not use Firebase at all — they are static and
keep progress in `localStorage`.

- **Project:** `roseruthclinic`
- **Database:** `https://roseruthclinic-default-rtdb.firebaseio.com`
- **Config:** each app's `src/firebase.js`

## The rules trap

**If writes silently do nothing, check the rules before debugging any code.**
This has bitten this project more than once and produces no obvious error.

Rules must stay:

```json
{ ".read": true, ".write": true }
```

Console → `roseruthclinic` → Realtime Database → Rules.

Firebase's default test-mode rules include a timestamp condition that expires
**30 days** after they are set:

```json
{ ".read": "now < 1234567890000", ".write": "now < 1234567890000" }
```

Past that date every write fails. Seeds appear to do nothing, forms look like
they submit and nothing lands. The only signal is a `permission_denied`
warning in the browser console, which is easy to miss.

This database holds a pretend vet clinic, hotel and cinema for three kids on
a home network. Open rules are a deliberate trade for a family toy, not an
oversight — but don't put anything real in it.

## Namespaces — and one exception

Two of the three apps namespace their data. One does not.

| App | Root | Paths |
| --- | --- | --- |
| Hotel | `hotel/` | `hotel/guests/`, `hotel/guestAccounts/`, `hotel/guestBook/` |
| Movie Theater | `movieTheater/` | `movieTheater/orders/`, `movieTheater/groups/`, `movieTheater/poll/` |
| **Animal Hospital** | **(database root)** | `accounts/`, `hospital/`, `timers/`, `notifications/`, `dischargePapers/` |

Hotel and Movie Theater route every path through an `FB` constant at the top
of their `App.jsx`. Animal Hospital predates that convention and writes to
top-level keys directly.

**This matters when adding a fourth app.** A new app that writes to a generic
top-level key — `accounts/`, `notifications/`, `timers/` — will collide with
Animal Hospital's data. Give any new app its own `FB` namespace from the
start. Migrating Animal Hospital under a namespace would be the tidier fix,
but it means moving live data the girls are using.

## Seat model note

Movie Theater's seats are **per show**, not global: `schedule/{showId}/seats`
holds `{1A, 1B, 2A, 2B, 2C}`. There is no top-level `seats` collection. See
[../movie-theater/README.md](../movie-theater/README.md).
