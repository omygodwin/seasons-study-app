# Maps & Rivers

**Rose** · `src/GeographyStudyApp.jsx` · studied 2026-09-03

Continents, oceans, and the major rivers. The only topic with no flashcards —
map knowledge is spatial, so it's practiced by coloring and labeling rather
than by term-and-definition cards.

## Tabs

| Tab | What it does |
|---|---|
| 🏞️ Rivers | Pick a crayon, then find that river on the map |
| 🌍 World | Same, for the seven continents and five oceans |
| 📖 Facts | One line per continent, ocean, and river |
| 📝 Quiz | 10 questions drawn from a 20-question pool |
| 🖨️ Print | Blank uncolored maps to print and fill in by hand |

## The coloring interaction

Both map tabs work the same way, and the order matters: she picks a named
**crayon chip** first, then taps the feature she thinks it belongs to. That
makes it a retrieval attempt — she has to locate the Missouri from the name —
rather than a labeling exercise where tapping a shape reveals its answer.

Tapping the map with no crayon selected says so instead of naming the feature.
Two escape hatches sit in the toolbar:

- **Hints** — tapping a feature now names it, turning the exercise around for a
  child who is stuck. Off by default.
- **Reveal** — fills in the rest, for checking work.

Progress is per feature and a correct match is permanent; a wrong one flashes
and leaves the crayon selected so she can try again.

## Map data is generated — don't hand-edit it

`src/data/mapPaths.js` is built from Natural Earth data by
`scripts/gen_maps.py`. Regenerate it rather than editing; see
[`scripts/README.md`](../../scripts/README.md) for how, and for why the world
`viewBox` is inset the way it is.

## How the maps are built

The maps are SVG, but **the labels and ocean tap-targets are HTML**, absolutely
positioned over the SVG as a percentage of the `viewBox`. If they were SVG
`<text>` they would scale down with the drawing and become unreadable at phone
width; as HTML they hold their size while the map shrinks around them.

Rivers get the same treatment from the other direction:

- `vector-effect="non-scaling-stroke"` keeps the line a constant weight
  regardless of zoom.
- Each river also carries a **wide transparent hit stroke** underneath the
  visible one. A 2px river is not tappable with a finger; a 20px invisible
  stroke on the same path is.

If you add a river and it draws but won't respond to taps, the hit stroke is
what's missing.

## Progress lives in the parent

Map progress is held in `GeographyStudyApp` itself, **not** in the individual
tab components. That is deliberate: tab components unmount when you switch
tabs, so state kept there would wipe her coloring every time she checked the
Facts tab.

## The Print tab

Renders blank, uncolored maps for printing — the paper version of the same
exercise, which is what her worksheets look like.

Print rules live in [`src/index.css`](../../src/index.css). Anything that
shouldn't appear on paper takes `className="no-print"`, including the whole
nav in `App.jsx`. If you add chrome around the maps, add the class.
