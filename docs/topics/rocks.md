# Rocks & Minerals

**Raegan** · `src/RocksStudyApp.jsx`

The three rock types, the rock cycle, and how minerals are identified. The
largest card set in the repo at 49.

## Tabs

| Tab | What it does |
|---|---|
| 🃏 Note Cards | Shared [`Flashcards`](../../src/Flashcards.jsx) engine, `theme="stone"` |
| 📝 Quiz | 10 questions drawn at random from 20 |
| 📖 Overview | The rock cycle in prose |
| 📋 All Notes | Browsable term/definition list |

`STORAGE_KEY` is `flashcards:rocks`.

## Decks

| Deck | Cards |
|---|---|
| 🪨 Rock Types | 10 |
| 🔄 Rock Cycle | 9 |
| 💎 Minerals | 10 |
| 🔬 Properties | 8 |
| 📋 Rock Examples | 12 |

Five decks of 8–12 is the shape to aim for. 49 cards in one pile would be a
bad session; split into fives, each round is a reasonable sitting and the
engine's Leitner boxes do the rest across days.

## Deck order is a teaching order

The decks are listed the way the unit builds: what rocks *are*, then how they
change into each other, then the minerals inside them, then the tests used to
tell minerals apart, then worked examples. The picker renders them in array
order, so reordering the array reorders the lesson.

"Rock Examples" last is the point — granite and basalt mean more once igneous
and extrusive are already known. It's also the deck that most rewards
`theme="stone"`, since the cards are about things she can hold.

## Properties and the hardness scale

The Properties deck covers streak, luster, cleavage, and Mohs hardness. Those
are procedures, not definitions — a card can carry "what does a streak test
measure" but not the doing of it.

If this unit comes back around, a sorting drill like the one in
[Thinking Like a Scientist](science-inquiry.md) (given a property, name the
test) would fit it better than more cards.
