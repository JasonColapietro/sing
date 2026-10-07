# UI/UX end-to-end audit

Drives a real browser across every page template at five viewports and reports
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

## Pitch precision (`e2e/precision/`)

Measures how accurately the live-pitch surfaces report a known pitch. Each
fixture in `precision/fixtures.mjs` is a deterministic 12 s, 16-bit PCM WAV:
nine sines from 110 to 880 Hz, three harmonic tones, a 110→220 Hz glide, a
5.5 Hz ±50-cent vibrato around 220 Hz, silence, pink noise, and 220 Hz under
white noise at 10 dB SNR. Chrome plays each one in as a fake microphone,
the runner reads the `data-pitch-hz` attribute each surface publishes, and every
reading is scored against the fixture's true pitch.

```bash
npm ci                          # Playwright plus Chrome installed on the machine
npm run build && npm start      # in another shell. Production, not next dev
npm run e2e:precision           # all fixtures x range, studio, ear
node e2e/precision/run.mjs http://localhost:3000 --fixture=sine-440,glide-110-220 --surface=ear
```

**Operator-only.** The browser run is not part of any automated gate. Run it
by hand after a build. What the gates do cover is the fixture maths and scoring
(`vitest run e2e/precision`), which needs no browser.

| Flag | Effect |
|---|---|
| first bare argument | base URL (default `http://localhost:3000`) |
| `--fixture=id,id` | run just these fixtures |
| `--surface=range,studio,ear` | run just these surfaces |
| `--rate=44100` / `--channels=2` | WAV format fallback for the fake capture device |

Output goes to `e2e/precision/out/` (gitignored): one WAV per fixture, plus
`report.json` with every raw reading. A markdown table is also printed with
median and p95 cents, voiced %, and the fitted offset.

**macOS fake-capture caveat.** Chrome's `--use-file-for-fake-audio-capture`
is picky about WAV formats and does not report a file it cannot use. It
opens a silent device instead. If the probe fails, retry with `--rate=44100`
and/or `--channels=2` before suspecting the app.

**Rig probe and exit codes.** Before any surface runs, the 440 Hz fixture is
read through `getUserMedia` with echo cancellation, noise suppression and AGC
all off. The probe requires a non-zero RMS and a zero-crossing pitch within 50
cents of 440 Hz. Exit codes are `0` clean, `1` any unexpected failure (a score
that misses its rule, a missing hook, a button that did not appear), and `2` a
rig error: the probe failed or Chrome would not launch.

**Pass rules** (`PASS_RULES` in `fixtures.mjs`):

- steady tones (sines, `snr10-220`): median ≤ 10 cents and p95 ≤ 50 cents
- harmonic tones: the steady rule, plus no more than 2% of readings over 600 cents (octave errors)
- glide and vibrato: median ≤ 25 cents at the best offset, found by searching −0.5 to 1.5 s in 10 ms steps
- silence and pink noise: voiced on no more than 10% of readings
- any voiced fixture with fewer than 10 readings fails as `no-reading`

**Surfaces.**

- `range`: clicks "Start free range test", discards 500 ms, then polls every 50 ms for 6 s.
- `studio`: clicks "Enable microphone", discards 500 ms, then polls for 8 s.
- `ear`: opens Pitch match at the **Medium** level and then enables the
  microphone. It samples only while `data-sing-active="1"`, so only the first
  sing window is measured. The first 300 ms are discarded, and sampling stops
  when the attribute returns to `"0"` or after 8 s. If the fixture happens to
  match the random target, the round settles after a 1.5 s hold. That is a
  normal stop, not a failure.
- `recorder` is **skipped**. Take analysis there is Pro-gated and offline,
  with no live pitch. `data-testid="recorder-take-median"` is there for manual QA.

Every surface run gets a fresh browser, a cleared store and no sign-in, for
the same reasons as the audit above.

**Expected failures.** `EXPECTED_FAILURES` in `precision/run.mjs` is keyed
`<fixtureId>@<surface>`. Add an entry only for a failure seen in a real run,
and put the observed numbers in the reason. A listed failure does not fail the
run. A listed entry that starts passing is reported as an unexpected pass
(a warning), which is the cue to delete it.
