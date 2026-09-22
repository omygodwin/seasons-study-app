# The Tips panel

A **💡 Tips** button sits in the nav on every study topic. It opens a panel with
two audiences:

- **How to study this** — what to do, in her words, short. No citations.
- **For grown-ups** — why the page is built the way it is, what to encourage,
  what to watch for, and the studies behind it.

It opens on the student side every time. The grown-up notes aren't hidden, but
they aren't what she should land on.

## Where things live

| File | What it holds |
|---|---|
| [`src/guidance.js`](../src/guidance.js) | All the content. No React. |
| [`src/Guidance.jsx`](../src/Guidance.jsx) | `GuidanceProvider`, `GuidanceButton` — components only |
| [`src/guidanceContext.js`](../src/guidanceContext.js) | The context and `useGuidanceTab` |

The split between the last two exists because a module that exports both hooks
and components breaks fast refresh, and lint enforces it.

## Content model

```js
GUIDANCE[topicId] = {
  label:   'Math Facts',
  student: ['…', '…'],          // short imperative tips
  parent:  { lead, encourage[], watch[], research[[claim, cite]] },
  tabs:    { practice: {student, parent}, quiz: 'quiz' },
}
```

A `tabs` entry that is a **string** names a shared role in `ROLES` — `cards`,
`quiz`, `notes`, `overview` — so nine flashcard-shaped topics don't each carry
their own copy of "do the whole quiz before checking anything." An **object** is
that tab's own copy, for anything genuinely specific (the Mad Minute, the Print
tab, the qualitative/quantitative drill).

`SHARED` renders underneath the topic content on both sides, so retrieval
practice and spacing are never more than one tap away.

Tab notes are **additive**. A topic with no entry for the current tab still
shows its topic-level guidance.

## Wiring a topic up

1. Add a `GUIDANCE` entry. Without one the button hides itself for that topic —
   that's the intended fallback, not a bug.
2. In the study app, one line next to the tab state:

```js
const [activeTab, setActiveTab] = useState('cards');
useGuidanceTab(activeTab);
```

Topics rendered outside the provider are safe: the default context no-ops.

## The portal is load-bearing

The panel renders through `createPortal(…, document.body)`. It must stay that
way.

The nav that hosts the button carries `backdrop-blur`. `backdrop-filter` makes
an element a **containing block for `fixed`-position descendants**, so a panel
rendered in place resolved `fixed inset-0` against the *nav* — it inherited the
nav's 68px height, painted only its header, and let the page show through where
its body should have been.

The failure is nasty because the DOM looks fine: every string is present and
`innerText` returns all of it. Only geometry reveals it. The browser check
asserts the panel's height equals the viewport's for exactly this reason.

## Writing the content

- **Student tips: under about 20 words.** She will not read a paragraph.
- **Grown-up notes: written to be read once**, not skimmed every session. Say
  what the design is doing and why, not what the buttons are.
- Name the actual finding in "Where this comes from" — the effect size or the
  study — not "research shows".
- American spellings throughout.
- Plain strings, not markdown. The panel renders text.
