# Why practice behaves the way it does

Several things in this repo look like bugs and are not. This is the file that
says which, and why. **Read it before changing how practice works** — most of
these were arrived at by reading the evidence, and two of them were arrived at
by getting it wrong first.

The short version: the two study techniques with by far the strongest evidence
behind them are **retrieval practice** (being made to recall something) and
**distributed practice** (spreading that across days). Dunlosky et al. (2013)
rated only those two "high utility" out of ten common techniques, and the
verdict has held. Everything below serves one of those two, or protects them.

---

## The flashcard engine (`src/Flashcards.jsx`)

### The answer is never next to the term on a study tab

The browsable term-and-definition list lives on its own **All Notes** tab.
Under the cards it would be actively harmful: reading a term beside its answer
builds familiarity, which *feels* like learning and produces much less of it.

This was the original bug that prompted the rewrite — every study app printed
the full list directly under the flashcard.

Grade buttons also don't render until the answer has been revealed, so a card
can't be rated without an attempt.

### Scheduling persists across days

Leitner boxes at **1 / 3 / 7 / 16 days**, saved to `localStorage`. The old
implementation held Known/Review sets in component state, which meant they
were discarded on every reload and nothing was ever actually scheduled.

Spacing is the single largest effect in this literature — spaced beat massed
retrieval at **g = 0.74** (Latimier, Peyre & Ramus, 2021). It does nothing at
all if it resets when the page reloads.

That same analysis found expanding intervals beat uniform ones by g = 0.034 —
nothing. **A fancier scheduling algorithm is not worth building.** The plain
ladder performs as well as anything clever.

### Rounds are blocked by deck; mixing is opt-in

This was reversed once and put back deliberately. Don't "fix" it.

Interleaving measures g = 0.42 overall, but the moderators run the other way
for this material. Brunmair & Richter (2019), across 59 studies, found
interleaving best for visual categories (g = 0.67) and estimated a **negative**
effect for verbal material — which is exactly what term-and-definition cards
are. Hwang (2025) found blocked practice first matters for new declarative
knowledge in younger learners, where interleaving acts as an "undesirable
difficulty."

"Mix It Up" sits last in the deck picker with a line saying to use it once a
topic is mostly Strong.

**This is the opposite of the call in Math Facts, and both are right.** See
[Interleaving cuts both ways](#interleaving-cuts-both-ways) below before
changing either one to match the other.

### A card only leaves the round when graded "Knew it"

"Almost" and "Study Again" requeue it, so every round ends on successful
recall.

### Only a missed card asks for her own words

A card graded "Almost" or "Study Again" prompts her to put the answer in her
own words. That is the generation effect plus self-explanation (g ≈ 0.55),
layered onto the retrieval she just attempted.

It is deliberately **not** offered on cards she knew. Writing up all fifty is
the opportunity-cost trap the flashcard-creation research warns about, where
the time goes into making cards instead of retrieving from them.

Her wording persists as `cards[id].own`, shows under the real definition on the
**answer face only** — never the question face, which would give it away — and
survives both a regrade and a progress reset. The boxes are the app's state;
the notes are hers.

---

## Interleaving cuts both ways

The two practice engines in this repo make **opposite** calls on mixing, on
purpose. If you only read one of them you will "fix" the other and make it
worse.

| | Flashcards | Math Facts |
|---|---|---|
| Material | Terms and definitions | Multiplication and division facts |
| Default | **Blocked** by deck | **Mixed** by operation |
| Evidence | g ≈ **negative** for verbal material (Brunmair & Richter, 2019) | **d = 0.83** (Rohrer et al., 2020, RCT, 787 students) |

Interleaving is not one effect. Brunmair & Richter's 59-study meta-analysis
found the moderator that matters is *what kind of material*: interleaving was
best for visual categories (g = 0.67) and estimated **negative** for verbal
term-and-definition material. Rohrer's randomized trial, on maths problems in
real classrooms, found one of the larger effects in the literature.

The mechanism explains the split. Interleaving helps when the hard part is
**discriminating** — working out *which* rule or operation applies. A maths
round mixing `7 × 8` and `56 ÷ 8` forces her to read the sign and choose.
Mixing a Latin deck into an Egypt deck forces no such choice: the task is
already "produce the definition," so the mixing adds interference without
adding a decision.

The practical test for any new practice mode in this repo: **does mixing
create a decision the learner would not otherwise have to make?** If yes,
mix. If it only shuffles the order of the same task, block.

Note that this also means Math Facts' own rounds were *not* interleaved
before division existed — they mixed facts, but every question was still
"multiply these two numbers." Adding division is what made the mixing real.

---

## Math facts (`src/MathFactsStudyApp.jsx`)

Fact fluency is a different problem from recognition, which is why this app
does not use the flashcard engine.

### Fluent means correct *and* under 3 seconds

A fact she reaches by skip-counting is not learned yet. The target is
automatic retrieval, so response time is part of the state rather than a
statistic. Accuracy is still tracked first — nothing is pushed for speed on a
fact she is getting wrong.

### 7×8 and 8×7 are one fact

State keys on the sorted pair, so 1–12 is **78 facts, not 144**. Both orders
are still shown, which is how the pairing gets noticed. The Progress grid is
symmetric for this reason — that is correct, not a rendering bug.

### Division is gated on the multiplication

A division fact only enters the pool once its multiplication pair is fluent.
That gate is the entire argument for having division here: CCSS 3.OA.C.7 asks
for fluency via the inverse — "knowing that 8 × 5 = 40, one knows 40 ÷ 5 = 8"
— so once the product is automatic, the division is nearly free. Met cold it
is just another unknown, and the leverage disappears.

Division is also where the value is. [Siegler et al. (2012)](https://journals.sagepub.com/doi/abs/10.1177/0956797612440101)
found fifth-grade knowledge of **fractions and division** predicts high-school
algebra and overall achievement five to six years later, controlling for IQ,
working memory, family income and education — *and for whole-number
multiplication*. Multiplication is the variable they controlled away. It is
necessary infrastructure, not a predictor, which is why more multiplication
drill was the wrong thing to add.

Division is **not** commutative, so the pair model splits: 78 multiplication
facts (7×8 and 8×7 are one) but 144 division facts (56÷7 and 56÷8 are two,
and a square like 64÷8 is one). Keys are namespaced `m:` and `d:`; storage
migrates v1 → v2 rather than resetting, because her multiplication progress is
exactly what unlocks the new material.

### Strategy hints, only where she is slow

Fluency is meant to be a reasoning strategy that became automatic, not a
lookup that was memorized — Bay-Williams and Kling's phases run counting →
derived strategies → mastery. A right-but-slow answer is the signature of
skip-counting, so that is where the derived route is shown:

> 9 × 7 — One less than ten times. 10 × 7 = 70, take away one 7 → 63.

Shown on a miss and on a slow-but-correct answer. **Never on a fast correct
answer**, where it is pure noise on a fact she already has. Every multiplier
1–12 except 7 has a rule; 7 × 7 falls through to the squares case, so every
pair resolves to something concrete.

For division the hint is always the inverse, because that is the strategy:
"what times 8 makes 56?"

### Rounds are incremental rehearsal

Mostly material she already has, with at most two unseen facts folded in.
Drilling a pile of unknowns at once is the usual way fact practice fails.

**When a round comes up short it pads with known facts, never with more new
ones.** Both bugs found in review lived here:

- A cold start produced a *two-question* round, because the new-fact cap fired
  with nothing to interleave against.
- A warm state with nothing due padded the round with *nine* brand-new facts,
  because the threshold asked "did this round pull enough?" instead of "does
  she have a known base?"

If you touch `buildRound`, re-check all four states: cold start,
known-but-nothing-due, some-due, everything-fluent.

### The Mad Minute stays silent

No feedback for the full sixty seconds; it scores at the end. It exists to
rehearse the timed sheet she does daily at school, and a drill she has already
met at home is a smaller event than one she has not. Classroom retrieval
practice tends to *reduce* test anxiety when it is low-stakes.

Adding live feedback would make it a different exercise. Practice mode is
where immediate correction belongs.

### Self-competition, not comparison

The Mad Minute shows her score against her own previous best. No leaderboard,
no target she is failing to hit.

---

## Things deliberately not built

- **Highlighting-style features.** Rated lowest-utility, and shown to *hurt*
  performance on inference questions.
- **Re-read prompts.** Same category. The fix for "I didn't get that" is to
  close it and try to say it, not to read it again.
- **A cleverer spacing algorithm.** See above — worth g = 0.034.
- **Learning-style settings.** The idea that matching instruction to a stated
  style improves outcomes has been tested repeatedly and not found.

---

## Sources

- Dunlosky, Rawson, Marsh, Nathan & Willingham (2013), *Improving Students'
  Learning With Effective Learning Techniques* — the review that rated the ten
  techniques
- [Latimier, Peyre & Ramus (2021)](https://link.springer.com/article/10.1007/s10648-020-09572-8) — spacing meta-analysis
- [Brunmair & Richter (2019)](https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf) — interleaving, and its moderators
- [Hwang (2025)](https://onlinelibrary.wiley.com/doi/10.1111/lang.12659) — blocked practice first for new declarative knowledge
- [Pan & Rickard (2018)](https://pdf.retrievalpractice.org/transfer/Pan_Rickard_2018.pdf) — transfer, and why practice should match the test format
- [Carpenter, Pan & Butler (2022)](https://www.nature.com/articles/s44159-022-00089-1) — the best single modern overview
- [Rohrer, Dedrick, Hartwig & Cheung (2020)](https://gwern.net/doc/psychology/spaced-repetition/2019-rohrer.pdf) — interleaved *mathematics* practice, d = 0.83
- [Siegler et al. (2012)](https://journals.sagepub.com/doi/abs/10.1177/0956797612440101) — fractions and division predict high-school algebra
- [CCSS 3.OA.C.7](https://www.thecorestandards.org/Math/Content/3/OA/C/7/) — fluency via the multiplication/division inverse
- [Bay-Williams & Kling, via Edutopia](https://www.edutopia.org/article/building-elementary-math-fact-fluency/) — derived-fact strategies and the phases of fluency
