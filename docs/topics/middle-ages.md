# Middle Ages (Western Civ)

**Raegan** · `src/MiddleAgesStudyApp.jsx`

Feudalism, the medieval Church, the events that bracket the period, and the
Magna Carta.

## Tabs

| Tab | What it does |
|---|---|
| 🃏 Note Cards | Shared [`Flashcards`](../../src/Flashcards.jsx) engine, `theme="amber"` |
| 📝 Quiz | 10 questions drawn at random from 30 |
| 📜 Overview | Timeline and context |
| 📋 All Notes | Browsable term/definition list |

`STORAGE_KEY` is `flashcards:middleages`.

## Decks

| Deck | Cards |
|---|---|
| 🏰 Feudalism | 8 |
| ⛪ The Church | 10 |
| ⚔️ Events | 14 |
| 📜 Magna Carta | 7 |

## The best quiz ratio in the repo

30 questions, 10 drawn. That's the only topic where the pool is genuinely
larger than the quiz — three distinct quizzes' worth, so a repeat is a real
retrieval attempt rather than a recalled answer position. Egypt's 16 and
Seasons' fixed 8 are the ones to bring up to this, not the other way round.

## Events is a 14-card deck of dates

The largest deck here is chronology, which is the hardest thing on these cards
to hold — dates have no internal logic to reconstruct from, so they depend
entirely on spacing. The engine's 1/3/7/16-day ladder is doing most of the work
on this deck, which means it only pays off if she opens the app across several
days rather than the night before. Worth saying out loud to her; the app can't
enforce it.

## It shares a theme with Egypt

Both use `theme="amber"`. That's fine — themes are presentation, and the
`storageKey`s are distinct (`flashcards:middleages` vs `flashcards:egypt`), so
the two topics keep entirely separate schedules.

**Sharing a `storageKey` is the thing that would break**, silently merging two
topics' review state. If you clone this file for a new topic, change that
string first.
