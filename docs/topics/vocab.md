# Vocab Words

**Rose** · `src/VocabStudyApp.jsx` · studied 2026-04-22

A single-deck vocabulary topic — 22 words with definitions. The simplest study
app in the repo, and the one to copy when starting a new cards-and-quiz topic.

## Tabs

| Tab | What it does |
|---|---|
| 🃏 Note Cards | Shared [`Flashcards`](../../src/Flashcards.jsx) engine, `theme="purple"` |
| 📝 Quiz | 10 questions from a generated pool |
| 📋 Word List | Browsable term/definition list |

`STORAGE_KEY` is `flashcards:vocab`.

## One deck means no deck picker

```js
const DECKS = [{ id: 'vocab', label: 'Vocab Words', emoji: '📚', cards: VOCAB }];
```

The engine hides its picker entirely for a single-deck topic, so this renders
as one clean round with no chrome. You still pass `decks` as an array.

## The quiz is generated, not written

`buildQuizPool()` derives two questions from every word:

- "What does *X* mean?" — the term, four definitions
- "Which word means *Y*?" — the definition, four terms

Distractors are drawn at random from the other words in the list, so 22 words
give a 44-question pool and a fresh set of wrong answers each time. Ten are
drawn per quiz.

Both directions matter. Recognizing a definition when you're shown the word is
easier than producing the word from its meaning, and a test asks for both.

The pool is built once via `useMemo`, so the distractors stay stable for the
life of the mount — reshuffling them mid-quiz would change the question under
her.

## Adding words

Append to `VOCAB` as `{ term, definition }`. The deck, the word list, and both
quiz directions all pick it up with no other change.
