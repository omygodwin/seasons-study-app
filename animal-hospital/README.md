# Animal Hospital

A pretend vet clinic the girls run together — one plays staff, the others
bring in patients. State is shared live through Firebase, so what one device
does shows up on the others.

Deployed at **`/hospital/`** on the main site.

## Running it

```bash
npm ci
npm run dev
npm run build     # → dist/, copied to dist/hospital/ by the root deploy
```

This is a separate npm project from the root app. Install with `npm ci`, not
`npm install` — see [../docs/deploying.md](../docs/deploying.md) for why that
matters.

## Sections

| Tab | What happens there |
| --- | --- |
| **Home** | Dashboard of current patients and running timers |
| **Check In** | Admit a patient — owner, animal, reason for the visit |
| **Records** | Patient history and discharge papers |
| **Settings** | Staff and family accounts |

## Data

Firebase Realtime Database, project `roseruthclinic`. Config lives in
`src/firebase.js`.

**This app writes to the database root, not a namespace.** Its paths are
top-level:

```
accounts/          families and staff
hospital/          patients and visits
timers/            treatment timers
notifications/
dischargePapers/
```

Hotel and Movie Theater namespace themselves under `hotel/` and
`movieTheater/`. This one does not, which is worth knowing before adding a
fourth app — a new app using a generic top-level key like `accounts/` would
collide with this one. See [../docs/firebase.md](../docs/firebase.md).

## Gotcha

If writes silently do nothing, check the database rules before debugging the
code. Test-mode rules expire after 30 days and break every write without an
obvious error. [../docs/firebase.md](../docs/firebase.md) has the fix.
