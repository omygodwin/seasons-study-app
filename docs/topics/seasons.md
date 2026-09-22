# Earth Science: Seasons

**Raegan** · `src/SeasonsStudyApp.jsx`

Why the seasons happen — axial tilt, solstices and equinoxes, climate zones.
The oldest topic in the repo, and the only one with an interactive simulation.

## Tabs

| Tab | What it does |
|---|---|
| 🃏 Note Cards | Shared [`Flashcards`](../../src/Flashcards.jsx) engine, `theme="sky"` |
| 🔄 Simulation | Four orbital positions, tapped through the year |
| 📝 Quiz | 8 fixed multiple-choice questions |
| 🌍 Overview | The unit in prose |
| 📋 All Notes | Browsable term/definition list |

`STORAGE_KEY` is `flashcards:seasons`.

## Decks

| Deck | Cards |
|---|---|
| 📚 Seasons Basics | 8 |
| 🌎 Earth Facts | 8 |
| 🌡️ Climate Zones | 8 |
| 📅 Seasonal Cycles | 7 |

## The simulation

Four Earth positions around the sun — the two solstices and the two equinoxes
— laid out with CSS `rotate`/`translateY` transforms. Tapping a position (or
its button) selects it and shows that date and what the North Pole is doing:

```js
{ season: 'Summer', date: 'June 21', position: 'Summer Solstice',
  description: 'Longest day in Northern Hemisphere, North Pole tilted toward sun' },
```

The orbit is drawn as a circle and the four stops are evenly spaced, which is
a simplification twice over — the orbit is an ellipse and the stops aren't 90
days apart. Both are fine here and the second is easy to lose sight of: the
point being made is that *tilt* drives the seasons, and a visibly eccentric
orbit would invite exactly the distance explanation the unit is trying to
correct.

Seeing it is not the same as being able to explain it, so the cards and quiz
still ask.

## Its quiz is the odd one out

Every other topic shuffles a larger pool and slices ten. This one renders a
fixed list of 8 questions from `quizQuestions`, in the same order every time,
defined inside the component rather than at module scope.

That's a leftover from before the pattern settled, not a decision. It means
she can learn the answer positions with enough repeats. If you're touching this
file anyway, moving the questions to module scope and shuffling a pool of 20+
down to 10 would bring it in line with the rest — see
[`EgyptStudyApp.jsx`](../../src/EgyptStudyApp.jsx) for the shape.

## History

This app is where the flashcard rewrite was verified, and it's the file that
produced the repo's sharpest gotcha: during the port its `import Flashcards`
line was dropped, and the result **passed lint and passed the build**, failing
only at render with "Flashcards is not defined". See
[CONTRIBUTING.md](../../CONTRIBUTING.md) — click the tabs in a browser.
