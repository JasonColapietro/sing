# Fleet pass 5: code bloat and fragility

Repo: `/home/user/sing` at `ef801f4` (branch `fleet-pass-5` = main after #263). This was a read-only audit. Commands were run in this container (Node 22). Scratch logs are in this folder: `knip.log` (default config), `knip-tests.log` (tests counted as entries), `vitest.json`, `vitest.log`, `cr.tsv` (per-file comment counts), `ci-jobs.json`, `ls.log` (the layout-shift job log).

## Headline numbers

| Metric | Pass 4 (`384574e`) | Now (`ef801f4`) | Delta |
|---|---|---|---|
| Tracked files | 1,082 | 1,054 | -28 |
| Tracked bytes (`git ls-files -z \| xargs -0 du -cb`) | 22,436,451 | **20,380,425** | **-2,056,026 (-9.2 %)** |
| `content/pdfs/*.pdf` | 6,317,412 | 5,587,477 (27.4 %) | -729,935 (re-rendered) |
| Generated TS (`lib/*-data.ts` + `singers-lite.ts`) | 2,463,943 | 2,372,734 (11.6 %) | -91 KB (lessons trimmed) |
| `marketing/**` | 2,426,243 | 194,069 | -2.23 MB (PNGs gone) |
| `.agents/**` | 307,332 | 181,847 | -4 skills |
| New in #263: `public/room-{range,studio,progress}.png` | 0 | 1,002,576 | +1.0 MB (780×1688 RGB PNG) |
| New in #263: `docs/audits/**` | ~0 | 243,674 | +244 KB of committed audit reports |
| Unit tests | 249 files, 3,462 tests, 68.2 s | 253 files, 3,503 tests (3,495 pass, 8 skip), **59.4 s** | -8.8 s |
| Test lines | 44,677 | 44,947 | +270 |
| Comment ratio (pass-4 method, app/components/lib, non-test, non-generated) | 15,857 / 64,053 = 19.8 % | 14,844 / 63,085 = **19.0 %** | -1,013 comment lines |
| Dated comment lines / "used to, no longer, replaced" lines | 34 / 117 | 30 / 114 | about flat |
| knip unused exports (tests counted as users) | 52 values + 60 types | **48 values + 55 types** | 21 of the 31 pass-4 symbols removed |
| knip unused files (non-test, real) | 3 DSP + 2 scripts + skills | **1** (`lib/singer-search-priority.ts`) | |
| CI PR wall (last green run) | 18.2 min (run 40552668972) | **18.7 min** (run 40798206122) | Chromium cache hit everywhere, but layout-shift is now the critical path |
| CI on push to main | none | 2.2 min (run 40800510840, checks only) | new |
| tsc / lint / vitest | green | green (tsc exit 0; eslint exit 0, 30 s; vitest 0 failures) | |

## Status of pass-4 findings

| # | Pass-4 finding | Status | Evidence now |
|---|---|---|---|
| B1 | `content/pdfs` 6.3 MB committed build output | **STILL OPEN** | 5,587,477 B. #263 re-rendered both PDFs, which added about 5.6 MB of new history. No Blob storage, no LFS. |
| B2 | `marketing/**` 2.4 MB of PNGs | **FIXED** (PNGs) / PARTLY (dir) | 28 slide PNGs and `fb-cover` deleted. 194 KB remains (md, `slides.html`, `render.mjs`, `avatar-512.png`). |
| B3 | 3 dead DSP modules + tests | **FIXED** | `ls lib/audio \| grep -E 'onset\|register-m\|spectral-env'` returns nothing. |
| B4 | Generated TS committed (2.46 MB) | **PARTLY** | Still committed with no `.gitattributes` `linguist-generated`. Staleness is now guarded: `lib/generated-data.test.ts` runs all 4 compilers with `--check`. |
| B5 | Vendored skills + eslint sweep | **PARTLY** | 4 of 8 skills deleted. `eslint.config.mjs` still has no `.agents/**` ignore (`eslint --debug .agents` lints 3 files). knip counts each template twice through the `.claude/skills` symlinks. |
| B6 | Stale planning/handoff docs | **FIXED** | `.planning/` deleted. 10 docs moved to `docs/archive/`. `AGENTS.md` names the current handoff. Still present: `docs/specs/2026-10-25-framework-security.md`. |
| B7 | Icon/glyph wrappers duplicated | **STILL OPEN** | Same 6 files, same line counts (130/90/97/130/96/34). See clusters. |
| B8 | Test duplication | **PARTLY** | cap-controls merged into `components/practice/cap-controls.test.tsx` (FIXED). The hooks runner is still in 4 files (`grep -rl "Effects did not settle"`). The free-cap mock preamble is now in 7 files (was 6). |
| B9 | Freshness pins (sha256 + dates) | **STILL OPEN, churned again** | `lib/singer-page-freshness.test.tsx:44-49` re-pinned to `2026-10-28` in #263. `SINGER_PAGE_REVISED` moved (`lib/singer-evidence.ts:326`). `public/ai-instructions-sitemap.xml` is still a hand-edited `2026-10-27`. |
| B10 | Comment volume, stale history | **PARTLY** | 19.8 % → 19.0 %. Of the 10 pass-4 spot checks, 3 are fixed (vitest worktree note, ci.yml "mic hook not unit-tested", analyze-tools spec archived). Still open: `lib/llms-txt.ts:4-14`, `lib/organization.ts:15-27,38,64`, `lib/singers.ts:127-141,196`, `lib/app-store.ts:11-15`, `lib/og.ts:82`, `lib/audio/latency.ts:75` `MEASURED_ONSET_LAG_SEC`. |
| B11 | Small orphans | **MOSTLY FIXED** | precomposed icon, the 2 `.txt` files and `port-voice-lessons.mjs` are deleted. `audit-technique.mjs` is now wired (`scripts/audit-technique.test.mjs`). Still open: `assets/suede-mark-400.png` (135 KB), `lib/query-ownership.ts` (test-only), `components/prepaint.testing.ts` (not moved to `tests/`). |
| B12 | 52 unused exports | **PARTLY** | 21 of the 31 named symbols are gone. Still exported with no importer: `BACKUP_MIN_INTERVAL_MS`, `xpForSession`, `WARMUP_MODES`, `MIN_SCORED_SEC`, `powerSpectrum`, `BREATH_FFT_SIZE`, `BREATH_SPLIT_HZ`, `DEFAULT_DEVICE_ID`, `GuidedCapNote`, `STRIP_LOW/HIGH`, `midiToStripX`, `clientKey`, `SyncRefusedError`, `SYNC_NETWORK_ERROR`, and 8 `progress-shape` validators. |
| B13 | `server-only` unlisted dependency | **STILL OPEN** | knip "Unlisted dependencies (8)": 7 `lib/*` files import `server-only`, which is not in package.json. |
| D1 | Chromium uncached | **FIXED** | All 6 browser jobs log `Cache restored from key: playwright-chromium-Linux-1.62.1`. The install step (deps only) takes 9-23 s, down from 17-582 s. |
| D2 | No CI on main | **FIXED** | `on: push: branches: [main]` runs checks only. Run 40800510840: 2.2 min, success. |
| D3 | Compilers without `--check` | **FIXED** | `lib/generated-data.test.ts` (440 ms). `lib/voice-lessons.test.tsx:140-145` still spawns `compile-lessons --check` a second time (duplicate). |
| D4 | Matrix as bash in YAML | **FIXED** | `e2e/suite.mjs` (241 lines) + `e2e/suite.test.mjs`, plus `npm run e2e:suite`. |
| D5 | Split layout-shift | **PARTLY (unbalanced)** | `layout-shift` takes 820 s and `layout-shift-finished` takes 155 s. See CI section. |
| D6 | Node pins | **FIXED** | `.nvmrc` = 24, `engines >=24`, and `node-version-file: .nvmrc` in both workflows. indexnow is on v5 actions. |
| D7 | `deploy-prod.sh` builds twice | **FIXED, but now more fragile** | It now uses `vercel build` + `deploy --prebuilt`, so it builds once. The 30-line clean-tree/`origin/main` guard was deleted, and the comment only *asks* for a clean origin/main (see P2-4). |
| D8 | Two test runners | **FIXED** | `"test": "vitest run"`. The indexnow test runs under vitest (27 ms). |
| D9 | `audit-technique.mjs` unrun | **FIXED** | `scripts/audit-technique.test.mjs`. |
| D10 | Browser audits split between scripts/ and e2e/ | **STILL OPEN** | `scripts/audit-{mic-gate,share-cards,warmup-timing}.mjs` and the new `scripts/render-room-shots.mjs` are all Playwright. #263 added the same `openPath` to all three (see clusters). |
| D11 | Agent residue | **FIXED** | 4 skills, `.planning` and the `.gitignore` lines are gone. The git-identity comment was corrected. |
| D12 | Dead config (vitest worktree exclude) | **FIXED** | `vitest.config.mts` is 12 lines. |

## Findings ranked

### P1

**P1-1: the layout-shift shards are 5.3:1 unbalanced, which sets the whole PR's wall time.**
- Paths: `e2e/suite.mjs:110-135`, `.github/workflows/ci.yml` matrix.
- Evidence: in run 40798206122, `layout-shift` took 869 s (suite 820 s) and `layout-shift-finished` took 199 s (suite 155 s). Every other job finished by 01:18. The log (`ls.log`) shows where the time goes. The two full-route mobile runs take 240 s (`cls.mjs --viewport=mobile-375`, 01:09:58→01:13:58) and 238 s (`--returning`, →01:17:56). The remaining 13 targeted runs take 16-37 s each (342 s total). The split was made by command count (13 vs 12), not by time. The wall time did not improve over pass 4 (18.2 → 18.7 min) even though Chromium is now cached, because the suite grew by about 160 s of new states.
- Recommendation: move `layout-shift-returning` into the `finished` shard. That gives about 582 s and 393 s. Better still, make three shards: {full mobile}, {returning + deeplinks + singers-tall}, {all `stateRuns`}, each about 240-330 s.
- Saves: about 4-8 min of PR wall time.
- Risk: low. `e2e/suite.test.mjs` keeps the matrix list equal to `SUITES`.

**P1-2: `content/pdfs` is still 27 % of the tree, and #263 rewrote it again.**
- Path: `content/pdfs/the-voice-atlas.pdf` (4,830,872 B), `the-measured-voice.pdf` (756,605 B).
- Evidence: `git show --stat ef801f4` shows `Bin 5275536 -> 4830872` and `Bin 1041876 -> 756605`. Every re-render adds about 5.6 MB of history.
- Recommendation: move both files to Vercel Blob or Git LFS (unchanged from pass 4).
- Saves: 5.6 MB per re-render.
- Risk: medium. It touches the `/api/book/pdf` route and `outputFileTracingIncludes`.

### P2

**P2-1: icon and glyph duplication was untouched by #263 and is now 5 mic glyphs.**
- See the clusters table. Saves about 120 lines. Risk: low.

**P2-2: `BLACK_PCS = new Set([1,3,6,8,10])` appears 10 times, and `isBlack()` 3 times.**
- Locations: `app/singers/[slug]/opengraph-image.tsx:9`, `components/singers/{chromatic-strip:12,og-card:3,directory:229}`, `components/progress/voice-card.tsx:19`, `components/figures/range-figure.tsx:22` (new in #263), `components/tools/piano.tsx:11`, `components/range/piano-strip.tsx:24`, `components/range/result-view.tsx:445`.
- `og-card.tsx:165` exports it, and knip finds no importer.
- Recommendation: add `isBlackKey(midi)` to `lib/audio/notes.ts`.
- Saves: about 20 lines, plus one place to change.
- Risk: none.

**P2-3: session-summary duplication (songs vs warmups, plus the range result).**
- `scoreTone` is copied twice. `TONE_TEXT` is copied 3 times: `songs/session-summary.tsx:35`, `songs/result-card.tsx:16`, `warmups/session-summary.tsx:78`.
- The "Saved to your progress" card is copied 3 times: `songs/session-summary.tsx:442-466`, `warmups/session-summary.tsx:369-381+`, `range/result-view.tsx:704-724`.
- Recommendation: export `TONE_TEXT` and `scoreTone(score, floor=50)` from `components/songs/grade.ts`, and add `components/practice/saved-card.tsx` (`xp`, `streak?`, `achievements`).
- Saves: about 60 lines.
- Risk: low. Tests pin the copy "Saved to your progress" and "Sing tomorrow to make it".

**P2-4: `scripts/deploy-prod.sh` lost its guard.**
- Evidence: the `384574e` version refused a dirty tree and any `HEAD != origin/main` (`git show 384574e:scripts/deploy-prod.sh` lines 18-29). The new version runs `vercel build` + `deploy --prebuilt --prod` from whatever is checked out. With `--prebuilt`, the local tree *is* what ships, so the 2026-07-30 incident the guard was written for ("run from a worktree four commits behind main") can now happen silently.
- Recommendation: restore a 4-line check (`git status --porcelain` empty, `git fetch`, `HEAD == origin/main`), or use `vercel redeploy` as pass 4 suggested.
- Risk: none.

**P2-5: routine helpers are repeated across 3 rooms after the step-runner merge.**
- `components/practice/step-runner.ts` unified the phase machine. Each room still hand-writes the same pieces:
  - `*ById` (4 lines): `warmups/routines.ts:225`, `ear/routines.ts:158`, `breath/routines.ts:186`.
  - `*RoutineSeconds` / `*Minutes` (`max(1, round(s/60))`): 3 copies.
  - `STEP_INTRO_SEC = 4` / `EAR_STEP_INTRO_SEC = 4` / `BREATH_STEP_INTRO_SEC = 4`.
  - `*IntroFreeLeft`, identical except for the seconds function: `ear/ear-runner.tsx:51-60`, `breath/breath-runner.tsx:107-116`, `warmups/routine-runner.tsx:48`.
  - `recommendBreathRoutine` re-implements `breathRoutineById` inline (`breath/routines.ts:404-407`).
- Recommendation: add `routineCatalog(list, stepSec)` → `{byId, seconds, minutes}`, plus `introFreeLeft(secAhead, cap)` and `STEP_INTRO_SEC` in `step-runner.ts`.
- Saves: about 50 lines.
- Risk: low. Covered by `*/routines.test.ts`.

**P2-6: the test hooks harness is still copied 4 times.**
- About 50 lines in each of `components/{ear/mic-interruption,breath/sustain-interruption,breath/breath-cue-drill-interruption,tools/metronome-lifecycle}.test.tsx`, lines 6-55.
- The `vi.mock("@/lib/free-cap")` preamble is in 7 files.
- Recommendation: move the harness to `tests/hooks-harness.ts` and add `tests/mock-free-cap.ts`.
- Saves: about 250 lines.
- Risk: low. `vi.hoisted` needs the import inside the factory.

**P2-7: label drift that survived the #263 naming decisions.**
- The pass-4 reading audit decided "Recorder everywhere". "Take recorder" remains at `app/tools/page.tsx:37`, `app/learn/page.tsx:92` and `components/landing/comparison.tsx:23`.
- The rooms say "routine", but `components/breath/breath-runner.tsx:204` cap copy says "Breath sets share the free plan's…".
- 24 comment lines still say "workout" (see stale list).
- Recommendation: belongs to the copy lane. A one-line sweep fixes it.
- Risk: none. Check the tests that pin these labels.

**P2-8: the freshness pins churn on every pass.**
- `lib/singer-page-freshness.test.tsx:44-49` was re-pinned in both #261 and #263.
- Recommendation: unchanged from pass 4 (derive the fingerprint and generate the sitemap lastmod).

### P3

**P3-1: dead file `lib/singer-search-priority.ts` (41 lines).**
- `VOCAL_RANGE_PRIORITY_SLUGS` has zero importers. The only mention elsewhere is a *negative* assertion on a data attribute (`lib/singer-hub.test.tsx:127`).
- Its header is a 4-entry dated changelog.

**P3-2: dead "page" tone branches left after the page variants were removed.**
- `components/breath/breath-gate.tsx:26` (`tone: "page" | "session"`, 6 ternaries) and `components/breath/sustain-test.tsx:41-54,74` (`LevelMeter tone = "page"`, 5 ternaries).
- Every caller passes `tone="session"` (`breath-cue-drill.tsx:399,409`, `sustain-test.tsx:455`).
- Saves about 15 lines.

**P3-3: e2e helpers duplicated by #263.**
- `openPath` is defined 3 times: `e2e/mic-release.mjs:167` and `scripts/audit-warmup-timing.mjs:213` are byte-identical, and `scripts/audit-mic-gate.mjs:44` is a DOM variant.
- `escapeRe` and `pathRow` are each defined twice (`mic-release.mjs:161-162` and `audit-warmup-timing.mjs:203,218`).
- `--executable=` argv parsing is in 15 files (2 spellings: `.slice(13)` and `.slice("--executable=".length)`).
- Recommendation: add `e2e/lib/warmups-path.mjs` and `e2e/lib/cli.mjs` (`{base, executable, json}` + `launch()`), and move the 4 Playwright `scripts/audit-*`/`render-room-shots` files into `e2e/`.
- Saves about 70 lines.

**P3-4: knip un-export candidates new in #263 (used only in their own file).**
- `ROUTINE_LABELS` (`practice/step-intro.tsx`), `afterStep` (`practice/step-runner.ts:13`), `MIC_PRIVACY` (`ui.tsx:486`), `scoreMeasuredLine`, `stepsNotReached`, `finishedGoBacks`, `routineMeta`, `formLabel`, `shortTopCanLower`, `toneForGrade`, `midiToOctave`, `dbToPower`, `IconArrowLeft` (`warmups/icons.tsx`; songs has its own).
- Duplicate export: `ClerkAuthBridge` + `default` (`clerk-auth-bridge.tsx:17,34`; only the named export is imported).

**P3-5: duplicate staleness spawn.**
- `lib/voice-lessons.test.tsx:140-145` repeats `compile-lessons --check`, which `lib/generated-data.test.ts` already runs. Delete it to save about 0.4 s.

**P3-6: room screenshots are uncompressed PNG.**
- `public/room-*.png` is 1,002,576 B (780×1688 8-bit RGB). They are served through `next/image`, so the runtime cost is low, but the repo pays about 1 MB each time `scripts/render-room-shots.mjs` re-runs.
- Recommendation: make the script write a quantized PNG or WebP (likely 60-70 % smaller).

**P3-7: three unreferenced screenshots, superseded by the room shots.**
- `public/shot-01-start-the-session.png`, `shot-02-hear-it-sing-it-back.png`, `shot-05-track-the-work.png` (269,970 B). See the safe-to-delete list.

**P3-8: `eslint.config.mjs` has no `.agents/**` ignore, and `server-only` is undeclared.** Both are carried over from pass 4.

## Duplication clusters

"% identical" is `difflib.SequenceMatcher` over trimmed non-blank lines (script `sim.py`). It includes trivial lines such as `}` and `);`, so read it as an upper bound.

| Cluster | Files (lines) | % identical | Recommendation | Lines saved |
|---|---|---|---|---|
| Room icons, stroke 24-box | `components/songs/icons.tsx` (130), `components/warmups/icons.tsx` (90) | 84 % of warmups is in songs (66/79 lines). Identical `Svg` wrapper, `IconPlay/Minus/Plus/Mic/ArrowLeft/Metronome`. | Merge into `components/icons.tsx`. Warmups `IconArrowLeft` is already unused. | ~70 |
| Recorder icons, filled 16-box | `components/recorder/icons.tsx` (97) | 10-12 % vs songs (different style). Re-draws Play/Pause/Stop/Mic. | Keep the style, or move onto the shared set when restyled. | 0 now (~80 later) |
| Mic glyph ×5 | `songs/icons.tsx:65`, `warmups/icons.tsx:64` (identical), `ui.tsx:460-477` `MicGlyph`, `audio/audio-setup.tsx:265-279` `MicGlyph`, `recorder/icons.tsx:85` | ui and audio-setup are the same path data with the stroke split differently. songs and warmups are 100 % identical. | `ui.tsx` and `audio-setup.tsx` import the shared `IconMic` | ~30 |
| Glyphs | `components/landing/glyphs.tsx` (130), `components/pro/glyphs.tsx` (96) | 59 % of pro is in landing (identical 18-line `base()`) | Merge into `components/glyphs.tsx` | ~20 |
| Black-key set ×10 | see P2-2 | 100 % (one line + `isBlack` ×3) | `isBlackKey` in `lib/audio/notes.ts` | ~20 |
| Session summary | `songs/session-summary.tsx` (531), `warmups/session-summary.tsx` (487), `range/result-view.tsx:704-724`, `songs/result-card.tsx:16` | Files overall 23-26 %. `scoreTone` is 100 % except one constant (`HELD_FLOOR` = 50 = the literal). `TONE_TEXT` ×3 100 %. Saved card ×3 ~90 %. | Shared `TONE_TEXT`/`scoreTone` in `grade.ts` and a `SavedCard` | ~60 |
| Routine helpers | `warmups/routines.ts` (325), `ear/routines.ts` (195), `breath/routines.ts` (407) | Files 11-24 % (mostly catalogue data). The 4 helpers are about 95 % identical. | `routineCatalog()` + shared `STEP_INTRO_SEC` | ~30 |
| Intro "free left today" | `ear-runner.tsx:51-60`, `breath-runner.tsx:107-116`, `routine-runner.tsx:~40-49` | ear and breath are 100 % except the seconds function | `introFreeLeft()` in `step-runner.ts` | ~18 |
| Ear vs breath runner | `ear/ear-runner.tsx` (357), `breath/breath-runner.tsx` (494) | 38 % of ear in breath (results screen scaffolding, cap slide, intro wiring) | After the above, consider a shared `RunResults` scaffold | ~40 (later) |
| e2e `openPath`/`pathRow`/`escapeRe` | `e2e/mic-release.mjs:161-170`, `scripts/audit-warmup-timing.mjs:203-221`, `scripts/audit-mic-gate.mjs:44-52` | 2 of 3 byte-identical (added by #263) | `e2e/lib/warmups-path.mjs` | ~20 |
| e2e CLI boilerplate | 15 files parse `--executable=`; 28 files call `chromium.launch` | 2 spellings, same semantics | `e2e/lib/cli.mjs` | ~50 |
| Hooks harness (tests) | 4 `*-interruption`/`lifecycle` tests, lines 6-55 each | ~98 % (the ear copy is one line shorter) | `tests/hooks-harness.ts` | ~150 |
| free-cap mock preamble | 7 test files | ~90 % | `tests/mock-free-cap.ts` | ~80 |
| Figures (new in #263) | `components/figures/*` (8 files, 628 lines), `learn/reference-figure.tsx`, `breath/drill-figures.tsx` | Low. They share `FigureFrame`, `ExampleChip`, `cn` and `lib/chart-colors`. `reference-figure.tsx:101` re-implements `cn`, as do 11 other `filter(Boolean).join(" ")` sites. `range-figure.tsx` vs `range/piano-strip.tsx` is 29-42 % (keyboard drawing). | Keep. Optionally have `range-figure` reuse piano-strip's key geometry. | ~10 |
| **Total** | | | | **~600 now** |

## Comment bloat

Method: `cr.awk` over the 364 non-test, non-generated `.ts/.tsx` files in `app/ components/ lib/`. A line counts as a comment if it starts with `//`, `/*`, `*` or `{/*`. Blank lines are excluded. Totals: 15,897 comment vs 62,032 code (20.4 % with JSX comments). With the pass-4 method (no `{/*`) it is 14,844 vs 63,085 = 19.0 %, down from 19.8 %.

### Worst 15 by ratio (files with at least 40 comment lines)

| Ratio | Comment | Code | File | Note |
|---|---|---|---|---|
| 0.84 | 41 | 8 | `lib/audio/frame-clock.ts` | unchanged since pass 4 |
| 0.64 | 63 | 35 | `lib/audio/latency.ts` | `MEASURED_ONSET_LAG_SEC` caveat still at :75 |
| 0.64 | 104 | 59 | `components/prepaint.tsx` | **grew from 51 to 104 comment lines in #263** |
| 0.63 | 67 | 40 | `lib/chart-colors.ts` | |
| 0.62 | 64 | 40 | `lib/organization.ts` | 6-date changelog |
| 0.62 | 43 | 26 | `app/robots.ts` | |
| 0.57 | 49 | 37 | `components/practice/program-range-note.ts` | new to the list |
| 0.57 | 48 | 36 | `lib/audio/f0-trace.ts` | |
| 0.54 | 80 | 67 | `lib/og.ts` | "production sweep on 2026-08-28" at :82 |
| 0.52 | 71 | 66 | `components/songs/types.ts` | |
| 0.51 | 40 | 39 | `components/account/save-state.ts` | |
| 0.48 | 65 | 70 | `lib/pro-inventory.ts` | |
| 0.48 | 47 | 51 | `components/range/pitch-meter-hint.ts` | |
| 0.47 | 78 | 89 | `lib/audio/voiced-run.ts` | |
| 0.46 | 59 | 69 | `components/practice/active-clock.ts` | |

By absolute count: `lib/programs.ts` 571, `components/songs/lib.ts` 453 (**up from 415**), `components/songs/song-player.tsx` 351, `lib/audio/pitch.ts` 266, `components/warmups/exercises.ts` 247, `components/pro/pro-client.tsx` 247, `components/range/result-view.tsx` 234, `lib/pro.ts` 214, `components/progress/progress-client.tsx` 199, `components/warmups/exercise-player.tsx` 197.

### 10 stale comments (references that no longer hold after #263)

| # | Location | Why it is stale |
|---|---|---|
| 1 | `components/weekly-report-card.tsx:154` | "The drawer-close pattern from v2-banner.tsx". `components/v2-banner.tsx` was deleted in #263. |
| 2 | `e2e/audits/80-states.mjs:320-322` | "every breath set opens on a silent drill … (the first mic drill in the path, components/breath/drills.ts)". No `drills.ts` exists (drills live in `components/breath/routines.ts`), and sets are now "routines". |
| 3 | `components/pro/moments.tsx:61` | "app/api/checkout/route.ts:36-37 builds the return URLs". They are at `route.ts:94-95`. |
| 4 | `components/breath/breath-runner.tsx:99` | Orphan `/** Stars for one drill… */` stacked directly on `breathIntroFreeLeft`'s doc. The function it describes, `starsForDrillResult`, sits at :118 with no doc. |
| 5 | `scripts/audit-warmup-timing.mjs:205-211` | The `pathRow` doc block was left above `openPath`'s doc when #263 inserted `openPath`. `pathRow` at :217 now has no doc. |
| 6 | `components/ear/{pitch-match-game.tsx:142,148,320, note-catcher-game.tsx:70,88,91,281,287,339, melody-echo-game.tsx:42,45,201, higher-lower-game.tsx:58, interval-game.tsx:42}` | "one step of a workout", "a workout's microphone". #263 unified the UI on "routine" ("Quit routine"), and the identifiers say `routine`. That is 17 comment lines. |
| 7 | `lib/prepaint-config.ts:42`, `lib/prepaint.ts:35`, `components/prepaint.tsx:106`, `components/ear/routines.ts:2,8,190`, `e2e/cls.mjs:239` | Same "workout" term, in the layout-critical prepaint docs. |
| 8 | `components/breath/breath-gate.tsx:25-26`, `components/breath/sustain-test.tsx:45-46` | "The session surface is dark and takes the scoped tokens instead" documents a page/session choice. The page variant was removed in #263, and every caller passes `"session"`. |
| 9 | `.github/workflows/ci.yml:79` | "a push to main has already had its browser run". This is false in the merge-skew case that lines 8-9 of the same file give as the reason push CI exists. It should say "browser runs are PR-only; main re-runs the static checks". |
| 10 | `lib/llms-txt.ts:4-14`, `lib/organization.ts:15-27`, `lib/app-store.ts:11-15`, `lib/singer-search-priority.ts:4-12` | Dated changelogs or histories of deleted things (a removed `public/llms.txt`, a retired slug, six verification dates, four Search Console refreshes in a dead file). The first three are carried over from pass 4. |

## Test cost

`npx vitest run --reporter=verbose` (with the JSON reporter alongside): 253 files, 3,503 tests (3,495 pass, 8 skipped, which is the same intentional pair as pass 4). Wall 59.4 s (transform 14.6 s, import 56.6 s, tests 76.3 s summed). Time by directory: `lib` 30.1 s, `lib/audio` 27.0 s, `components` 12.7 s, `e2e` 2.8 s, `app` 1.7 s.

### Slowest 10 files

| ms | tests | file |
|---|---|---|
| 12,782 | 30 | `lib/audio/pitch-fft.test.ts` |
| 10,819 | 17 | `lib/audio/breath-detect.test.ts` |
| 5,899 | 20 | `lib/on-page-headings.test.tsx` |
| 3,616 | 129 | `lib/on-page-seo.test.tsx` |
| 2,824 | 63 | `lib/singer-page-search-intent.test.tsx` |
| 2,732 | 10 | `lib/audio/pitch-precision.test.ts` |
| 2,328 | 27 | `e2e/cls.test.mjs` |
| 1,884 | 62 | `lib/voice-lessons.test.tsx` (includes a duplicate `compile-lessons --check` spawn) |
| 1,577 | 38 | `lib/keyword-title-alignment.test.tsx` |
| 1,430 | 19 | `components/ear/lib.test.ts` |

The two DSP files are 23.6 s of 76 s summed (31 %). They are the right tests to keep, and they run in parallel. The three `on-page-*` SEO render files (12.3 s) re-render overlapping page sets, so a shared render cache would save about 6 s.

### Copy-pinning tests

There are 253 assertions with a literal of 40 characters or more. The most churn-prone files:

| File | Long-literal assertions |
|---|---|
| `components/programs/today-card.test.tsx` | 26 |
| `components/can-you-sing/verdict.test.tsx` | 21 |
| `components/range/result-view.test.ts` | 16 |
| `components/warmups/warmups-client.test.tsx` | 11 |
| `components/range/pitch-meter.test.tsx` | 11 |
| `lib/song-page.test.ts` | 10 |
| `lib/llms-txt.test.ts` | 9 |
| `components/progress/coach.test.tsx` | 9 |
| `scripts/audit-mic-gate.test.mjs` | 8 |
| `components/pro/pro-client.test.tsx` | 7 |

The date and hash pins are covered in P2-8. Harness duplication is covered in P2-6.

## CI timings

Source: `gh api repos/JasonColapietro/sing/actions/runs?branch=main`. The main push run 40800510840 (`ef801f4`) ran checks only: 124 s job, 2.2 min wall. The browser matrix runs on PRs only, so the last green full run is the #263 head: run **40798206122** (`ab409b3`, 01:05:03→01:23:47, **18.7 min wall**).

| Job | Total | npm ci | Chromium (deps; cache) | Suite | Note |
|---|---|---|---|---|---|
| Static checks and build | 169 s | 12 s | n/a | tsc 15, lint 26, test 54, build 41, artifact 14 | |
| Browser (layout-shift) | **869 s** | 11 s | 23 s, **hit** | **820 s** | critical path: full mobile 240 s + returning 238 s + 13 runs 342 s |
| Browser (audio) | 539 s | 6 s | 9 s, hit | 509 s | `mic-release.mjs` 199 s (39 %), breath-gate 93 s, pitch-precision 69 s |
| Browser (journeys) | 329 s | 9 s | 16 s, hit | 285 s | songs-modes 76 s, audit-mic-gate 68 s, navigation 44 s |
| Browser (layout-shift-finished) | 199 s | 8 s | 16 s, hit | 155 s | 12 short runs |
| Browser (mobile-audit) | 155 s | 10 s | 12 s, hit | 113 s | |
| Browser (desktop-audit) | 148 s | 6 s | 19 s, hit | 103 s | |

- **What dominates:** browser suite time, 1,985 s of 2,239 s across the browser jobs. Chromium is no longer a factor. All 6 jobs log `Cache restored from key: playwright-chromium-Linux-1.62.1`, and the remaining 9-23 s is `install-deps` apt work.
- **Critical path:** checks (169 s) → about 50 s of queueing and artifact restore → layout-shift (869 s).
- **Balance:** the shards are not balanced (820 s vs 155 s). Rebalancing as in P1-1 should bring the wall to about 13-14 min.
- **Second lever:** `e2e/mic-release.mjs` (199 s), the single slowest journey.
- Every job prints a Node 20 deprecation warning for `actions/upload-artifact@v4` / `download-artifact@v4` / `cache@v4`. These need bumping before the forced switch.

## Repo size

Now 20,380,425 B in 1,054 files, down 2.06 MB (9.2 %) from 22,436,451 B. Gross removals were about 3.3 MB (marketing PNGs 2.33 MB, PDF re-render 0.73 MB, skills 0.13 MB, `.planning` 0.06 MB, DSP 0.07 MB). Gross additions were about 1.25 MB (room PNGs 1.0 MB, `docs/audits` 0.24 MB).

### Largest tracked files

| Bytes | File | Verdict |
|---|---|---|
| 4,830,872 | `content/pdfs/the-voice-atlas.pdf` | P1-2 |
| 845,194 | `lib/atlas-data.ts` | generated, guarded |
| 756,605 | `content/pdfs/the-measured-voice.pdf` | P1-2 |
| 613,205 | `lib/singers-data.ts` | generated, guarded |
| 549,733 | `lib/lesson-data.ts` | generated, guarded |
| 399,456 | `lib/audio/pitch-regressions.json` | test fixture for `pitch-regressions.test.ts`; keep |
| 354,115 | `public/room-progress.png` | P3-6 |
| 324,704 | `public/room-studio.png` | P3-6 |
| 323,757 | `public/room-range.png` | P3-6 |
| 277,590 | `package-lock.json` | keep |
| 201,398 | `lib/book-data.ts` | generated |
| 165,442 | `public/founder-portrait.jpg` | used |
| 163,204 | `lib/singers-lite.ts` | generated |
| 135,254 | `assets/suede-mark-400.png` | only read by `scripts/build-icons.mjs` |
| 109,812 | `contracts/suede-vocal.json` | cross-repo contract; keep |

## Safe-to-delete list (with grep proof)

1. **`lib/singer-search-priority.ts`** (41 lines). Proof: `grep -rlw VOCAL_RANGE_PRIORITY_SLUGS --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next .` returns only `./lib/singer-search-priority.ts`. `grep -rn singer-search-priority app components lib` returns only `lib/singer-hub.test.tsx:127`, which is `expect(html).not.toContain("data-singer-search-priority")` (a string, not an import). knip reports it as the one unused file.
2. **`public/shot-01-start-the-session.png`, `public/shot-02-hear-it-sing-it-back.png`, `public/shot-05-track-the-work.png`** (269,970 B). Proof: `grep -rnF "shot-0" --exclude-dir={node_modules,.git,.next} . | grep -v ^./docs/` returns 3 lines:
   - `components/landing/ios-band.test.tsx:40` asserts they are *not* used.
   - `next-config.test.ts:64` uses the path only as a sample string for the cache-header regex; it passes without the file, but swap it for `/room-range.png` for clarity.
   - `marketing/social/instagram.md:206` is prose.
   - `ios-band.tsx` switched to `/room-range.png` in #263.
   - Caveat: if an App Store listing or external post hotlinks these URLs, keep them. Nothing in the repo does.
3. **Duplicate staleness test**: the `it("is compiled from content/lessons and not stale")` block at `lib/voice-lessons.test.tsx:140-145`. Proof: `lib/generated-data.test.ts:10-13` runs `compile-lessons.mjs --check` with the same assertion. Keep the second spawn at :160 (it tests a fixture dir).
4. **Unused export keywords** (drop `export`, keep the code). Proof: `grep -rlw <sym> app components lib contracts scripts e2e proxy.ts next.config.ts marketing | grep -v <file>` returns nothing for each of:
   - `MIC_PRIVACY` (`components/ui.tsx:486`)
   - `afterStep` (`components/practice/step-runner.ts:13`)
   - `ROUTINE_LABELS` (`components/practice/step-intro.tsx`)
   - `scoreMeasuredLine` (`components/warmups/session-summary.tsx:96`)
   - `stepsNotReached` (`components/warmups/routine-summary.tsx:43`)
   - `finishedGoBacks` (`components/programs/today-card.tsx:360`)
   - `routineMeta` (`components/ear/ear-training-client.tsx:68`)
   - `formLabel` (`components/songs/browse-controls.tsx:119`)
   - `shortTopCanLower` (`components/range/result-view.tsx`)
   - `toneForGrade` (`components/songs/grade.ts:69`)
   - `midiToOctave` (`lib/audio/notes.ts:43`)
   - `dbToPower` (`lib/audio/spectrum.ts:55`)
   - `GuidedCapNote` (`components/learn/module-practice.tsx:41`)
   - `BLACK_PCS` re-export (`components/singers/og-card.tsx:165`)
   - `export default` in `components/account/clerk-auth-bridge.tsx:34` (the only importer, `clerk-shell.tsx:4`, uses the named export)
   - Plus the pass-4 carry-overs listed in B12.
5. **`IconArrowLeft` in `components/warmups/icons.tsx:72-77`**. Proof: knip lists it as unused. `grep -rn "IconArrowLeft" components` matches only the songs definition and its use in `song-player.tsx:25,1579`, which imports from `./icons` (songs).
6. **Dead `"page"` tone branches**: `components/breath/breath-gate.tsx` (prop + 6 ternaries) and `components/breath/sustain-test.tsx` `LevelMeter` (prop default + 5 ternaries). Proof: `grep -rn "BreathGatePanel\|<LevelMeter" components | grep -v test` shows that the only callers of these two components (`breath-cue-drill.tsx:399,409`, `sustain-test.tsx:455`) all pass `tone="session"`. The other `LevelMeter`s (`audio-setup`, `pitch-meter`, `studio-client`) are different components.
7. **Orphan doc comments**: `components/breath/breath-runner.tsx:99` (move it to :118) and `scripts/audit-warmup-timing.mjs:205-211` (move it to `pathRow`). Comment-only changes.
