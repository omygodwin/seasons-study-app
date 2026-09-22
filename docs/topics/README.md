# Study topics

One file per topic. Each covers what the topic teaches, how its tabs are put
together, and anything non-obvious about editing it.

| Topic | Child | File | Tabs | Cards |
|---|---|---|---|---|
| [Thinking Like a Scientist](science-inquiry.md) | Rose | `ScienceInquiryStudyApp.jsx` | Note Cards · Qual or Quant · Practice Test · Study Sheet · All Notes | 50 |
| [Maps & Rivers](geography.md) | Rose | `GeographyStudyApp.jsx` | Rivers · World · Facts · Quiz · Print | — |
| [Vocab Words](vocab.md) | Rose | `VocabStudyApp.jsx` | Note Cards · Quiz · Word List | 22 |
| [Math Facts](math-facts.md) | Ruth | `MathFactsStudyApp.jsx` | Practice · Mad Minute · Progress · Tables | — |
| [Earth Science: Seasons](seasons.md) | Raegan | `SeasonsStudyApp.jsx` | Note Cards · Simulation · Quiz · Overview · All Notes | 31 |
| [Ancient Egypt](egypt.md) | Raegan | `EgyptStudyApp.jsx` | Note Cards · Quiz · Overview · All Notes | 21 |
| [Rocks & Minerals](rocks.md) | Raegan | `RocksStudyApp.jsx` | Note Cards · Quiz · Overview · All Notes | 49 |
| [Latin Vocab](latin-vocab.md) | Raegan | `LatinVocabStudyApp.jsx` | Note Cards · Quiz · Word List | 23 |
| [Middle Ages](middle-ages.md) | Raegan | `MiddleAgesStudyApp.jsx` | Note Cards · Quiz · Overview · All Notes | 39 |

Every topic except Maps & Rivers and Math Facts renders its cards through the
shared [`Flashcards.jsx`](../../src/Flashcards.jsx) engine. Before changing how
any of them practices, read [learning-design.md](../learning-design.md) — several
behaviors that look like bugs are deliberate.

## Adding a topic

1. Create `src/FooStudyApp.jsx`, mirroring `VocabStudyApp.jsx` for a
   cards-and-quiz topic or `ScienceInquiryStudyApp.jsx` for one with a
   sectioned practice test.
2. Give it a unique `STORAGE_KEY` of the form `flashcards:foo`. **Two topics
   sharing a key merge their review schedules.**
3. Add `{ id, label, emoji, date }` to the right child's array in `App.jsx`,
   where `date` is the `YYYY-MM-DD` the unit was studied.
4. Add the `{studyTopic === 'foo' && <FooStudyApp />}` render branch, and the
   `import`.
5. Open it in a browser and click every tab. `npm run lint` and `npm run build`
   both pass on a missing component import — see [CONTRIBUTING.md](../../CONTRIBUTING.md).
