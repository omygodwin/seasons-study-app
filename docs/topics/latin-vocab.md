# Latin Vocab

**Raegan** · `src/LatinVocabStudyApp.jsx`

23 Latin words across two lesson groups, each card carrying its part of speech.

## Tabs

| Tab | What it does |
|---|---|
| 🃏 Note Cards | Shared [`Flashcards`](../../src/Flashcards.jsx) engine, `theme="rose"` |
| 📝 Quiz | 10 questions from a generated pool |
| 📋 Word List | Browsable list, grouped by lesson |

`STORAGE_KEY` is `flashcards:latin`.

## Decks are derived from the lesson field

Unlike the other topics, the decks aren't written out by hand:

```js
const DECKS = ['48-9', '50-51'].map((lesson) => ({
  id: lesson,
  label: `Lessons ${lesson}`,
  emoji: '🏛️',
  cards: VOCAB.filter((v) => v.lesson === lesson).map((v) => ({
    term: v.term,
    definition: v.definition,
    note: v.pos,
  })),
}));
```

Lessons 48–9 have 12 words, 50–51 have 11.

To add a lesson, add its id in **two** places — `LESSONS` (which drives the
filter buttons, and carries a leading `'all'`) and the array `DECKS` maps over
— then tag the new words with a matching `lesson`. **A word whose `lesson`
isn't in the deck array silently disappears from the cards.** It stays in the
word list, so the symptom is a deck that's short rather than an error.

## The lesson filter scopes the quiz too

`lessonFilter` narrows the word list *and* rebuilds `quizPool` from just those
words, with a `useEffect` starting a fresh quiz whenever it changes. Picking
"Lessons 50–51" gives a quiz on 11 words, with distractors drawn only from
those 11 — which makes it a noticeably easier quiz than "All Lessons". That's
the right trade for studying one lesson the night it's assigned; it's worth
knowing the scores aren't comparable across filters.

## The `pos` field becomes the card note

Parts of speech (`m.`, `f.`, `n.`, `adj.`, `v.`, `adv.`, `conj.`, `pron.`) map
onto the engine's optional `note`, which renders small and separate from the
definition. Latin terms carry their principal parts in the term itself —
`misceō, miscēre, miscuī, mixtum` — so the note is the gender or word class,
not a repeat of the form.

Keep macrons in both the terms and the definitions. They're part of what she's
being tested on, and the quiz compares by exact option match, not by text
entry, so they cost nothing in grading.
