# Ancient Egypt

**Raegan** · `src/EgyptStudyApp.jsx`

Pharaohs, gods, and the periods of Egyptian history. The cleanest example of
the standard four-tab topic — copy this one when adding a history unit.

## Tabs

| Tab | What it does |
|---|---|
| 🃏 Note Cards | Shared [`Flashcards`](../../src/Flashcards.jsx) engine, `theme="amber"` |
| 📝 Quiz | 10 questions drawn at random from 16 |
| 📜 Overview | Timeline and context |
| 📋 All Notes | Browsable term/definition list |

`STORAGE_KEY` is `flashcards:egypt`.

## Decks

| Deck | Cards |
|---|---|
| 👑 Pharaohs | 7 |
| ☀️ Gods | 5 |
| 🏺 Terms & Places | 6 |
| ⏳ Periods | 3 |

21 cards is on the small side, and the deck split is what makes it work: four
short blocked rounds beat one 21-card pile. Note that **Periods has only 3
cards** — a deck that small finishes almost immediately, which is fine as
review but means it can't carry a session on its own.

## The quiz

```js
setCurrentQuiz(shuffled.slice(0, 10));
```

10 of 16 questions, reshuffled on every start. That's a thin margin — she sees
most of the bank every time, so the randomization is doing less than it looks
like. Adding questions is the fix; append to `quizQuestionBank` and nothing
else needs to change.

`quizQuestionBank` is declared **inside the component**, so it's rebuilt on
every render. It's a static array, so this costs nothing and changes nothing —
but if you ever generate questions here the way `VocabStudyApp` does, hoist it
to module scope or wrap it in `useMemo` first, or the distractors will reshuffle
underneath her mid-quiz. Rocks and Middle Ages have the same shape.

## Keeping decks and quiz in step

The quiz is written by hand, not generated from the cards, so a term added to
a deck won't appear in the quiz until a question is written for it. That's
deliberate — history questions worth asking ("why did the Old Kingdom end")
aren't derivable from a definition — but it does mean the two drift apart if
only one gets updated.
