# Cross-surface contracts

Suede's vocal domain is implemented four times: this repo's TypeScript, the
companion web app in `Suede-AI/suede-voice`, the SwiftUI app, and the Android
app. Until now the numbers moved between them by hand, copied out of a handoff
document into a second language. That is silent drift. Nothing fails; the two
apps just start scoring the same performance differently, and nobody finds out
until a singer notices.

A contract here is the reference surface's numbers, serialized, so the other
surfaces can assert against them instead of re-typing them.

## suede-voice-curriculum

`suede-voice-curriculum.json` is Sing's canonical voice-curriculum catalog:
seven stages, 34 modules and 102 lessons. Its `curriculum` member started as an
exact copy of GuitarHub's voice catalog (`lib/learning/data/voice.json` in
`JasonColapietro/suede-guitar-hub`, as of that repo's #47). Sing has since
edited it on purpose. Twelve "Checkpoint:" lessons that nothing measures
became "Self-Check:", three summaries that promised an unmeasured outcome were
reworded, three more were set to their lessons' objectives
(`scripts/compile-lessons.mjs` now requires a lesson's objective to equal its
catalog summary, and Hiss for Twelve's no longer calls the hiss's length "your
own observation", since the sustain test times it), module `v-l3-m5` was
renamed from "Fix the Wobble" to "Breathy, Nasal or Tight" because the course
uses "wobble" for vibrato, and every stage is free. Later edits of the same
kind (2026-10-12):

- Module `v-l4-m4` was renamed from "Grace and Grit" to "Attack and Release".
  Its lessons teach only grace notes, staccato and accent, and the site uses
  "grit" for rasp and distortion, which the course never teaches: Stage 7's
  Effects, Carefully tells singers not to learn an effect from the app.
- The `v-l2` and `v-l7` stage subtitles were reworded to promise only what
  their modules supply (a first song phrase rather than a whole song; a stop
  plan for effects and a study rather than earned effects and a set).
- The summaries of `v-l5-m4-01` (no invented two-second claim) and
  `v-l7-m5-04` (no same-session rescan) were reworded, and their lessons'
  objectives with them.
- Module `v-l7-m5`'s `proofMetric` changed from `range_midi_span` to
  `self_reported`. Its lessons take their evidence in a recorded take and
  leave the range test for a retest weeks apart, and its lesson pages state a
  self-check basis. `lib/voice-lessons.test.tsx` now requires a module's
  `proofMetric` to be `self_reported` exactly when its lesson pages state a
  self-check basis.

Don't "re-sync" those edits away: parity with GuitarHub is by stage, module
and lesson ID, not by text. GuitarHub's copy has to be re-synced byte for byte
after each of them.

Since 2026-09-23 sing also hosts the lessons. The bodies are markdown in
`content/lessons`, compiled into `lib/lesson-data.ts` and served at
`/learn/voice`. `ownership` and `migration` record that move. Each of the
seven pieces of evidence GuitarHub required before redirecting has a line in
`migration.resolution` saying what happened to it. The qualified vocal review
and the physical-microphone checks are recorded as done on the owner's report
(2026-09-24); their records are not stored in this repository.

The file is authored here, not generated. GuitarHub vendors it byte for byte,
so update it here first. `lib/voice-curriculum.ts` validates it at the data
boundary.

## suede-voice-lesson-urls

`suede-voice-lesson-urls.json` maps every stage, module and lesson ID to its
path on sing. GuitarHub vendors it and redirects `/learn/voice/<lesson-id>`
from it. `scripts/compile-lessons.mjs` generates it, alongside
`lib/lesson-data.ts`, from the directory names under `content/lessons`, so
moving a lesson changes a line here. `node scripts/compile-lessons.mjs --check`
fails if the file is stale; `lib/voice-lessons.test.tsx` runs that check.

## suede-progress

`suede-progress.json` publishes the shape of a singer's practice record. It is
generated from `suede-progress.ts`; regenerate it with the command in that
file. Sing now authors the voice-lesson IDs and hosts the lessons, but the
record still has no lesson field. A lesson page counts its module's room
sessions as practice (`lib/lesson-practice.ts`) and never records a lesson as
complete.

## practice-parity

`practice-parity.json` holds the web's practice and song-scoring reference:
pitch tolerance, tempo bounds and the auto-tempo thresholds, transpose clamp,
difficulty cuts, band ladder, judgment floors and points, the score multiplier
rungs, guide-pass percentages, the mastery score, and the XP and level ladder.

**It is generated, not written.** `practice-parity.ts` imports the constants
from the modules the app actually runs on and serializes them.
`practice-parity.test.ts` fails when the committed JSON and the live constants
disagree, which is what stops the file going stale. Change `TEMPO_STEP` in
`components/songs/lib.ts` and the suite goes red until the contract is
regenerated.

Regenerate after any reference constant changes:

```bash
CONTRACT_WRITE=1 npx vitest run contracts/practice-parity.test.ts
```

Then commit the JSON alongside the change, so the native repos see the new
number as a diff rather than never hearing about it.

## suede-vocal

`suede-vocal.json` holds the vocal domain itself rather than the song scorer:
the voice-type taxonomy and the published passaggio zones, the range-scan
outputs, the breath drills, the 58 warm-up exercises with their root offsets,
the ear games, and which rooms accept a deep link.

Its most important section is `measurement`. Each row names something a
microphone take could yield and says whether this app actually yields it —
`yes`, `adaptable` (the signal is captured, nothing computes the number yet), or
`no` (it needs acoustic analysis that exists in no Suede surface). The
`unsupportedClaims` section then names, as data, the promises some Suede surface
currently shows a singer that the measurement layer cannot keep.

That section exists because of a real failure. GuitarHub's `suede-guitar-hub`
repo ships a seven-level voice curriculum — 34 modules, 102 authored lesson
records — whose modules promise measured outcomes: a twelve-second even hiss
judged on "flow consistency", five pitches inside twenty-five cents, "both
passaggio pitches" computed from the stage-one range scan, a vibrato rate on
cue, a six-second mix sustain with no strain. It was authored against an idea of
this app, not against this app. There is no strain detector anywhere, there was
no vibrato analysis (there is now, for rate and width only; see v3), the detector is monophonic so a harmony against a lead is not two
measurable parts, the breath room's steadiness reading is a coefficient of
variation of **loudness** and never reads f0, and a passaggio is not derivable
from a range scan at all — `lib/voice-types.ts` argues that point at length.

Nothing failed. Two apps in one product disagreed about what the product can
measure, and the only way to find out was to read both.

So the capabilities are serialized, and the consumer asserts its lesson claims
against them. A lesson promising proof that no `yes` row can supply is a failing
test rather than a promise to a singer.

**It is generated, not written**, on the same terms as practice-parity:
`suede-vocal.ts` imports the live modules and serializes them. Regenerate after
any change to the taxonomy, the drills, the warm-up catalogue or the ear games:

```bash
CONTRACT_WRITE=1 npx vitest run contracts/suede-vocal.test.ts
```

`suede-vocal.test.ts` goes further than an equality check, because a capability
claim can rot without any number moving — someone could wire f0 into the sustain
test and the contract would still tell GuitarHub the measurement does not exist.
So the load-bearing claims are asserted against the source: that
`sustain-test.tsx` reads `frame.volume` and not `frame.f0`, that `detectPitch`
still returns one result or null, that every `useInstead` remedy names a
measurement that is really implemented, and that no row reports itself
unmeasurable while naming a module. It also walks the built contract for
`undefined` leaves — `JSON.stringify` drops those silently, and a builder
importing a constant that was never exported produces a contract missing the key
entirely while still passing every equality check. That happened while this file
was being written.

### Consuming it from a native repo

`Suede-AI/suede-voice` vendors a byte-identical copy at its own
`contracts/practice-parity.json` and asserts its Swift constants against it, so
a divergence fails a test on whichever side moved. Re-sync that copy with:

```bash
curl -fsSL -H "Authorization: token $(gh auth token)" \
  -H "Accept: application/vnd.github.raw" \
  https://api.github.com/repos/JasonColapietro/sing/contents/contracts/practice-parity.json \
  -o contracts/practice-parity.json
```

### Known divergences

`knownDivergences` records places a native surface deliberately answers
differently, with the reason. A key listed there is allowed to differ; anything
not listed is drift and should fail the native assertion. Removing an entry is
a decision, not cleanup.

Writing this contract found three. Two were adjudicated on 2026-09-05 and
closed by moving iOS to the web's value: the transpose clamp (iOS was ±24
against the web's ±12) and the count-in (iOS was 3 beats against the web's 4).
Both are now asserted as equalities rather than recorded as differences.

The one that remains is `songTempo`, and it is a gap rather than a wrong number:
native song practice offers two fixed rates where the web has a continuous tempo
grid and auto-tempo. Native songs have been scored from the microphone since
suede-voice #132 (S8, 2026-09-24). The gap closes when the tempo grid and
auto-tempo arrive natively. No slice for that is confirmed yet.

### practice-parity v2

`version` moved to 2 on 2026-09-12. Three key additions, no changed values:

- `progress.xpEarn` — the rate a singer earns XP. The ladder's rungs were always
  here; the rate was not, so two surfaces could satisfy every assertion in the
  file and still level singers at different speeds.
- `progress.xpThresholds` — now all `maxLevel` rungs rather than the first
  twelve, each with the title shown at that level. `LEVEL_TITLES` has 15 entries
  for 60 levels, so the last repeats; serialized so a consumer does not index
  past the end and render undefined.
- `mastery.minTempo` — mastery ignored tempo, so a song sung at 0.25x unlocked
  the next band on the same terms as a clean pass at written tempo.
  Transposition is deliberately still not gated.

`Suede-AI/suede-voice` vendors this file byte-identically and needs a re-sync
(the `curl` above) before its own assertions will see any of it.

### suede-vocal v2

`version` moved to 2 on 2026-09-13, adding one section and changing no value:
`editorial`. It publishes the written library as identifiers — every chapter of
both books with its slug, part, word count, Pro gate and resolved path, the
popular-song range catalogue with key, cited range and derived difficulty, the
band-grid reference page, and a count of the singer library.

It exists because GuitarHub teaches a voice curriculum, names no repertoire at
all, and cites none of the reading that is already written here. The alternative
to publishing these identifiers is GuitarHub hand-writing chapter URLs into
lesson pages, where renaming a chapter breaks a link nobody is looking at. With
the section, a renamed or withdrawn chapter fails a test on the consuming side
instead.

Bodies are deliberately not in it. One site is the source for a piece of writing
and the other cites it; a contract carrying the prose would make two sites
compete to be the place the writing lives. `free` is the field a consumer has to
read, because most of the library is behind Pro and a free lesson citing a gated
chapter has to say so.

### suede-vocal v3

`version` moved to 3 on 2026-09-24, adding one key and changing no value:
`pitch.engine`. It carries the detector's tuning and the smoothing the live
rooms put on it:

- the pre-filter corner (`lowpassHz`)
- the silence floor (`silenceRms`)
- the edge trim and the shortest window it leaves (`trimThreshold`,
  `minWindowSamples`)
- the peak rule (`peakTolerance`)
- the mains-hum check below C2 (`subrangeFloorHz`, `subrangeSearchRatio`,
  `subrangeMargin`, `subrangeMinClarity`)
- the frame size (`frameSamples`), the clarity gate (`clarityThreshold`), and
  the median window with its true-median rule (`medianWindow`, `smoothing`)

It exists because the iOS song room ports `detectPitch` (suede-voice #132). A
port reads the same frames the same way only when these match, and until v3
they travelled as Swift comments naming the web constant each one mirrored.
`usePitch` and `useAnalyser` now take the clarity gate and the median window
from the named constants rather than from literals, and `suede-vocal.test.ts`
checks the sources still use them. A literal creeping back in would otherwise
let the contract and the detector disagree with every equality check green.

`Suede-AI/suede-voice` vendors this file and asserts `version`, so the re-sync
is a failing test there until its suite reads `pitch.engine`.

### suede-vocal v4

`version` moved to 4 on 2026-09-24. Two keys added under `measurement`, one on
every warm-up exercise, and one value changed that consumers have to meet:

- `measurement.vibratoRateHz` is now `measurable: "yes"`. `lib/audio/vibrato.ts`
  reads the rate and peak-to-peak width of a held note's pitch wobble, and the
  warmups vibrato drills show both after every hold against a 5–7 Hz band. The
  row gains an `evidence` list naming the module, its tests and the browser
  check (`npm run e2e:vibrato`). It describes the contour only: not quality,
  not health, and a wobble from any source measures the same.
- `measurement.vibratoOnCue` is new and `"no"`. Nothing times when vibrato
  starts or stops against an instruction, which is what the voice track's
  "straight to vibrato on cue" self-check actually asks.
- `unsupportedClaims["vibrato-rate-on-cue"]` keeps its key but is revised: the
  rate is measured and offered in `useInstead`; the cue is not.
- Every warm-up exercise gains `unscoredLeadSec`: open time before the first
  note with no target in it. It is 0 everywhere except "Creak to tone", whose
  creak the detector cannot hear and so must not count against the score.
  `patternSeconds` includes it.

### suede-vocal v5

`version` moved to 5 on 2026-09-24. One room and one list added under
`deepLinks`, no changed values:

- `deepLinks.rooms.programs` — `/programs?program=<id>` opens a multi-week
  practice program's calendar (`lib/programs.ts`). The page reads the parameter
  after mount, the same way `/warmups` does.
- `deepLinks.programs` — the ids that parameter accepts, with each program's
  name, length in weeks and Pro gate. An unknown id lands on the program list.

### suede-vocal v6

`version` moved to 6 on 2026-09-24. One key added to every entry of
`deepLinks.programs`, no changed values:

- `freeWeeks` — how many opening weeks of a Pro program are open to everyone
  (`FREE_WEEKS` in `lib/programs.ts`, currently 1). A free program carries 0,
  since all of it is free. Week 1 of a Pro program uses free content only and
  each of its days fits the free plan's daily allowance; from day 8 the
  program asks for Pro. A consumer that gates on `pro` alone would lock the
  week the web gives away.

The same change adds `measured-voice-12w`, the book's twelve-week plan, to the
list. That is a new value, not a new key, and needs no bump on its own.

### suede-vocal v7

`version` moved to 7 on 2026-09-24. The breath room's mic now hears the inhale
(`lib/audio/breath-detect.ts`), and the contract says exactly how much that is
worth. Key additions:

- `measurement.inhaleDetected` and `measurement.inhaleSeconds`: a breath was
  heard, and for how long. Both are `yes`, both carry an `evidence` list (the
  classifier, its tests and `npm run e2e:breath`), and both notes say what
  they are not: depth, airflow, support, lung capacity or the diaphragm.
- `unsupportedClaims.breath-support-from-inhale`: the claim a curriculum would
  be tempted to build on those rows, recorded before anyone builds it.
- `breath.sustain.breathGate`, `breath.cue` (the breathe-and-sing drill) and
  `breath.inhale` (the detector's bounds).
- `deepLinks.rooms.breath.values`: the ids `?drill=` and `?routine=` accept,
  now that `cue` is one of them.
- `rules.inhaleIsHeardNotMeasured`.

One value changed with them: the daily breath routine gained a breathe-and-sing
step, so its steps and seconds moved. No lesson may make passing depend on a
breath being heard. Every gated drill offers to start without detection, so a
singer whose mic cannot hear breathing can always finish.

### suede-vocal v8

`version` moved to 8 on 2026-10-10. It adds one section, two keys on every
warm-up exercise and three rules. Some values changed as well:

- `warmups.scoring`: `toleranceCents` (50), `onsetGraceSec` (0.105) and
  `onsetGraceMaxShare` (0.5). On the 0.25–0.3 s notes of the staccato gug,
  the agility run and the N run, a singer landing ~100 ms late lost about two
  fifths of every note. The web scorer now treats the first
  `min(onsetGraceSec, onsetGraceMaxShare × note duration)` of each target
  note as neutral: an off-target frame there is dropped, and an in-tune frame
  counts as voiced but earns no credit. Credit starts at the end of the
  grace, and the note's possible time is reduced by the same amount, so a
  note held on pitch from there to its end scores in full and a half-sung
  fast note does not. A note that is wrong past the grace still scores
  nothing. A 3.5 s hold loses 3% of its possible time.
  `rules.warmupOnsetGrace` states the arithmetic exactly. The value is
  `UNMODELLED_INPUT_LAG_SEC` in `lib/audio/latency.ts`. Treat it as a
  tolerance, not a measured latency: the 2026-08-23 probe it came from started
  its synthetic take late, and the fixed timing audit centres within ~25 ms of
  zero. It should be re-measured on real microphones.
- `gapSec` on every exercise: the silence between consecutive notes or glide
  steps at 1x, divided by tempo. It is 0.08 everywhere except the staccato
  drills (`gug-staccato`, `belt-bah-bursts`), which now leave 0.15 s, so their
  `patternSeconds` and the seconds of the routines that contain them moved.
  `rules.warmupGap`.
- `rangeCap` on every exercise: `null` (walk the whole fitted ladder) or
  `{ from, to }`, which keeps only that slice of the ladder. `rules.warmupRangeCap`
  gives the exact rounding. `swell-and-fade` walks the middle half
  (`0.25–0.75`). The two strong belt holds (`belt-forte-ah`,
  `belt-fifth-hold`) walk the lower part (`0–0.6`).
- Value changes with no new key, shipped in the same release:
  - The daily routine now opens on `lip-trill-scale`, then `ng-siren-fifth`
    and `octave-siren`. The steps and rep counts are the same, in a new order.
  - Two new free exercises, `swell-and-fade` (messa di voce) and
    `straw-slide-down` (straw cool-down), bringing the catalogue to 58.
  - The free exercise array is now in learning-path order (semi-occluded
    sounds and slides before open-vowel scales, fast runs last), and the belt,
    head-voice and mix packs are reordered. Nothing should depend on array
    position; read ids.
  - A new free `cooldown` routine, and the range, agility and full routines
    now end on `straw-slide-down`.
  - The breath `builder` routine gained a breathe-and-sing cue step, so its
    steps and seconds moved.

What the other apps must do: re-sync the file, then:

1. Apply the onset grace in their own warm-up scorers. Without it, the same
   take scores lower natively than on the web.
2. Read `gapSec` instead of assuming 0.08 when they lay out and play a pattern.
3. Apply `rangeCap` after fitting the root ladder.

Until then, `version` is a failing assertion on their side, which is
intended. Exercise ids and titles are unchanged.

### suede-vocal v9

`version` moved to 9 on 2026-10-12. Two keys and two rules added; some values
changed with them:

- `warmups.scoring.glideTimeSlack` (0.1). A glide used to be scored against
  the guide's ramp at one instant. A siren is taught as one unbroken slide,
  and a natural one eases out of the bottom and into the top rather than
  moving at constant speed: an eased octave siren with exact endpoints scored
  24, and a straight slide about 100 ms late scored 0. A glide frame is now
  measured against the nearest pitch the ramp passes through within this
  share of the glide on either side, plus the onset grace on the late side.
  A singer stuck on the start pitch, or stepping instead of sliding, still
  scores low: the window follows the ramp and does not cover the whole sweep.
  `rules.warmupGlideWindow` states the arithmetic exactly.
- `warmups.nominalRange` (`lowMidi` 45, `highMidi` 64: A2–E4). Before a range
  test, every ladder is fitted to this span instead of fixed C3→G3 roots, and
  the scorer counts any octave of each target, so one nominal span serves
  lower and higher voices. It is a placeholder, not a guess at anyone's voice;
  the range test replaces it. Per-note results and the rep's root are reported
  in the octave mostly sung. With a saved range only the written octave
  counts. `rules.warmupOctaveWithoutRange`.
- Value changes with no new key, shipped in the same release:
  - Eight exercises gained a `rangeCap`. The belt calls `belt-nay-speech`,
    `belt-hey-thirds`, `belt-bah-bursts`, `belt-yah-triad` and
    `belt-hah-descent` now walk the lower 60% of the ladder (`0–0.6`), as the
    two strong belt holds already did. The cool-downs `quiet-hum-descent`,
    `soft-trill-slide` and `straw-slide-down` walk the lower half (`0–0.5`).
  - `editorial`: book and atlas chapter word counts, one atlas summary, and
    the repertoire figures for `unchained-melody` (now its sounding range,
    C3–A4) and `die-with-a-smile` (the lead line, G#3–E5). Flat-key songs now
    spell their `rangeLabel` in flats (`Eb3–Bb4`, `Bb3–D5`, `Ab3–F5`).

What the other apps must do: re-sync the file, then:

1. Score glide frames against the ramp window in `rules.warmupGlideWindow`.
2. Without a saved range, fit ladders to `nominalRange` and fold sung pitch
   to the target's octave before comparing.
3. Apply the new `rangeCap` values (no code change if v8's cap is already
   implemented).

Until then, `version` is a failing assertion on their side, which is
intended. Exercise ids and titles are unchanged.

#### Value changes inside v9

No key was added, so `version` stays 9. These values moved, and a native
side that pins them sees the change as a failing assertion:

- `rules.warmupOctaveWithoutRange`: either octave still counts without a
  saved range, but one octave per rep, not per frame. The rep is scored as
  if every frame were moved by the same whole number of octaves, for each
  shift from two down to two up, and the shift that scores highest is the
  rep's octave; its score, cents error, per-note tallies and reported root
  all come from that shift. Folded frame by frame, octave leaps sung
  entirely on the root scored 99 and an arpeggio with its top note dropped
  an octave scored 100; now each scores what the written octave gives. A
  whole take sung an octave up or down still scores in full. The best
  shift, rather than one settled by the first notes, keeps a descent whose
  opening top note dropped an octave from losing every note after it. The
  span is `MAX_OCTAVE_SHIFT` in `components/warmups/scoring.ts`, stated in
  the rule text rather than as a key so the shape does not change.
- `head-float-hold` ("Top-note float") gained `rangeCap` `{ from: 0.5, to: 1 }`,
  the upper half of the ladder. Walked from the bottom, a bass held it at
  D#3–A#3, under his first transition, while the copy asked for head voice.
- `breath.sustain.benchmarksSec` and `starsSec` keep their values, but the web
  sustain test no longer prints the benchmark ladder or labels a hold by it:
  it asks the singer to end the note while it is still easy. Both are for
  review at the next version.
- `deepLinks.rooms.warmups.params` gained `reps`, a value in an existing
  list, as `measured-voice-12w` was in v6. `?reps=<n>` (a whole number from 1
  to 30, used with `?exercise=`) stops a deep-linked exercise after that many
  reps and counts them as "Rep k of N"; without it the exercise walks its
  ladder until the singer ends it, and any other value is ignored. The
  program rows on `/programs` now link exercises this way, so a day sized to
  the free minutes stops where the row says.
- `editorial`: word counts moved with this round's text edits. Book:
  `reading-the-range-test` (1450), `finding-your-break` (1339),
  `when-numbers-lie` (1463), `weeks-9-10-bottom` (1375), `totalWords` 32376.
  Atlas: `voice-types-in-the-wild` (865), `modern-rnb` (5390), `the-records`
  (1004), `totalWords` 72444.

What the other apps must do: re-sync the file, score one octave per rep as
the rule states, and apply the new `rangeCap`. A consumer that builds
warm-up deep links may add `&reps=`.

#### Further value changes inside v9

Again no key was added, so `version` stays 9:

- `vibrato-hold` and `vibrato-float-high` gained `rangeCap`
  `{ from: 0.25, to: 0.75 }`, the middle half of the ladder, as
  `swell-and-fade` already had. Uncapped, a bounded routine step walks from
  the bottom rung, so the vibrato routine and the program built on it held
  every note low in the voice, where a free vibrato is least likely to turn up.
- `editorial`: book word counts moved with this round's text edits:
  `range-is-not-one-number` (1318), `pitch-accuracy` (1498),
  `weeks-11-12-songs` (1612), `transposition` (1522), `totalWords` 32505.
- `editorial`: atlas chapter word counts moved because 77 singers changed
  chapter. `scripts/compile-atlas.mjs` now lets a hand placement (`ASSIGN`)
  win over the batch file's chapter (`FILE_GROUPS`); the lookup used to run
  the other way, so every exception in `ASSIGN` was dead (opera singers under
  jazz, the Latin lane under K-pop). New counts: `pop-women-the-founders`
  1912, `pop-women-the-moderns` 4975, `the-pop-men` 4424,
  `the-classic-rock-men` 5134, `alternative-punk-and-new-wave` 3131, `metal`
  3161, `the-soul-men` 3276, `the-soul-and-rnb-women` 2584, `modern-rnb`
  4482, `gospel-and-a-cappella` 2528, `folk-and-the-songwriters` 3108,
  `jazz-and-the-standards` 2728, `opera-and-classical-crossover` 2858,
  `musical-theatre` 2675, `latin-voices` 3350, `kpop-jpop-and-global-pop`
  4366. Atlas `totalWords` is unchanged at 72444, since the entries only moved.

What the other apps must do: re-sync the file and apply the two new
`rangeCap` values (no code change where v8's cap is already implemented).

#### Editorial and wording changes inside v9 (2026-10-12)

No key was added, so `version` stays 9:

- `editorial`: word counts moved with this round's text edits. Book:
  `breath` (1568), `weeks-1-2-baseline` (1421), `totalWords` 32597. Atlas:
  `the-safety-rail` (838), `totalWords` 72471.
- `measurement.rangeExtremes.note` no longer calls the result the "lowest and
  highest comfortable note". The range test asks for the furthest clear notes
  and counts a note once the detector has heard it for 600 ms in total, so the
  row now says these are the limits reached in one test, not a comfortable
  band. Nothing about the measurement changed.

What the other apps must do: re-sync the file. Nothing else changes.

### Versioning

`version` is bumped only when the *shape* changes: a key added, removed or
renamed. A changed value is never a version bump. A value is the thing the
contract exists to surface, and the native side should meet it as a failing
assertion rather than as a version it is allowed to skip.

## glossary

`glossary.json` holds the shared vocabulary of Suede's two instruments: every
term in `lib/glossary.ts` with its definition, the surface where the word is
already in use, the path that surface lives at, the domain it belongs to
(`music`, `voice` or `guitar`) and the site that publishes it.

It exists because one word can mean two things. `register` is a vocal mechanism
and a region of the guitar neck; `support` is breath management and how the
instrument is held; `tone` carries a general musical sense and a guitarist's
sense of one instrument and one touch. A single definition covering both sides of
any of those would have to be vague enough to help neither player, so a colliding
word gets one entry per domain instead.

Which means term identity is no longer the term. `termId` is still the anchor
within one page, but `glossaryKey` — `domain:termId` — is what a map or a lookup
has to be keyed on. Two entries sharing a `termId` never render on the same site,
and `lib/glossary.test.ts` asserts that rather than trusting it.

**One site publishes each term.** Two sites emitting `DefinedTerm` markup for one
word compete with each other as the definitional source for it, so
`publisherFor` sends the voice and music vocabulary here — `/glossary` renders it
and is the only place in either repo that emits `DefinedTermSet` — and the guitar
senses to the guitar hub, which renders them with no structured data at all. The
contract carries the whole set regardless, guitar included, because the consumer
needs every entry either way: it renders its own and links a reader to ours
instead of leaving a word bare.

`lib/glossary-publishing.test.tsx` renders `/glossary` and reads the markup back,
because the edit that would leak the guitar terms is someone mapping over
`GLOSSARY` again instead of `SING_GLOSSARY`, and no assertion about the data
catches that.

**It is generated, not written**, on the same terms as the other two.
`glossary.ts` reshapes the live glossary and `glossary.test.ts` fails when the
committed JSON disagrees with it. Regenerate after any change to the glossary:

```bash
CONTRACT_WRITE=1 npx vitest run contracts/glossary.test.ts
```

The term counts are pinned — in total, per domain and per publisher — so adding a
word to the shared vocabulary is a line in a review rather than a number nobody
looked at.
