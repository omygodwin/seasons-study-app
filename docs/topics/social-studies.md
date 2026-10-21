# Social Studies Unit 1

**Rose** · `src/SocialStudiesStudyApp.jsx` · studied 2026-09-24

Built from photographs of her 31-question paper **Unit 1 Study Guide**. It
follows the Virginia SOL US History sequence USI.2–USI.5:

- geographic regions of North America
- Native American groups, archaeology and the three kinds of resources
- European explorers and the Columbian Exchange
- the English colonies and the three colonial regions

The Study Sheet tab is laid out in the same order as the 31 questions.

## Tabs

| Tab | What it does |
|---|---|
| 🃏 Note Cards | Shared [`Flashcards`](../../src/Flashcards.jsx) engine, 4 decks, `theme="amber"` |
| 🗺️ Maps | Regions (new), Rivers and Continents & Oceans (reused), and a printable blank regions map |
| 🎯 Who Am I? | Clue drill: pick the region, tribe, explorer or colonial region it describes |
| 📝 Practice Test | Sectioned Map / Multiple Choice / Fill in the Blank / Short Answer |
| 📖 Study Sheet | The whole study guide in question order |
| 📋 All Notes | Browsable term/definition list |

`STORAGE_KEY` is `flashcards:socialstudies1`. The topic id is
`socialstudies1`, so Unit 2 can sit beside it as `socialstudies2`.

## Decks

| Deck | Cards |
|---|---|
| 🏔️ Regions | 8 |
| 🏹 Tribes | 12 (also archaeology, artifacts and the three resources) |
| ⛵ Explorers | 10 |
| 🏠 Colonies | 14 |

Most cards carry a `note`, a prompt shown on the question face, such as
"Which nation? What did he explore?". It tells her which parts of the answer
the test will want, without giving any of them away.

## Where the content differs from her paper sheet

Some answers on her paper sheet are her first drafts. Where the teacher
corrected one, the app follows the correction. Where an answer was thin, the
app fills it in with the standard SOL answer:

- **Massachusetts Bay** was settled by the **Puritans**. She first wrote
  "debtors"; debtors belong to Georgia.
- The **Pueblo** and **Iroquois** farmed corn, beans and squash. Her chart
  said "not much" food for the Pueblo, and only hunting and fishing for the
  Iroquois.
- **Middle-colony economy**: grain and livestock (the "breadbasket").
  Fishing belongs to New England, and New England is the teacher's
  "production / industry" note.
- **Coronado** was looking for the Seven Cities of Gold.

Some of her class notes are kept even though a textbook might say otherwise,
because the teacher writes the test:

- **Tornado Alley** is listed under the Interior Lowlands, as in her notes.
  Textbooks more often put it on the Great Plains.
- **Rocky Mountains: "terrible flooding"** is kept, worded as flooding when
  the snow melts.
- **"All animals are sacred"** is the teacher's starred note on the Native
  American chart. It appears on the Study Sheet only.

One thing is still open:

- **Kwakiutl housing.** Her handwriting is unclear. A parent read it as
  "bungalows"; the app says **cedar plank houses**, the standard answer. If
  the teacher really did teach "bungalows", add it as an extra accepted answer
  rather than replacing plank houses.

## The maps

### Regions map (new)

This is question 3 on her sheet: the eight regions, tapped crayon-first in the
same way as the [Maps & Rivers](geography.md) maps.

- `REGIONS` is in the **worksheet's number order**: 1 Coastal Range, 2 Basin
  and Range, 3 Rocky Mountains, 4 Great Plains, 5 Interior Lowlands,
  6 Appalachian Mountains, 7 Coastal Plain, 8 Canadian Shield. The printable
  map's numbers and key come from that order, so keep it.
- `src/data/regionPaths.js` is **generated** by `scripts/gen_regions.py`, so
  don't hand-edit it. The regions are hand-drawn outlines clipped to real
  coastlines, and the boundaries are a classroom generalisation drawn to match
  her worksheet's map. See [`scripts/README.md`](../../scripts/README.md).

### Rivers and world maps (reused)

These are the same components as Maps & Rivers, not copies:

- `GeographyStudyApp.jsx` exports `RiverMap`, `WorldMap`, `Pill`,
  `CrayonChip`, `Toolbar` and `Feedback`.
- The feature lists `RIVERS`, `CONTINENTS` and `OCEANS` live in
  `src/data/mapFeatures.js`. Exporting arrays from a component file trips the
  fast-refresh lint rule.

A change to either map shows up in both topics. Map progress is held in
`SocialStudiesStudyApp` itself, so it survives switching tabs, and it is
separate from the progress on the Maps & Rivers page.

## The practice test

The teacher only said the test mixes map, multiple choice, fill in the blank
and short answer, so the practice test does too:

```js
const QUIZ_BLUEPRINT = [
  { type: 'map',   count: 3, heading: 'Part I — Map' },
  { type: 'mc',    count: 3, heading: 'Part II — Multiple Choice' },
  { type: 'fill',  count: 2, heading: 'Part III — Fill in the Blank' },
  { type: 'short', count: 2, heading: 'Part IV — Short Answer' },
];
```

- **Map questions are generated, not written.** `MAP_QUESTIONS` is built from
  the map data: 8 regions, 7 rivers, 7 continents and 4 oceans. Each test
  draws one region, one river, and one continent or ocean, shown highlighted
  on a small map with four name choices.
- **The bank** holds 57 multiple-choice, 35 fill-in-the-blank and 19
  short-answer questions. Fill-in uses the same `normalize()` as Thinking Like
  a Scientist: it forgives case and punctuation, but not spelling. Short
  answers are self-graded against a model answer.
- **Adding a question:** use a `type` that is already in the blueprint, or it
  will never be asked.

## Who Am I?

The drill has 58 clues in four groups: regions, tribes, explorers and
colonial regions. The buttons are every answer in the clue's group.

It is **mixed by default**, which is the opposite of the note cards.
Telling the Great Plains from the Interior Lowlands, or the Lakota from the
Iroquois, is a discrimination task, and that is where interleaving helps. See
[learning-design.md](../learning-design.md). The group filter is there for a
blocked pass first.

When adding clues, keep each group roughly balanced, so that guessing the
most common answer doesn't pay.
