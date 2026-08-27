# Carousel: "Your voice is not an instrument you own."

Six finished slides, 1080×1350. This is **Instagram launch grid post 6** in
[instagram.md](../../instagram.md) — the "Building the studio" pillar — and it
works on Facebook as an album for the same audience that shares explainers.

Upload `slide-1.png` … `slide-6.png` in order.

| Slide | Does |
|---|---|
| 1 | The chapter's opening line, which is also the best line in the book |
| 2 | What "assembled" means — air, folds, a shaped space |
| 3 | The three-part model: power, vibrator, filter |
| 4 | The payoff — three questions to ask instead of one vague dissatisfaction |
| 5 | "Effort is the least specific tool you have." |
| 6 | The book, and the free chapter |

## The quotation rule this file follows

Source is chapter one of The Measured Voice, which is **free** and served
unpaywalled at `/book/what-your-voice-is` (verified 2026-08-28). The
typography draws the line:

- **Serif under an open quote mark = verbatim.** Slides 1, 2, 3 and 5 are
  word for word.
- **Sans-serif = editorial summary**, written for the slide and never
  presented as the author's words. Slide 4 compresses a longer passage and is
  deliberately not styled as quotation.

A draft of slide 2 trimmed "There is" and dropped a trailing clause while
still looking like a quotation. That is a misquotation of Jason's own book,
and it is the kind of error that survives visual review because the slide
looks right. Hence:

```bash
node marketing/social/assets/carousel-book/verify-quotes.mjs
```

It fails if any serif-styled quotation is not found word for word in the
chapter. Run it after any edit to `slides.html`.

## Which chapters are actually free

**1, 8 and 12 — not the first three.** Chapter 3 (the passaggio) is paid,
so do not build a "read it free" post around it, however good the material is.

- Ch 1 — What your voice actually is → `/book/what-your-voice-is`
- Ch 8 — Reading your range test → `/book/reading-the-range-test`
- Ch 12 — When the numbers lie to you → `/book/when-numbers-lie`

Chapters 8 and 12 are the obvious sources for the next two book posts, and
chapter 12 is the more distinctive one: a measurement product being honest
about the limits of its own measurements.

## Re-render

```bash
node marketing/social/assets/carousel-book/render.mjs
```

## Caption (paste-ready)

```
"Your voice is not an instrument you own. It is one you assemble, freshly, every time you make a sound."

That's the first line of The Measured Voice, and the rest of the book runs on what follows from it. Nothing about your voice is stored. No reed, no string, no fixed tube of brass — just moving air, two small folds of tissue that get in its way, and a shaped space above them that colours whatever comes out.

Power, vibrator, filter. Three systems, and they fail in three recognisable ways. Which is why the model earns its keep: hear something you don't like in a recording and you get three questions instead of one vague dissatisfaction.

"Most singers treat every problem as a breath problem and answer it with more effort. Effort is the least specific tool you have."

Chapter one is free to read — no account, no paywall. Link in bio.
```

**Alt text** (per slide, in Instagram's advanced settings):

1. "Quotation: Your voice is not an instrument you own. It is one you assemble, freshly, every time you make a sound."
2. "Quotation: Nothing about it is stored. No reed, no string, no fixed tube of brass — just moving air, folds of tissue, and a shaped space above them."
3. "Three words set large: power, vibrator, filter — the book's three-part model of the voice."
4. "Three cards. Breath: wobbling volume, notes that sag, running out of air. Folds: breathiness, a crack at a predictable spot, a thin top. Tract: dullness, a woolly vowel, a note two sizes smaller."
5. "Quotation: Most singers treat every problem as a breath problem and answer it with more effort. Effort is the least specific tool you have."
6. "The Measured Voice — 23 chapters, chapter one free to read at sing.suedeai.ai/book."
