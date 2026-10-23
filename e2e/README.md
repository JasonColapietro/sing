# UI/UX end-to-end audit

Drives a real browser across every page template at six viewports and reports
what a person would actually hit: unreadable text, targets a thumb misses, pages
that scroll sideways on a phone, controls a keyboard cannot reach, and a
microphone refusal nobody can see.

```bash
npm run dev          # in another shell — the account surfaces need it
npm run e2e          # full pass
npm run e2e:mobile   # one viewport, much faster
```

Exits non-zero when any **blocker** or **major** finding survives, so it works
as a gate.

## Flags

| Flag | Effect |
|---|---|
| `--only=contrast,layout` | run just these audit ids |
| `--route=home,pro` | run just these routes |
| `--viewport=mobile-375` | run just these viewports |
| `--json=path.json` | write the raw findings |
| first bare argument | base URL (default `http://localhost:3000`) |

## Adding an audit

Drop a file in `audits/`. It needs an `id` and a `run`:

```js
export const id = "my-check";
export const title = "What it looks for";
export function appliesTo(ctx) { return ctx.route.kind === "room"; } // optional
export async function run(ctx) {
  return [{ severity: "major", summary: "…", detail: "…", selector: "…" }];
}
```

`ctx` carries `{ page, route, viewport, baseUrl, response, consoleErrors,
failedRequests }`. Severity is `blocker`, `major`, or `minor`.

Findings identical across viewports are collapsed into one line, so a token that
fails everywhere reads as one defect and a bug that only bites at 320px stays
visible.

## Helpers, and why the obvious version is wrong

`lib/harness.mjs` installs three probes on every page. Each exists because the
one-liner it replaces returns a confident wrong answer in this project.

**`window.__contrast`** — paints colours into a 1×1 canvas and composites
alpha up the ancestor chain. Chrome returns `lab()` / `oklch()` for some values
here, so a `rgb()` regex parses garbage; a first pass without this claimed
near-black text failed at 1.16:1. Semi-transparent panels also mean an
element's own `backgroundColor` is not what the text sits on.

**`window.__hit`** — probes all four corners with `elementFromPoint`.
`border-radius` clips pointer hit-testing, not just paint: a `rounded-full
size-11` button measures a clean 44×44 while every corner resolves to the
parent, leaving ~21% of the nominal target dead. A bounding-box audit passes
controls a real thumb misses.

**`window.__describe`** — a short, stable selector for reporting.

## Rules this suite is built around

Every one of these produced a wrong result before it was written down.

- **Launch Chrome, not bundled chromium.** `chromium.launch({ channel: "chrome" })`.
  The bundled `chrome-headless-shell` spawns but never signals ready on this
  machine and dies at the 180s timeout.
- **Never `element.click()` inside `page.evaluate`.** It does not reach React's
  handlers here — a working button reads as broken, with no console error. Use
  Playwright's `locator.click()`.
- **Never `el.focus()` to test focus rings.** It does not match
  `:focus-visible`, so every element reports as unstyled. Only judge after a
  real `Tab`.
- **Assert on strings unique to the target state.** `/range`'s intro blurb
  contains "slide down to your lowest", so that matcher is already true before
  the test starts. One such selector produced six false passes.
- **Clear storage between pages.** A seeded high-XP record raises the Pro upsell
  modal, which renders `fixed inset-0 z-[70]` and swallows every click beneath
  it — fine controls then time out as "subtree intercepts pointer events".
- **Do not sign in.** `.env.local`'s Redis is the same Upstash store production
  uses. Browser QA leaves permanent `account:progress:*` keys there.

## Not covered here

**Anything behind a closed `<details>`, a dialog, or a mobile menu.** The suite
audits each page as it arrives and never expands an accordion or opens a modal,
so controls inside them are unaudited rather than proven fine. This matters more
than it sounds: Chrome keeps a closed `<details>`'s contents in the layout tree
so find-in-page can reach them, so those controls report full-size rects while
being unpaintable and unclickable. Auditing them anyway produced a 350x39
device picker that "nothing could click" and made collapsed sections read as
overlapping body copy. `window.__rendered()` excludes them; opening them first
is the way to actually cover them.


**Layout shift (CLS).** It needs a production build to mean anything, and
`npm run build` clobbers `.next` under a running `next dev`. Measure it in a
separate pass against `npm run build && npm start`, which reproduces production
to four decimals.

## Layout shift

`node e2e/cls.mjs [baseUrl] [--executable=path]` loads every route template
and fails above 0.10, Google's "good" line. It fails with exit 2, never a
pass, when a route did not load or the observer could not see a synthetic
shift.

| Flag | Effect |
|---|---|
| `--viewport=mobile-375` | one viewport (default: all six) |
| `--returning` | seed a returning singer before every load (see Navigation journeys below) |
| `--state=<name>` | seed a returning singer in a stored state that reshapes pages; implies `--returning` |
| `--route=warmups,programs` | just these routes, by their `name` in `routes.mjs` or in `cls.mjs`'s `DEEP_LINKS` |
| `--json=path.json` | write every reading |

Besides one route per template, it loads two query-string deep links that
are different pages from the route at their path (`DEEP_LINKS` in `cls.mjs`):
`program-detail`, `/programs?program=measured-voice-12w` (the book's
program, which only `--state=finished` runs), and `program-foundations`,
`/programs?program=foundations-2w` (the program `--state=program` runs, so
that state opens its own program, today's card above the calendar). A static
page cannot read its query, so `next.config.ts` serves each known program id
its own prerendered page at that address, and the deep link paints the
program rather than the list it used to swap out after mount.

A few more deep links are loaded only when `--route` names them, for the
states that need them, so a plain run's page count stays the same: each
other program's own view (`program-high-notes`, `program-mix`,
`program-recovery`, `program-vibrato`), and the pages `--state=saved-range`
measures: `singer-adele` (`/singers/adele`, a "test" page),
`singer-celine-dion` (`/singers/celine-dion`, one of the comparison pilot's
"compare" pages, with the wider labels) and `song-someone-like-you`
(`/can-you-sing/someone-like-you`).

The states are what localStorage holds and the prerender cannot: the
prerender is always a newcomer's page, so each of these used to change shape
at hydration only for the singers in it.

| `--state=` | Seeded on top of the returning record | Pages it reshapes |
|---|---|---|
| `capped` | 330 s of warmup today: the free plan's five guided minutes are used | the cap wall in `/warmups`, `/breath`, `/ear-training`, `/songs` |
| `program` | Foundations in 2 weeks, day 2 still to do | today's card on `/programs` and on its own `?program=` view (not on another program's), the leading program card on `/warmups` |
| `program-capped` | both: the program day waits for midnight | all of the above, with the longer "waits" lines |
| `rest-day` | Mix in 4 weeks on its day 7 rest day, day 8 onward needing Pro | the rest-day card on `/programs` and `/warmups` |
| `finished` | The Measured Voice finished, its six check-in days carrying readings | the book's finished card (chapter 19's next steps, six reading rows, the fortnight choices) on `/programs` and on its own `?program=` view, which the `book` token sizes apart from other programs' finished cards |
| `finished-high-notes`, `finished-mix`, `finished-foundations`, `finished-recovery`, `finished-vibrato` | that program finished, every check-in day carrying readings | its finished card on `/programs` and its own `?program=` view, sized by the program's own token (`--finished-slot` in `app/globals.css`); Vibrato has no check-ins and takes the plain size, and Recovery week, with no check-ins either, has its own for its longer finished line (the doctor referral) |
| `saved-range` | a saved range of A2–F4 | the header action on a singer page (`SingerRangeAction`) and a popular song's (`CanYouSingAction`), which point at the comparison once the range hydrates, and the song's personal answer, which replaces the range-test pitch |

Each state also names the selector that proves it showed (the cap wall, a
program card), and a route where it did not counts as a failed reading, so
a seed that stops matching the app cannot pass by measuring a plain
returning singer. `e2e/cls.test.mjs` runs every seed and checks it against
the app's own rules and the pre-paint script.

These pages stay still in those states because an inline script in the root
layout's `<head>` (`lib/prepaint.ts`) reads the same storage before the first
paint and marks `<html>`, and the server HTML carries each state's version of
the parts that depend on it (`components/prepaint.tsx`, rules in
`app/globals.css`). Measured against a production build at 375 and 1280px,
every route in every state is at or under 0.10; before, a capped singer's
rooms were 0.40 to 0.45 on a phone, `/programs` with a program 0.29 to 0.44,
and `/warmups` with a program and the cap used 0.52.

A saved range is on `<html>` too (`data-sing-range="saved"`): a popular
song's answer card is about three times the height of the range-test pitch it
replaces, so until hydration the pitch is held at the shortest answer's
height (`song-verdict` in `app/globals.css`). Measured with
`--state=saved-range`, that took the song page from 0.09 to 0.002 at 768px
and from 0.05 to 0.003 at 1280px; the singer pages' header swap was already
still, both labels of a pair sharing one width.

CI's `layout-shift` job (`.github/workflows/ci.yml`) runs every route on a
375px phone twice, as a newcomer and with `--returning`, then each state on
the routes it reshapes at 375 and 1280px, and `/singers` on a
`desktop-1440-tall` window (1440x1300): the section after its chart starts
below the first screen of a phone or a 1080px-tall desktop, so only a tall
screen would see it move when the chart mounts.

## Pitch precision

A separate runner, not an audit: it scores how many cents the practice rooms
are off, through the real browser audio path.

```bash
npm run build && npm start                      # in another shell
npm run e2e:pitch                               # uses Chrome, like the audit
npm run e2e:pitch -- --executable=/opt/pw-browsers/chromium   # a specific build
```

Each case writes a synthetic voice (`lib/audio/voice-fixture.ts`) to a WAV,
launches a browser with it as the fake microphone, opens `/studio`, presses
"Enable microphone", and reads what `usePitch` heard through the
`window.__singPitchProbe` hook. It exits non-zero when a case misses its
ceiling. `lib/audio/pitch-precision.test.ts` scores the detector alone on the
same fixtures, so a regression in one and not the other says which layer broke.

Measured (Chromium, 44.1 kHz context, 48 kHz source), before and after S1:
the true median in `usePitch` and the detector's 4 kHz pre-filter.

| Case | Bias before → after | p95 \|error\| before → after |
|---|---|---|
| E2 – C6, clean | ≤ 0.13 c → ≤ 0.07 c | ≤ 0.14 c → ≤ 0.12 c |
| A3 ±25 c detune | 0.00 c → 0.00 c | 0.00 c → ≤ 0.09 c |
| A3, 20 dB SNR | 0.2 c → 0.0 c | 0.9 c → 0.1 c |
| A3, 5.5 Hz ±40 c vibrato | **5.5 c sharp** → 0.7 c | 25 c → 23 c |
| E2 / A3, 10 dB SNR | new | 1.7 c / 0.6–1.5 c |

The vibrato bias came from `usePitch`'s median of 4 taking the upper middle
value (`lib/audio/median.ts` now averages the two). The spread on vibrato
cases is the vibrato itself, not error.

## Breath gate

Use `--case="breathe and sing"` to isolate a named case. Unknown case names
fail instead of reporting a zero-case success. The cue fixture sings for five
seconds to clear the four-second target after microphone frame windowing;
the sustain fixtures still measure four-second holds.

`npm run e2e:breath -- [baseUrl] --executable=/opt/pw-browsers/chromium` plays
synthetic scenes from `lib/audio/breath-fixture.ts` into `/breath` as the fake
microphone and checks what the breath gate did, through the
`window.__singBreathProbe` hook and the page:

| Case | Passes when |
|---|---|
| Inhale, then a sung A3 | one inhale heard (0.92 s of a 1 s breath), the hold recorded (4.1 s of 4 s), and the results line reads `4.1 s · 0.9 s breath in` |
| Inhale, then straight into a 4 s hiss | the breath is split off where the hiss steps up, the gate opens, and the hiss is timed as the hold from where it began |
| Fan, then the same A3 | no inhale heard, the note alone does not start the hold, the fallback shows after 8 s, and taking it records the next note (4.1 s) on sound alone |
| Breathe and sing, 4 reps | every rep's note counts after a breath, and all four breaths are heard |

The fan case failed on its first run: a stream opens on a buffer of zeros, the
detector learned its floor from them, and the fan already running read as a
breath. The floor is now learned from the first frame with signal in it.

## Short-loop scoring

`node e2e/song-loop-scoring.mjs [baseUrl] [--executable=path]` plays a
perfectly held G4 into a one-note loop of Silent Night and requires every loop
to score at least 95%. It guards the songs player's lag-aware loop close:
while loops closed on the audio clock, the last reports of each loop's final
note arrived after that loop was already scored, and this run read 77–81%.

## Navigation journeys

`node e2e/navigation.mjs [baseUrl] [--executable=path]` opens all ten rooms
through the "All rooms" sheet and the five primary destinations through the
"Tabs" bar (below 640px) or the header's "Main" row (640px up), at 320, 375,
768, and 1280px. It checks real link clicks, 44px targets, headings,
horizontal overflow, Escape focus restoration, the scroll lock being released
after crossing the 640px breakpoint with the sheet open, and removal of the
tab fade at the scroll end. It uses isolated browser contexts and never signs
in or starts checkout. `cls.mjs`, `song-first-practice.mjs` and
`songs-modes.mjs` take the same `--executable=` flag for machines without a
Chrome channel. `cls.mjs --returning` (and every `--state`, see Layout shift
above) seeds a returning singer's progress
record (a warmup yesterday, a streak, a saved range) before every load: the
prerender is always the newcomer's layout, so a page whose layout depends on
progress, such as `/warmups`, shifts at hydration only for a singer with a
record, and a fresh-profile run cannot see it. It also marks last week's
weekly report as seen: on a Monday the seeded session falls in last week, and
the once-a-week report card would otherwise open above every page's content
on every load and swamp the shift being measured.

The header row is `justify-center-safe`, not `justify-center`: between 640px
and about 1000px the five tabs overflow it, and plain centring pushed "Home"
off the row's left edge, under the logo, where no scroll could reach it. This
journey caught it at 768px.

The general audit also covers `/voice`, `/can-you-sing`, and a popular-song
detail. Template discovery excludes static hubs so singer-detail coverage
cannot accidentally select `/singers/methodology` or `/singers/records`.

## Mic release

`node e2e/mic-release.mjs [baseUrl] [--executable=path]` checks that the
warmups and songs rooms let go of the microphone when a session is over.
Both used to keep it open on a summary, the warmups list and the songs
library, with the browser's recording light on and nothing on screen to turn
it off. Now a room that is out of a session, with no start waiting on the
device, closes the stream after 15 idle seconds (`MIC_IDLE_RELEASE_MS` in
`lib/audio/use-idle-mic-release.ts`), so a quick "Sing again" keeps it. The
room remembers the singer said yes, so no gate or "Enable microphone" comes
back, and the next start reopens it before the run begins.

It wraps `getUserMedia` before the app loads and counts the tracks it handed
out that are still `live`. Chrome's fake microphone plays a held A3 from
`lib/audio/voice-fixture.ts`, or silence for the cases below. Every step
prints the count it measured, so the log shows 0 or 1 rather than only a
pass.

Waiting 15 seconds per check would make the run crawl, so every case but one
sets `window.__singMicReleaseMs = 400` in an init script, which the hook reads
in place of its delay, and expects 0 live tracks about a second after a run
ends. The grace case leaves the real delay alone and expects the track still
live 3 seconds after End, with "Sing again" reusing it rather than opening a
new one.

| Case | Passes when |
|---|---|
| Warmups, one exercise | after End (with reps sung, and with none), on the summary and the list: 0 live, no gate card, no "Enable mic and start"; the next exercise opens a track and its "Cents off" readout shows a number |
| Warmups, routine | quit after one step, the routine summary has 0 live; "Play again" is live on its first slide |
| Warmups, rep-count link | `?exercise=sustained-hold&reps=1` ends on its summary by itself with 0 live; "Run this ladder again" and "Next exercise" (or "Sing it") each reopen |
| Songs | the Practice summary and the library have 0 live and no "Enable microphone"; "Sing again" and a library card are live before Play, scored, not "Listen mode"; a refused reopen brings the gate back |
| Songs, listen mode | "Continue without a mic" opens nothing, ever; turning the mic on later from the library header makes the next start reopen it too; a refused reopen from that scored run's summary brings the gate back |
| Idle grace | with the real delay, still 1 live 3 seconds after End in warmups and End practice in songs |
| Silent stop | an exercise that closed itself for silence keeps its track for the "No sound picked up" meter, past the 400 ms release; "Turn off the mic" on that note closes it and the next start reopens |

The silent cases run in their own browser, since Chrome reads the fake
capture file once per process. A run takes about two and a half minutes.
