# Voice lessons

The lesson bodies for the voice course at `/learn/voice`, one markdown file per
lesson: `<stage>/<module>/<lesson>.md`. The directory and file names are the
URL slugs. The frontmatter `id` is the lesson's ID in
`contracts/suede-voice-curriculum.json`, which owns the titles, summaries,
outcomes and order.

After editing, run `node scripts/compile-lessons.mjs` to regenerate
`lib/lesson-data.ts`. The compile fails on a missing section, a title,
length or objective that disagrees with the catalog (the objective must equal
the catalog's summary), or practice blocks that don't add up to the lesson's
minutes. `lib/voice-lessons.test.tsx` fails if the generated
file is stale, if a lesson promises something sing can't measure, or if a
link leaves the rooms the suede-vocal contract publishes.

## Format

```
---
id: "v-l1-m1-01"
module: "v-l1-m1"
stage: "v-l1"
title: "…"            # must equal the catalog
type: "concept"       # must equal the catalog
minutes: 3            # must equal the catalog
objective: "…"        # must equal the catalog's summary
prerequisites: "v-l1-m1-01,…"
references: "nidcd-voice-care,…"   # ids in references.json
---

## In short

Required on a concept lesson, optional on the others, and first when present.
One plain paragraph that answers the question the title asks, in a singer's
words.

## Steps

### Step title

Instruction paragraphs.

- Look: what to check with your eyes
- Listen: what to check by ear

## If it goes wrong

- Observation => Recovery

## Practice blocks

- 30s: Instruction

## Self-check

- Criterion

Ready when: …

If not ready: …

What this shows: …

What this does not show: …
```

## In short

The steps say what to do; `## In short` says what the idea is. A lesson called
"Rate, Extent, Onset" should define all three before it asks for any of them.
Every concept lesson has one, and the compiler fails a concept lesson without
it.
The page prints the paragraph above the steps and uses it as the lesson's
structured-data description, so it is plain text: no headings, lists, links or
emphasis. Explain the idea and stop. It is not a promise, so it must not say
the app measures anything the module's practice panel doesn't (see
`lib/lesson-practice.ts`). Health and safety claims come from the sources in
`references.json`.

## Shared text

Some lines are on almost every lesson because the port gave every lesson the
same frame: the look and listen checks on "Use the practice material" and
"Set a safe baseline", the "treat the reading as missing" recovery, the last
self-check criterion and the default "Ready when". The lesson page leaves out
any line that more than half the lessons share (`UNIVERSAL_LESSON_TEXT` in
`lib/voice-lessons.ts`), and `/learn/voice` states those rules once. A
"Review your own attempt" step that only restates the first self-check
criterion is left out too. Write a lesson its own "Ready when" line, or its own
review step, and the page shows it.

## Where the text came from

Ported from GuitarHub (`JasonColapietro/suede-guitar-hub`,
`lib/learning/data/voice-instruction.json` as of its #47) by
`scripts/port-voice-lessons.mjs`. The text is copied, not rewritten, except for
sentences that pointed at GuitarHub's own lesson panel (its practice material
tab, per-lesson recorder and saved self-check). Those are swapped for their sing
equivalents; the script lists each substitution. Rewording beyond that is done
here, in the markdown, and is visible in review.
