# Cross-surface contracts

Suede's vocal domain is implemented four times: this repo's TypeScript, the
companion web app in `Suede-AI/suede-voice`, the SwiftUI app, and the Android
app. Until now the numbers moved between them by hand, copied out of a handoff
document into a second language. That is silent drift. Nothing fails; the two
apps just start scoring the same performance differently, and nobody finds out
until a singer notices.

A contract here is the reference surface's numbers, serialized, so the other
surfaces can assert against them instead of re-typing them.

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

### Versioning

`version` is bumped only when the *shape* changes: a key added, removed or
renamed. A changed value is never a version bump. A value is the thing the
contract exists to surface, and the native side should meet it as a failing
assertion rather than as a version it is allowed to skip.
