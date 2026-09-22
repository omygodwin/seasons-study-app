# Thinking Like a Scientist

**Rose** · Unit 1 · `src/ScienceInquiryStudyApp.jsx` · studied 2026-09-21

Built from photographed classroom notes. The unit covers observation and
inference, qualitative vs. quantitative data, the steps of the scientific
method, metric measurement, and how to write up a lab.

## Tabs

| Tab | What it does |
|---|---|
| 🃏 Note Cards | Shared [`Flashcards`](../../src/Flashcards.jsx) engine, 4 decks |
| ⚖️ Qual or Quant | A sorting drill — each observation goes into one bucket |
| 📝 Practice Test | Sectioned, matches the real test format |
| 📖 Study Sheet | The unit boiled down, for a last read before the test |
| 📋 All Notes | Browsable term/definition list |

`STORAGE_KEY` is `flashcards:scienceinquiry`. No `theme` prop — it uses the
engine's default (teal).

## Decks

| Deck | Cards |
|---|---|
| 🔍 Inquiry Words | 18 |
| ⚗️ Scientific Method | 12 |
| 📏 Measurement | 10 |
| 🧪 Lab Write-Up | 10 |

## The practice test

This is the one topic whose quiz is not a shuffled pile of ten multiple-choice
questions, because the real test isn't one. `QUIZ_BLUEPRINT` builds it section
by section:

```js
const QUIZ_BLUEPRINT = [
  { type: 'tf',    count: 3, heading: 'Part I — True or False' },
  { type: 'mc',    count: 4, heading: 'Part II — Multiple Choice' },
  { type: 'fill',  count: 2, heading: 'Part III — Fill in the Blank' },
  { type: 'short', count: 1, heading: 'Part IV — Short Answer' },
];
```

Ten questions, drawn at random from a 65-question bank but **always in that
mix**. Format matching matters: practice transfers best when the retrieval
format resembles the test (Pan & Rickard, 2018), so a fill-in-the-blank unit
shouldn't be rehearsed entirely through multiple choice.

Each type is graded differently:

- **Multiple choice / true-false** — exact match.
- **Fill in the blank** — `normalize()` strips case, punctuation, and extra
  spacing before comparing against an `accept` array of alternatives. Spelling
  still has to be right; capitalization and a stray period don't cost the point.
- **Short answer** — self-graded. The model answer appears and she marks
  whether she had it. There is no way to auto-grade a sentence, and asking her
  to compare her answer to a good one is itself worth something.

If you add a question to `QUIZ_BANK`, give it a `type` that already exists in
the blueprint — a type with no blueprint entry is dead weight, and a blueprint
section with too few bank questions silently comes up short.

## Qual or Quant

A separate drill because the distinction is what the unit keeps testing and a
flashcard doesn't exercise it. `OBSERVATIONS` holds 16 statements — "the leaf
is bright green", "the race took 12.4 seconds" — shuffled each time through,
and she puts each one in a bucket. Wrong answers name the right kind and move
on; the pattern (a number and a unit means quantitative) is meant to be
noticed rather than stated.

Add pairs, not singles: the list deliberately keeps roughly even counts so she
can't get a good score by guessing one bucket.
