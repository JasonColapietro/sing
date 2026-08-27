# Codex brief: build a book carousel

A self-contained spec for producing another Instagram carousel from a chapter
of The Measured Voice, using the pipeline already in this repo. Three
carousels exist and work; this describes how to make the next one without
rediscovering the traps.

**Run it from the repo root** (`~/code/sing`, or wherever this checkout is):

```bash
codex exec --sandbox workspace-write -C ~/code/sing "$(cat marketing/social/CODEX-carousel-brief.md)

TASK: build the carousel for chapter 8, 'Reading your range test'."
```

Swap the final TASK line for whichever chapter is wanted. Everything above it
is the standing spec.

---

## What you are making

Six or seven PNG slides at **1080×1350** (Instagram 4:5 portrait), plus a
README with a paste-ready caption and per-slide alt text. A human uploads
them by hand. Nothing here posts anything, and you must not try to.

Copy the shape of an existing one rather than inventing a structure:

- `marketing/social/assets/carousel-book/` — chapter 1, six slides
- `marketing/social/assets/carousel-numbers/` — chapter 12, seven slides
- `marketing/social/assets/carousel-range/` — a data carousel, no quotations

Each directory holds `slides.html`, `render.mjs`, `README.md`, and the
rendered `slide-N.png`.

## The five things that will bite you

**1. Only chapters 1, 8 and 12 are free.** `lib/pro-inventory.ts` says
`free: 3`, which reads like "the first three." It is not. Check the
per-chapter `"free": true` flags in `lib/book-data.ts`. Chapter 3, on the
passaggio, is the best material in the book for a cold reader and it is
**paid** — building a "read it free" post around it would send people into a
paywall. If the requested chapter is not free, stop and say so rather than
quietly changing the call to action.

**2. Serif means verbatim. This is enforced.** The carousels carry a
typographic contract:

- serif (`class="quote"`), under a large open quotation mark = **word for
  word from the chapter**
- sans-serif (`class="say"`, `.item`, `.tell`) = editorial summary written
  for the slide, never presented as the author's words

A draft once trimmed two words from a sentence and dropped a trailing clause
while leaving it set as a quotation. That is a misquotation of Jason's own
book, and it survives visual review because the slide looks right. Before you
finish:

```bash
node marketing/social/assets/verify-quotes.mjs
```

It reads the `SOURCE: content/book/NN-slug.md` line from each `slides.html`
header and checks every serif-set line against that chapter. It must exit 0.
Put the `SOURCE:` line in your new file's header comment or it will be
skipped silently.

**3. Playwright's bundled Chromium hangs on this machine.** A bare
`chromium.launch()` times out after 180s. Always
`chromium.launch({ channel: "chrome" })`. Copy `render.mjs` from an existing
carousel and only change the directory name and the slide count.

**4. Do not put decorative hairlines behind text.** An early version drew
full-width "note lane" rules at fixed y-positions; they struck through the
headline on four of six slides and read as strikethrough. Ornament that
crosses type is a bug. The lane motif is allowed only where it means
something — under a pitch trace, or as the track a data bar sits in.

**5. Look at every slide you render.** Open the PNGs. The failures in this
pipeline are visual — collisions, dead space at the bottom, a card whose text
wraps to two lines while its neighbour takes one — and none of them show up
in the HTML.

## Brand

Tokens are the site's own (`app/globals.css`); do not invent colours.

| Token | Value | Use |
|---|---|---|
| paper | `#f7f0e7` | slide background |
| panel | `#fffaf2` | cards |
| line / line2 | `#ddd4c4` / `#c9bda0` | borders, hairlines |
| ink | `#20201d` | body text |
| mut | `#5c564d` | secondary text |
| label | `#82631f` | mono kickers, small caps |
| teal | `#11615d` | the pitch trace, data bars, URLs |
| rec | `#9d3f33` | only for something wrong (noise, error) |

Type: **Instrument Serif** display and quotations (400 only — it ships one
weight, never synthesise bold), **Manrope** body, **IBM Plex Mono** kickers,
counters and note names. Load from Google Fonts with `display=block` so the
render never captures a fallback face.

Voice: plain declaratives, specific, numbers over adjectives. No exclamation
marks, no hype, no emoji, no engagement bait ("Thoughts?", "Let that sink
in"). Read a chapter of the book for the register.

## Structure that works

1. The chapter's sharpest line, cold, as a pull quote.
2. What it means — the frame.
3. The substance: a real list, a diagram, or the model. Editorial summary in
   sans is right here.
4. The counterintuitive turn, if the chapter has one.
5. Something the reader can **do** — the reason to save the post.
6. The closer, then the book and `sing.suedeai.ai/book`.

Add a seventh slide only when the material genuinely needs it. Number the
counter `01 / 06` or `01 / 07` to match.

## Product facts you may state

Free, browser-based vocal training; no install; practice works without an
account. Mic audio is analyzed on-device and never leaves the device (use
that wording). Rooms: pitch studio, warmups, range test, famous ranges, ear
training, breath, song practice, recorder, tools, progress. Pro Early Access
is $4.99/month or $79 lifetime. The Measured Voice is 23 chapters, ~31,659
words. iOS companion is "Suede Studio Voice". **There is no Android app** —
never imply one. Do not invent statistics, testimonials, or user counts.

## Done means

- [ ] `slide-1.png` … `slide-N.png` at exactly 1080×1350
- [ ] `node marketing/social/assets/verify-quotes.mjs` exits 0
- [ ] you have viewed every rendered slide and none has colliding or
      strikethrough text
- [ ] `README.md` in the new directory with the slide table, caption, and
      per-slide alt text, matching the shape of the existing two
- [ ] one row added to the table in `marketing/social/README.md`
- [ ] committed to a branch cut from `origin/main`, not pushed to `main`
      directly — open a PR and let a human look at the images

Do not create social accounts, post anything, or edit
`marketing/social/geo-wiring.md`.
