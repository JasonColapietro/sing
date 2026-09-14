# Voice Curriculum Ownership Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Steps use checkbox syntax.

**Goal:** Publish the Sing curriculum hub and contract, enforce GuitarHub's transition policy, and prepare honest audio-release evidence.

**Architecture:** Sing owns a versioned catalog and `/learn` discovery page. GuitarHub remains the complete lesson host with unchanged identity, entitlement, and progress. Its vendor check compares the new catalog against published Sing main, so Sing must merge before the dependent GuitarHub PR can pass that check.

**Tech Stack:** Next.js App Router, TypeScript, React, Vitest (Sing), node:test (GuitarHub), JSON contracts.

**Spec:** docs/superpowers/specs/2026-09-14-voice-curriculum-ownership-design.md

## Global Constraints

- No redirects, account transfer, access changes, or reward changes in this phase.
- Preserve all 102 lesson identifiers, all 34 modules, and all seven levels.
- Automatic classifier remains six labels; imported sessions remain history-only.
- Reuse the complete current GuitarHub `voice.json` under the contract's `curriculum` key; do not invent lessons from `lessonsTotal`.
- Physical microphone and professional vocal-review evidence remains pending, never inferred from automated tests.
- Work on feature branches. Do not merge or deploy. Deliver follow-up PRs if configured access permits.
- New behavior gets failing tests before implementation; existing behavior receives direct regression coverage where appropriate.

## Shared interface

`contracts/suede-voice-curriculum.json` in both repositories uses this exact shape:

```ts
{
  contract: 'suede-voice-curriculum',
  version: 1,
  ownership: {
    catalogRepository: 'JasonColapietro/sing',
    discoveryUrl: 'https://sing.suedeai.ai/learn',
    lessonBaseUrl: 'https://guitarhub.org/learn/voice',
    decisionDate: '2026-09-14',
    decidedBy: 'Jason Colapietro (delegated decision)'
  },
  policies: {
    classifierLabels: ['bass', 'baritone', 'tenor', 'contralto', 'mezzo', 'soprano'],
    importedSessionCompletion: 'historyOnly'
  },
  migration: {
    phase: 'discovery',
    redirectsEnabled: false,
    requiredEvidence: ['lessonBodies', 'identity', 'entitlements', 'progress', 'urlParity', 'vocalReview', 'deviceAudio']
  },
  curriculum: /* exact parsed current GuitarHub lib/learning/data/voice.json */
}
```

### Task 1: Sing hub, contract, portable DST test

**Files:** Create `contracts/suede-voice-curriculum.json`, `lib/voice-curriculum.ts`, `lib/voice-curriculum.test.tsx`, `app/learn/page.tsx`. Modify `app/sitemap.ts`, `components/site-footer.tsx`, `lib/progress.test.ts`, and `contracts/README.md`.

**Consumes:** Current sibling GuitarHub voice.json; existing Sing classifier and PageShell.
**Produces:** Exact shared contract above; rendered `/learn` hub and typed consumer `voiceCurriculum` with `voiceLessonHref(lessonId: string): string`.

- [ ] Demonstrate the existing DST test fails under `TZ=America/Los_Angeles npx vitest run lib/progress.test.ts`.
- [ ] Replace fixed UTC boundary instants with local near-midnight fixtures that cover spring/fall US and EU changes. Assert calendar-day expectations explicitly; do not change production progress code or merely skip the regression. Run focused suite under LA, NY, UTC and London.
- [ ] Write tests before the new page/consumer exists. Expect seven sections, 34 module outcomes, 102 unique actual lesson links, free vs paid labels derived from level.access, own canonical via SITE_URL, one sitemap entry, and a footer link. Check the consumer rejects unknown lesson IDs rather than constructing arbitrary URLs.
- [ ] Materialize the shared contract using apply_patch (JSON copy from the sibling catalog, not hand-edited curriculum values).
- [ ] Implement a small typed catalog consumer and server-rendered hub using PageShell and current design tokens. Show honest temporary GuitarHub hosting/access explanation, safety boundaries, real lesson counts, and Sing practice-room links. Native details/summary is suitable for module lessons. No lesson-body duplication or new purchase logic.
- [ ] Bind automatic classifier results/registry to the six allowed labels through actual existing classifier data, not a new unused constant alone.
- [ ] Add footer/sitemap discovery and contract authoring documentation.
- [ ] Run focused tests then full tests, lint, typecheck and production build. Report warnings and failures accurately. Commit only task files; no push.

### Task 2: GuitarHub parity and decided policies

**Files:** Add the vendored contract, `scripts/sync-sing-curriculum.mjs`, `tests/voice-curriculum-ownership.test.ts`, `docs/voice-curriculum-ownership.md`, `docs/audio-release-checklist.md`. Modify `contracts/adjudications.ts`, `lib/learning-sync/sing-sessions.ts`, `lib/query-ownership.ts`, `package.json`, `.github/workflows/verify.yml` and existing relevant tests.

**Consumes:** Task 1 shared JSON contract (byte identical); existing vendor helper and validators.
**Produces:** A strict fourth sing contract comparison; documented decided policy; unchanged learner runtime semantics.

- [ ] Create `codex/voice-curriculum-ownership` branch in the clean GuitarHub checkout.
- [ ] Add failing parity tests: exact local catalog equality with contract.curriculum; import attempts cannot become ready or gain rewards; reference taxonomy still routes bass-baritone while automatic classifier labels remain the published six; executed next.config redirects contain no voice migration.
- [ ] Implement a no-provisional vendor script using the existing helper. Add it to contracts:check and CI. Do not weaken checks while upstream contract is unpublished.
- [ ] Mark classifier adjudication decided, export historyOnly import policy, replace the open cross-domain proposal with the approved discovery/temporary-renderer decision (retain export compatibility for tests).
- [ ] Write manual checklist with empty evidence fields for candidate SHA, tester, date, devices, browsers, permission/interruption/silence/latency/keyboard/screen-reader results. Missing evidence means NOT RELEASE VALIDATED. No fabricated passes.
- [ ] Run focused tests, full tests, lint, typecheck, build and vendor checks. Before Sing merges, validate local byte equality separately and report the fourth published-main check as expected blocked.
- [ ] Commit only task files; no merge/deployment.

### Task 3: Review and deliver

**Files:** Existing task reports and branch diffs; no unrelated production edits.

- [ ] Review each diff against its task requirements and fix substantive findings.
- [ ] Browser-check `/learn` at phone and desktop widths, all lesson links, accessible summaries, no horizontal overflow or JS errors. This is not physical microphone validation.
- [ ] Run final whole-branch review across both repositories and verify exact contract bytes agree.
- [ ] Open linked feature PRs using configured credentials, Sing first. State dependent merge order and pending human hardware/safety evidence. Do not merge.

## Progress

- Design approved by user: Go.
- Baselines: GuitarHub 1129 tests, lint/typecheck/build/three contract checks passed previously; Sing has reproducible timezone-biased test failure approved for repair.
