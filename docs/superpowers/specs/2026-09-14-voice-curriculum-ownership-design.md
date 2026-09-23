# Voice Curriculum Ownership Design

> **Superseded in part, 2026-09-23.** The owner decided that sing hosts the
> lesson bodies too, so GuitarHub stops rendering them and redirects
> `/learn/voice/**` to sing. This document records the 2026-09-14 discovery
> phase. Its `/learn` page was replaced by main's authority hub (#150), and
> only the catalog contract and `lib/voice-curriculum.ts` landed. See
> `docs/handoffs/2026-09-23-ship-loop.md`, section "S5b".

## Goal

Make Suede Sing the declared owner and discovery surface for the voice curriculum without breaking the 102 lesson URLs, GuitarHub lifetime access, or existing progress records.

## Product decisions

1. Automatic voice classification remains limited to Bass, Baritone, Tenor, Contralto, Mezzo-soprano, and Soprano. Bass-baritone remains a supported reference category but is not an automatic range-scan result until a validated classifier can distinguish it from the overlapping Bass and Baritone bands.
2. Imported Sing sessions are practice history, not lesson-completion evidence. They may preserve provenance and practice duration, but they cannot produce a ready/pass assessment, XP, a streak, or an achievement. A future importer may award completion only when the originating activity records the exact evidence required by the destination lesson.
3. Suede Sing owns voice-curriculum discovery and the curriculum catalog. GuitarHub temporarily remains the lesson renderer and entitlement gate until lesson bodies, identity, entitlement, and progress can move without regression.

## Scope

This phase establishes ownership without redirecting learners.

- Publish a versioned voice-curriculum catalog from the Sing repository.
- Add an indexable `/learn` curriculum destination to Sing that presents all seven stages and routes learners to the existing complete GuitarHub lessons.
- Record the three decisions in GuitarHub and bind them with tests.
- Add an explicit real-device release checklist for microphone scoring.
- Correct the existing Sing DST regression test so the baseline passes in any North American timezone used by development or CI.

This phase does not copy the 557 KB lesson-instruction corpus, move entitlements, import account identity, redirect existing URLs, or claim that browser tests validate physical microphones.

## Ownership and data flow

The Sing repository will contain `contracts/suede-voice-curriculum.json` as the canonical catalog contract. Version 1 contains the seven levels, 34 modules, and 102 published lesson previews currently authored in GuitarHub's `voice.json`, plus ownership and migration metadata.

Sing reads that local contract to render `/learn`. The page links each lesson to its current canonical GuitarHub URL and clearly labels GuitarHub as the temporary lesson host. This makes Sing the curriculum entry point without duplicating lesson bodies or pretending access has moved.

GuitarHub vendors the exact Sing contract and checks it against `sing@main`, using the same byte-comparison pattern already used for the vocal, glossary, and progress contracts. Its existing local voice catalog remains the runtime source during this phase, but parity tests require its public catalog fields to match the Sing-owned contract.

## Sing curriculum destination

`/learn` is a server-rendered, indexable curriculum hub using Sing's existing visual system. It includes:

- A concise explanation that the curriculum teaches voice while Sing's rooms measure the parts the browser can honestly measure.
- Seven stage sections with module names, outcomes, access labels, and lesson counts.
- Lesson links to `https://guitarhub.org/learn/voice/<lesson-id>` during the transition.
- The existing vocal-health boundary: stay in a comfortable range and volume; stop for pain or hoarseness; pitch readings do not assess vocal health.
- No claim that Bass-baritone is an automatic classifier result.

The route is included in Sing's sitemap. Individual lesson routes are not created in this phase, preventing duplicate pages and split canonical ownership.

## GuitarHub policy enforcement

The existing adjudication, Sing-session mapping, and cross-domain proposal become decided policy rather than open prose.

- `classifiableVoiceTypes` records the six-label decision with a decision date and owner.
- The import module exports a `historyOnly` completion policy, and tests prove every imported attempt remains `repeat` with no reward fields.
- The cross-domain decision records Sing as the eventual owner, GuitarHub as the temporary renderer, and redirects as blocked on identity, entitlement, progress, and lesson-body parity.

No runtime import behavior changes are required because the safe behavior already ships; this work makes it deliberate and regression-resistant.

## Real-device release gate

GuitarHub receives a manual audio-release checklist covering:

- iPhone Safari and one Chromium/Android device.
- Built-in microphone and, where available, Bluetooth input.
- Permission grant, denial, interruption, and recovery.
- An in-time rhythm attempt with reported input latency and an environment where latency is unavailable.
- Confirmation that silence and malformed input cannot pass.
- Keyboard and screen-reader access to start, stop, result, and retry controls.

The checklist requires the tester, device, OS/browser versions, date, and observed result. It explicitly distinguishes arithmetic compensation from measured end-to-end latency. A checked document is release evidence; CI remains code evidence.

## Migration gate

GuitarHub voice URLs may redirect only after all of the following are true:

1. Sing renders all 102 complete lesson bodies, not previews.
2. Existing GuitarHub lifetime access has an equivalent verified entitlement on Sing.
3. Existing progress and attempts survive the identity transfer without being duplicated or upgraded from `repeat` to `ready`.
4. Canonical, sitemap, internal-link, and permanent-redirect parity tests pass.
5. A qualified vocal-pedagogy and clinical-safety review covers advanced belt, weight, range-extension, and effects guidance.
6. The real-device audio checklist has current evidence for the release candidate.

## Failure behavior

- If the vendored curriculum contract differs from Sing, GuitarHub verification fails rather than silently serving a different catalog.
- If a Sing curriculum entry lacks a valid current host URL, the contract test fails.
- If an imported session attempts to award completion or rewards, tests fail.
- If migration prerequisites are incomplete, GuitarHub remains canonical and no redirect is added.

## Testing

Sing tests will validate the contract inventory, the six-label classifier policy, `/learn` rendering, sitemap inclusion, valid temporary lesson URLs, and the timezone-independent DST regression.

GuitarHub tests will validate byte parity with Sing, catalog parity for every level/module/lesson identifier, the decided policy metadata, history-only import behavior, and the absence of voice redirects before the migration gate is complete.

Both repositories must pass their full test, lint, typecheck, and production-build commands. GuitarHub must also pass all cross-repository contract checks. Real-device results remain a separate manual artifact and may not be inferred from CI.
