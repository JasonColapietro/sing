# Voice lessons

The lesson bodies for the voice course at `/learn/voice`, one markdown file per
lesson: `<stage>/<module>/<lesson>.md`. The directory and file names are the
URL slugs. The frontmatter `id` is the lesson's ID in
`contracts/suede-voice-curriculum.json`, which owns the titles, summaries,
outcomes and order.

After editing, run `node scripts/compile-lessons.mjs` to regenerate
`lib/lesson-data.ts`. The compile fails on a missing section, a title or
length that disagrees with the catalog, or practice blocks that don't add up
to the lesson's minutes. `lib/voice-lessons.test.tsx` fails if the generated
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
objective: "…"
prerequisites: "v-l1-m1-01,…"
references: "nidcd-voice-care,…"   # ids in references.json
---

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

## Where the text came from

Ported from GuitarHub (`JasonColapietro/suede-guitar-hub`,
`lib/learning/data/voice-instruction.json` as of its #47) by
`scripts/port-voice-lessons.mjs`. The text is copied, not rewritten, except for
sentences that pointed at GuitarHub's own lesson panel (its practice material
tab, per-lesson recorder and saved self-check). Those are swapped for their sing
equivalents; the script lists each substitution. Rewording beyond that is done
here, in the markdown, and is visible in review.
