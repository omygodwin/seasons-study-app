/* Content for the "Tips" panel (see Guidance.jsx).
 *
 * Two audiences, deliberately separated:
 *
 *   student  — what to DO, in her words, short. No citations, no jargon.
 *   parent   — why this page is built the way it is, what to encourage, what
 *              to watch for, and the actual studies. Written to be read once,
 *              not skimmed every session.
 *
 * SHARED applies everywhere and renders under the topic-specific part, so the
 * two habits that carry the most evidence are never more than one tap away.
 * Per-tab notes are optional and only exist where a tab genuinely wants
 * different behavior from its neighbors.
 *
 * Everything here is prose, not markdown — the panel renders plain strings.
 * Keep student tips under ~20 words each; she will not read a paragraph. */

export const SHARED = {
  student: [
    'Try to answer before you look. Getting it wrong and then seeing the answer beats reading it twice.',
    'If it feels easy, check that you are remembering it and not just recognizing it. Cover the answer first.',
    'Say the answer out loud in your own words before you check.',
    'Short goes further than long. Ten minutes today and ten tomorrow beats half an hour tonight.',
    'When you finish, stop. The gap until next time is doing part of the work.',
  ],
  parent: {
    lead:
      'Of ten common study techniques reviewed by Dunlosky and colleagues, only two rated high utility: retrieval practice (being made to recall) and distributed practice (spreading it across days). Everything in this app is built to serve one of those two.',
    points: [
      ['Quizzing is not checking up on her — it is the studying.',
        'Tests were taught to us as measurement. The act of retrieving an answer is itself the strongest single study technique available, stronger than any amount of reviewing.'],
      ['Re-reading and highlighting feel productive and mostly are not.',
        'Both rated lowest utility, and highlighting can leave students worse on inference questions than reading plainly. They create fluency, which we misread as knowing.',],
      ['Spacing beats cramming by a wide margin, and a clever schedule adds nothing.',
        'Spaced beat massed retrieval at g = 0.74. Expanding intervals beat uniform ones by g = 0.034 — i.e. nothing. Plain little-and-often is the whole trick.'],
      ['The effective methods feel worse while working better.',
        'Struggling to recall is the mechanism, not a sign it is going badly. Expect her to prefer re-reading, and expect it to teach her less.'],
      ['Praise the process, not the ability.',
        '"You worked at that" holds up after a failure in a way "you are so smart" does not — person praise produces helpless responses when the next thing is hard.'],
    ],
    more: 'The full write-up, including what was overturned since the 1990s, is in docs/learning-design.md in this project.',
  },
};

/* Tab notes shared by every flashcard-shaped topic, keyed by the role a tab
 * plays rather than its id, so nine topics do not each carry a copy. */
export const ROLES = {
  cards: {
    student: 'Flip only after you have tried to say it. "Almost" and "Study again" bring the card back — that is the point, not a penalty.',
    parent:
      'Cards are blocked by deck rather than mixed, on purpose: interleaving measures negative for term-and-definition material. The "Mix It Up" option is for once a topic is mostly Strong. A missed card asks her to put it in her own words; a known card does not, because writing up all fifty is the trap where the time goes into making cards instead of retrieving from them.',
  },
  quiz: {
    student: 'Do the whole thing before checking anything. A question you get wrong now is one you are far less likely to get wrong on the test.',
    parent:
      'Ten questions drawn fresh from a larger pool each time, so a repeat is a real retrieval attempt rather than a remembered answer position. Let her finish and score at the end; correcting mid-quiz turns it back into reading.',
  },
  notes: {
    student: 'This is the list to look over BEFORE the cards, or to settle an argument after. It is not studying on its own.',
    parent:
      'Deliberately on its own tab. A term sitting next to its definition is the thing that makes flashcards feel productive while teaching much less, so it is never shown under the cards.',
  },
  overview: {
    student: 'Read this once at the start, then go do the cards. Reading it again later will feel useful and mostly will not be.',
    parent:
      'One pass here to build the shape of the unit, then retrieval. If she wants to "go over it again", steer her to the cards or the quiz instead — that is the substitution with the most evidence behind it.',
  },
};

/* topic id -> guidance. `tabs` maps this topic's own tab ids to a ROLES key or
 * to its own {student, parent} pair. */
export const GUIDANCE = {
  mathfacts: {
    label: 'Math Facts',
    student: [
      'Aim to just know it. If you are counting up to get there, that one is not learned yet.',
      'Read the sign before you answer — rounds mix × and ÷ on purpose.',
      'When a tip appears, use that route next time. It is faster than counting.',
      'Missing one is fine. It comes straight back so you get another go.',
    ],
    parent: {
      lead:
        'This app is about automatic retrieval, not recognition, which is why it does not use the flashcard engine. A fact counts as fluent only when it is answered correctly AND inside three seconds — a fact she reaches by skip-counting is not learned yet, so speed is part of the state rather than a statistic.',
      encourage: [
        'Ask her which trick she used, not whether she was fast. Fluency is a reasoning strategy that became automatic, not a lookup that was memorized.',
        'Let the Mad Minute be a race against her own last score. It reports her personal best and nothing else on purpose.',
        'Four short goes across a week beat one long one. The app schedules facts back at 1, 3, 7 and 16 days and that only works if she opens it across days.',
        'If her class is on one table this week, narrow Practice to it with the number picker — then put it back to All, because the spacing only pays off across the whole set.',
      ],
      watch: [
        'Fingers, whispering, or a long pause means skip-counting. The app already treats that as "getting it" rather than fluent — back it up by naming the strategy rather than asking for speed.',
        'Timed drills and math anxiety are genuinely contested in the literature. The Mad Minute exists because she already does one at school; if it upsets her, use Practice instead, which is untimed in feel and corrects immediately.',
      ],
      research: [
        ['Fifth-grade fractions and division predict high-school algebra', 'Siegler et al. (2012), controlling for IQ, working memory, income — and whole-number multiplication'],
        ['Mixing × and ÷ is worth doing', 'Rohrer et al. (2020), randomized trial, 787 students, d = 0.83 for interleaved math practice'],
        ['Division belongs with multiplication', 'CCSS 3.OA.C.7 asks for fluency via the inverse: knowing 8 × 5 = 40 means knowing 40 ÷ 5'],
      ],
    },
    tabs: {
      practice: {
        student: 'This one tells you straight away if you are right. That is where the learning happens. Use "Which numbers?" if you only want to drill your 12s.',
        parent: 'Rounds are mostly facts she already has with at most two new ones folded in. When a round runs short it pads with known facts, never more new ones. The number picker narrows a round to chosen tables — useful the week her class is on one of them, but the default of everything is what keeps the spacing working, so switch it back afterwards. These settings belong to Practice; the Mad Minute keeps its own.',
      },
      mad: {
        student: 'One minute, no hints until the end — same as the sheet at school. Stuck on one? Tap Skip and keep going; skips do not count against you. Set × or ÷ here separately from Practice.',
        parent: 'Silent for the full minute by design. It exists to rehearse the timed sheet she already sits at school, and a drill she has met at home is a smaller event than one she has not. Adding live feedback would make it a different exercise. Skip is the paper sheet\u2019s "come back to it" — a skipped problem is not recorded as wrong, because she did not answer it, and scoring it against her would teach her to guess rather than move on. Its mode and numbers are set separately from Practice, so you can keep the minute matching whatever sheet she actually gets at school while Practice works on something else.',
      },
      progress: {
        student: 'Green means fast and right. The × grid is symmetric because 7 × 8 and 8 × 7 are one thing to learn.',
        parent: 'The ÷ grid is deliberately not symmetric — 56 ÷ 7 and 56 ÷ 8 are two facts. A faint dot means that division fact has not unlocked yet, because its times fact is not fluent.',
      },
      tables: {
        student: 'For a look over before a round, not for staring at. Each line shows its division facts too.',
        parent: 'Fact families are shown inline because that is the leverage: one known product hands her two division facts almost free.',
      },
    },
  },

  scienceinquiry: {
    label: 'Thinking Like a Scientist',
    student: [
      'The practice test is built like the real one — true/false, multiple choice, fill in the blank, then short answer.',
      'On the sorting drill, look for a number and a unit. That is what makes an observation quantitative.',
      'For short answer, write it out properly before you reveal the model answer. Marking yourself honestly is the useful part.',
    ],
    parent: {
      lead:
        'The practice test is sectioned to match the real one rather than being ten shuffled multiple-choice questions. That is deliberate: practice transfers best when the retrieval format resembles the test, so a unit assessed with fill-in-the-blank should not be rehearsed entirely through multiple choice.',
      encourage: [
        'Let her self-grade the short answer against the model. Comparing her wording to a good answer is worth more than the mark.',
        'The qualitative/quantitative drill is a discrimination task, which is exactly where mixing helps — do not let her sort one bucket at a time.',
      ],
      watch: [
        'Fill-in-the-blank forgives case and punctuation but not spelling, which is intentional. If she is losing points to spelling, that is information, not a bug.',
      ],
      research: [
        ['Practice should match the test format', 'Pan & Rickard (2018) on transfer of retrieval practice'],
        ['Low-stakes quizzing reduces test anxiety', 'It is frequent high-stakes testing that raises it'],
      ],
    },
    tabs: { cards: 'cards', quiz: 'quiz', notes: 'notes', overview: 'overview',
      sort: {
        student: 'Sort each one, then check. If you get it wrong, look for whether there was a number in it.',
        parent: 'A separate drill because the distinction is what the unit keeps testing and a flashcard does not exercise it. It names the right answer rather than explaining the cue — the pattern is meant to be noticed.',
      },
    },
  },

  geography: {
    label: 'Maps & Rivers',
    student: [
      'Pick the crayon first, then find it on the map. That way you are remembering where it is, not just reading a label.',
      'Turn Hints on only when you are properly stuck. Finding it the hard way is what makes it stick.',
      'The Print tab gives you a blank map. Filling one in from memory on paper is the best test there is.',
    ],
    parent: {
      lead:
        'The crayon-first order is the whole design. Tapping a shape to reveal its name would be labelling; picking "Missouri" and then having to locate it is a retrieval attempt. Map knowledge is spatial, which is why this topic has no flashcards.',
      encourage: [
        'Print a blank map and have her fill it in from memory. Free recall on paper is a harder and better test than tapping.',
        'Ask her to say where something is relative to something else — rivers and continents are learned as a network, not a list.',
      ],
      watch: [
        'Hints turn the exercise around so tapping names the feature. Useful when she is stuck, counterproductive as a default.',
      ],
      research: [
        ['Retrieval beats review, including for spatial material', 'The testing effect is not limited to verbal recall'],
      ],
    },
    tabs: {
      rivers: {
        student: 'Pick a crayon first, then hunt for its river. Naming it after you tap would be reading, not remembering.',
        parent: 'Rivers are learned as a network rather than a list. Ask her where one sits relative to another rather than for the name alone.',
      },
      world: {
        student: 'Same as rivers: choose the color, then find it. Oceans count too.',
        parent: 'Seven continents and five oceans. Tapping with no crayon chosen deliberately refuses to name the feature, which is what keeps this a retrieval attempt.',
      },
      print: {
        student: 'Print it and fill it in with a pencil. No tapping, no hints.',
        parent: 'The paper version is the harder test and the closest match to what a school worksheet asks for.',
      },
      quiz: 'quiz', facts: 'notes',
    },
  },

  vocab: {
    label: 'Vocab Words',
    student: [
      'Say the meaning out loud before you flip. Thinking "I know that one" is not the same as saying it.',
      'The quiz asks both ways round — word to meaning and meaning to word. The second is harder and matters more.',
    ],
    parent: {
      lead:
        'A single deck, so the engine hides its picker and this is one clean round. The quiz generates both directions from the word list: recognizing a definition when shown the word is easier than producing the word from its meaning, and a test asks for both.',
      encourage: [
        'Use the words in conversation the same day. Nothing in the app can do that part.',
        'When she writes a missed word in her own words, leave her wording alone even if it is clumsy. The boxes are the app’s state; the notes are hers.',
      ],
      watch: [],
      research: [
        ['Generation and self-explanation help, on the cards she missed', 'Doing it for all fifty is the opportunity-cost trap'],
      ],
    },
    tabs: { flashcards: 'cards', quiz: 'quiz', list: 'notes' },
  },

  latin: {
    label: 'Latin Vocab',
    student: [
      'Principal parts count. Say the whole entry, not just the first word.',
      'Filtering to one lesson makes the quiz easier, because the wrong answers come from fewer words. Use All Lessons before a test.',
    ],
    parent: {
      lead:
        'Decks are built from the lesson field, and the lesson filter narrows the word list, the quiz, and the quiz’s distractors together. A single-lesson quiz is therefore noticeably easier than All Lessons — worth knowing when a score looks good.',
      encourage: [
        'Study one lesson blocked the night it is assigned, then switch to All Lessons as the test approaches.',
      ],
      watch: [
        'Scores are not comparable across filter settings.',
      ],
      research: [
        ['Blocked first for new material, mixed once it is solid', 'Hwang (2025) on blocked practice for new declarative knowledge in younger learners'],
      ],
    },
    tabs: { flashcards: 'cards', quiz: 'quiz', list: 'notes' },
  },

  seasons: {
    label: 'Earth Science: Seasons',
    student: [
      'The seasons come from the tilt, not from how close we are to the sun. That is the one everyone gets wrong.',
      'Step through the simulation once, then go and explain it to someone without looking.',
    ],
    parent: {
      lead:
        'The simulation exists to correct one specific misconception — that seasons come from distance to the sun — which most people leave school still believing. The orbit is drawn as a circle on purpose: a visibly elliptical one would invite exactly that explanation.',
      encourage: [
        'Ask her to explain it out loud. Having watched the animation is not the same as being able to say why, and the cards and quiz are what check the difference.',
      ],
      watch: [
        'This topic’s quiz is a fixed set of eight questions in the same order every time, unlike the others. She can learn the answer positions, so treat a high score here with more caution.',
      ],
      research: [
        ['Explaining it yourself beats watching it again', 'Self-explanation measures around g = 0.55'],
      ],
    },
    tabs: { cards: 'cards', quiz: 'quiz', notes: 'notes', overview: 'overview',
      simulation: {
        student: 'Tap through all four positions, then close it and say what happens at each one.',
        parent: 'Four stops, evenly spaced. The tilt is the variable; the distance deliberately is not.',
      },
    },
  },

  egypt: {
    label: 'Ancient Egypt',
    student: [
      'Four small decks beats one big pile. Finish one before starting another.',
      'The Periods deck is only three cards — good for a quick warm-up, not a whole session.',
    ],
    parent: {
      lead:
        'Twenty-one cards split across four decks. The split is what makes it work: four short blocked rounds beat one long undifferentiated pile, particularly for material this is.',
      encourage: [
        'Ask "why" questions the cards do not — why the Old Kingdom ended, why the Nile mattered. The quiz is hand-written for that reason and does not derive from the cards.',
      ],
      watch: [
        'The quiz draws ten from only sixteen, so she sees most of the bank every time and the reshuffle does less than it looks like.',
      ],
      research: [
        ['Blocked practice first for new declarative knowledge', 'Hwang (2025)'],
      ],
    },
    tabs: { cards: 'cards', quiz: 'quiz', notes: 'notes', overview: 'overview' },
  },

  rocks: {
    label: 'Rocks & Minerals',
    student: [
      'Do the decks in order. Rock Examples makes much more sense once you have Rock Types and the Cycle.',
      'Forty-nine cards is too many in one go. One deck at a sitting.',
    ],
    parent: {
      lead:
        'The largest card set here, split into five decks of eight to twelve. Deck order is a teaching order: what rocks are, how they change, the minerals inside them, the tests that tell minerals apart, then worked examples.',
      encourage: [
        'Hand her an actual rock. The Properties deck covers streak, luster, cleavage and hardness, which are procedures a card can name but not rehearse.',
      ],
      watch: [],
      research: [
        ['Spacing across days is what moves this much material', 'Spaced beat massed retrieval at g = 0.74'],
      ],
    },
    tabs: { cards: 'cards', quiz: 'quiz', notes: 'notes', overview: 'overview' },
  },

  middleages: {
    label: 'Middle Ages',
    student: [
      'The Events deck is dates, and dates only stick if you come back to them across several days.',
      'This quiz has the biggest question pool, so a repeat is a real test rather than a remembered answer.',
    ],
    parent: {
      lead:
        'Thirty questions with ten drawn — the best ratio of any topic here, so repeats stay genuine retrieval attempts. The Events deck is fourteen cards of chronology, which is the hardest material in the app to hold.',
      encourage: [
        'Dates have no internal logic to reconstruct from, so this deck depends almost entirely on spacing. It pays off only if she opens it across several days rather than the night before — worth saying to her out loud, because the app cannot enforce it.',
      ],
      watch: [],
      research: [
        ['Distributed practice is the whole mechanism for arbitrary material', 'Latimier, Peyre & Ramus (2021)'],
      ],
    },
    tabs: { cards: 'cards', quiz: 'quiz', notes: 'notes', overview: 'overview' },
  },
};

/* Resolve a topic + tab into what the panel should show. A tab entry that is a
 * string names a ROLES key; an object is the tab's own copy. */
export function guidanceFor(topic, tab) {
  const t = GUIDANCE[topic];
  if (!t) return null;
  const raw = tab && t.tabs ? t.tabs[tab] : null;
  const tabNote = typeof raw === 'string' ? ROLES[raw] : raw;
  return { topic: t, tabNote: tabNote || null };
}
