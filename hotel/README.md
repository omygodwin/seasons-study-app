# Hotel

A pretend hotel with four jobs to play. One girl works the desk, another
housekeeping, another arrives as a guest. State is shared live through
Firebase across devices.

Deployed at **`/hotel/`** on the main site.

## Running it

```bash
npm ci
npm run dev
npm run build     # → dist/, copied to dist/hotel/ by the root deploy
```

Separate npm project from the root app. Install with `npm ci`, not
`npm install` — see [../docs/deploying.md](../docs/deploying.md).

## Roles

| Role | What they do |
| --- | --- |
| **Manager** | Rooms, rates, staff, the guest book |
| **Receptionist** | Check guests in and out, assign rooms |
| **Housekeeper** | Room status — clean, dirty, in progress |
| **Bellhop** | Luggage and guest requests |

Rooms come in themes: Ocean Paradise, Space Adventure, Jungle Safari, Royal
Palace and Classic. Breakfast is a separate add-on service.

## Data

Firebase Realtime Database, project `roseruthclinic`, namespaced under
**`hotel/`** — every path goes through the `FB` constant in `src/App.jsx`:

```
hotel/guests/
hotel/guestAccounts/
hotel/guestBook/
hotel/rooms/
```

Keep new writes behind that constant so this app can't collide with the
others sharing the database. See [../docs/firebase.md](../docs/firebase.md).

## Gotcha

Silent write failures are almost always the database rules expiring, not the
code. [../docs/firebase.md](../docs/firebase.md) has the fix.
