# Carousel: "When the numbers lie to you."

Seven slides, 1080×1350. From chapter 12 of The Measured Voice — free, served
unpaywalled at `/book/when-numbers-lie`.

Seven rather than six because the silence check on slide 5 is the most
actionable thing in the book, and folding it into another slide would waste
it.

| Slide | Does |
|---|---|
| 1 | "Bad data does not feel like bad data. It feels like a verdict." |
| 2 | Every number measures your singing *and* the conditions you sang in |
| 3 | Four things that corrupt a session |
| 4 | The false range test — you sang it, the app didn't hear it |
| 5 | **The ten-second silence check**, drawn: clean vs noisy room |
| 6 | Tells that a session went wrong, and the one question to ask |
| 7 | The closer, and the free chapter |

## Why this is the strongest of the three carousels

It is a measurement product telling you when to distrust its own
measurements. That is a hard thing to fake and an easy thing to trust, and it
does more for the brand than a feature post can. It also gives the audience
something to *do* in ten seconds, which is what earns a save.

## Quotation rule

Same as the other book carousel, enforced mechanically:

```bash
node marketing/social/assets/verify-quotes.mjs
```

Serif under an open quote mark is verbatim; sans-serif is editorial summary
and never the author's words. Slides 3 and 6 compress longer passages and are
deliberately not styled as quotation. The script reads the `SOURCE:` line in
`slides.html` and checks every serif-set line against that chapter. It covers
all carousels at once, so run it after editing any of them.

## Re-render

```bash
node marketing/social/assets/carousel-numbers/render.mjs
```

## Caption (paste-ready)

```
"Bad data does not feel like bad data. It feels like a verdict."

Every number a practice app shows you measures two things at once: your singing, and the conditions you sang in. Usually the second is quiet enough to ignore. Sometimes it's louder than the first, and you end up reading the room instead of your voice.

A range test that comes back short doesn't announce itself as a microphone problem. It announces itself as loss — and a singer who believes they've lost a third starts pushing to get it back, which is the wrong answer to a measurement error.

So before your next test: open the pitch studio and stay silent for fifteen seconds. If the trace reports any pitch at all while you're quiet, find the noise and kill it. Otherwise your low notes are measuring your room.

"One discarded test costs you nothing. One believed bad test sends you chasing a problem that was never in your voice."

Chapter twelve is free to read. Link in bio.
```

**Alt text** (per slide):

1. "Quotation: Bad data does not feel like bad data. It feels like a verdict."
2. "Quotation: Every number the app shows you measures two things at once — your singing, and the conditions you sang in."
3. "Four cards: room noise, mic distance, headphone bleed, and the day itself — the four things that corrupt a practice session."
4. "Quotation: You sang the note, the app did not hear it, and the result says you cannot reach it."
5. "Two panels comparing a silence check. Clean: an empty pitch trace. Noisy room: scattered red marks showing phantom notes with nobody singing."
6. "Four tells that a session went wrong, and the question to ask: was this session measurable?"
7. "Quotation: One discarded test costs you nothing. One believed bad test sends you chasing a problem that was never in your voice. From The Measured Voice, chapter twelve, free to read."
