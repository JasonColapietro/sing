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
