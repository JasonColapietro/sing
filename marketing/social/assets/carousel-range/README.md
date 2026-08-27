# Carousel: "What's my vocal range?"

Six finished slides, 1080×1350 (Instagram's 4:5 portrait — the tallest the
feed allows, so it occupies the most screen). This is **Instagram launch grid
post 2** in [instagram.md](../../instagram.md), and it doubles as the
Facebook W2 "voice-type explainer" — the shareable-into-groups post.

Upload `slide-1.png` … `slide-6.png` in order. No design work needed.

| Slide | Does |
|---|---|
| 1 | The question, cold: "What's my vocal range?" |
| 2 | The definition — your range is two notes |
| 3 | **The eight voice types on one pitch axis** — the reason to save it |
| 4 | The caveat: range and voice type are different measurements |
| 5 | How the test works, in three beats |
| 6 | Call to action — sing.suedeai.ai |

## Why the numbers can be trusted

Every band on slide 3 is the site's own `REFERENCE_BANDS`
(`lib/singers-analysis.ts`), verified 2026-08-28 against what
`/atlas/vocal-range-by-voice-type` actually serves. The bar geometry is driven
by the same MIDI numbers as the labels, so the drawing cannot disagree with
the text. Slide 4 exists because the site itself is careful about this
distinction — a carousel that printed a tidy grid of ranges without it would
be repeating the mistake the atlas chapter is written to avoid.

**If the constant ever changes:** edit `slides.html`'s `BANDS` array to match,
re-verify against the live page, re-render. Do not hand-edit a number to make
a slide look better. A carousel that disagrees with the page it links to is
worse than no carousel.

## Re-render

```bash
node marketing/social/assets/carousel-range/render.mjs
```

Uses the repo's Playwright with `channel: "chrome"` — the bundled headless
shell hangs at launch on this machine.

## Caption (paste-ready)

```
Your range is two notes: the lowest you can sing and the highest. Everything else is derived.

Swipe for where the eight voice types actually sit — bass through soprano, on one pitch axis. Then the part most posts skip: range and voice type are different measurements. Range is your two extreme notes. Voice type is where your voice sits comfortably for a long time. A soprano with a practiced low extension can show a lower floor than a contralto who never sings down there, and neither label is wrong.

The range test answers yours in about a minute. Free, in the browser, no account needed. Mic audio is analyzed on-device and never leaves the device.

Link in bio.
```

**Alt text** (set per slide in Instagram's advanced settings — accessibility
first, and it is also indexed):

1. "The question 'What's my vocal range?' set in large type over a pitch trace."
2. "Two cards labelled Floor and Ceiling: your lowest note and your highest note."
3. "Bar chart of the eight voice types on one pitch axis from E2 to C6: bass E2–E4, bass-baritone F#2–F#4, baritone A2–A4, tenor C3–C5, contralto F3–F5, countertenor G3–G5, mezzo-soprano A3–A5, soprano C4–C6."
4. "Text explaining that vocal range and voice type are different measurements."
5. "Three steps: slide down to your floor, slide up to your ceiling, read your two notes and voice type."
6. "Find your range right now at sing.suedeai.ai — no install, no account, free."

**Facebook version:** same six images as an album, and open the caption with
the slide-4 point rather than the definition — the group audience there
mostly knows what a range is and the distinction is what earns the share.
