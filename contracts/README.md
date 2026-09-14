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

`suede-voice-curriculum.json` is Sing's canonical voice-curriculum catalog.
It declares Sing as the catalog and discovery owner while GuitarHub remains the
temporary lesson renderer and entitlement gate. Its `curriculum` member is an
exact copy of GuitarHub's published voice catalog: seven levels, 34 modules,
and 102 published lesson previews. The full lesson bodies are not duplicated.

The contract also records the six automatic classifier labels, the
`historyOnly` imported-session policy, and the evidence required before any
lesson URL can move. Version 1 is authored here. GuitarHub vendors the entire
file byte-for-byte and checks its public catalog against it; update this file
first so a consumer cannot silently become the curriculum source.

The discovery page at `/learn` consumes the committed JSON directly. Lesson
links continue to use `https://guitarhub.org/learn/voice/<lesson-id>`, and
`lib/voice-curriculum.ts` rejects any ID absent from the catalog instead of
inventing a route.

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
outputs, the breath drills, the 44 warm-up exercises with their root offsets,
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
this app, not against this app. There is no strain detector anywhere, no vibrato
analysis, the detector is monophonic so a harmony against a lead is not two
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
native song practice is still playback without a microphone, so it offers two
fixed rates where the web has a continuous tempo grid and auto-tempo. It closes
when microphone-backed song scoring lands.

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
