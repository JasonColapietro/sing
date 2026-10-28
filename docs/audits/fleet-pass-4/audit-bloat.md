# Bloat and redundancy audit

Repo: `/home/user/sing` (single squashed commit `384574e`, 2026-10-27). Read-only pass; every number below comes from the commands quoted. node_modules (732 MB) and the untracked `.next/` build output (509 MB) are ignored throughout.

## Headline numbers

| Metric | Value | Evidence |
|---|---|---|
| Tracked files | 1,082 | `git ls-files \| wc -l` |
| Tracked bytes (node_modules excluded) | 22,436,451 B (22.4 MB) | `git ls-files -z \| xargs -0 wc -c \| tail -1` |
| Hard bloat: not needed to build, run or test | ~3.10 MB (13.8 %) | marketing 2,426,243 + .agents 307,332 + stale docs ~153,000 + .planning 60,919 + assets 135,254 + dup icon 10,440 + orphan txt 239 + one-shot scripts 12,514 |
| Committed generated TS that is derivable from `content/` + `data/` | 2,463,943 B (11.0 %) | `lib/atlas-data.ts` 845,194 + `lib/lesson-data.ts` 640,893 + `lib/singers-data.ts` 613,254 + `lib/book-data.ts` 201,398 + `lib/singers-lite.ts` 163,204 |
| Runtime-required but derivable binaries (`content/pdfs`) | 6,317,412 B (28.2 %) | built by `scripts/build-*-pdf.mjs`; streamed by `app/api/book/pdf/route.ts` |
| Bloat + derived artifacts together | ~11.9 MB (53 % of tracked bytes) | sum of the three rows above |
| Dead source modules (zero non-test importers) | 3 files, 958 src lines + 944 test lines (~73 KB) | `lib/audio/{onset-timing,register-mechanism,spectral-envelope}.ts` |
| Unused exports (knip, spot-verified) | 52 values + 60 types; 17/20 sampled confirmed dead | `npx knip --reporter compact` + grep |
| Duplicated lines (icon/glyph wrappers, cap-controls tests, hooks harness, mock boilerplate) | ~520 lines removable | see Duplication clusters |
| Source lines (ts/tsx/mjs, non-test) | 148,290 (100,383 excluding the 47,907 generated data lines) | `git ls-files '*.ts' '*.tsx' '*.mjs' \| grep -vE '\.test\.' \| xargs wc -l` |
| Unit-test lines / files | 44,677 lines in 250 files (44.5 % of handwritten source); e2e adds 9,271 | same, `\.test\.` |
| Comment ratio (app/, components/, lib/, non-test, non-generated) | 15,857 comment lines vs 64,053 code lines = 19.8 % of non-blank lines | `comment-ratio.awk` (see section 5) |
| Comment lines carrying a dated history note | 34 dated; 117 "used to / no longer / replaced"; 12 citing a PR number | grep over comment lines |
| Dependencies | 6 deps + 10 devDeps, all used; lockfile root matches package.json; 518 packages, 447 dev-only | node one-liner over package-lock.json |

## Top findings

**P1 — `content/pdfs/*.pdf` is 28 % of the repo and is a build output** · `content/pdfs/the-voice-atlas.pdf` (5,275,536 B), `content/pdfs/the-measured-voice.pdf` (1,041,876 B) · Both are rendered by `scripts/build-atlas-pdf.mjs` / `scripts/build-book-pdf.mjs` from `lib/atlas-data.ts` / `lib/book-data.ts` (Playwright + Chrome), then bundled into the `/api/book/pdf` function by `next.config.ts:108-110` (`outputFileTracingIncludes`). They are needed at runtime, so they cannot simply be deleted, but every re-render rewrites 6.3 MB of binary history. · Recommendation: move them to Vercel Blob / object storage and have `app/api/book/pdf/route.ts` stream from there (it already gates on Stripe), or at minimum put them under Git LFS. · Saves 6.3 MB per revision from git history. · Risk: medium (route change + an env var); keep the gating logic untouched.

**P1 — `marketing/**` is a 2.4 MB social-media kit with 28 committed PNG renders** · `marketing/social/assets/carousel-{range,book,numbers,range-test}/slide-*.png` (2,281,315 B), `avatar-512.png`, `fb-cover-1640x720.png`, plus 118 KB of markdown · Nothing in `app/`, `components/`, `lib/`, `next.config.ts` or CI references `marketing/` (`grep -rn "marketing/" app components lib next.config.ts .github` returns only `scripts/build-icons.mjs:31,96`, which *writes* `avatar-512.png`). Every PNG is reproducible: each folder has `slides.html` + `render.mjs` (`node marketing/social/assets/carousel-range/render.mjs`). README says "nothing is published" as of 2026-08-27. · Recommendation: move the directory to a marketing repo or a Drive folder; if it must stay, delete the PNGs and keep `slides.html` + `render.mjs`. · Saves 2,426,243 B (2,281,315 B if only PNGs go). · Risk: low; `build-icons.mjs` line 96 would need its avatar target removed.

**P1 — Three dead DSP modules and their tests (1,902 lines)** · `lib/audio/onset-timing.ts` (288 lines), `lib/audio/register-mechanism.ts` (337), `lib/audio/spectral-envelope.ts` (333) + `*.test.ts` (286, 323, 335) · Orphan script: zero importers outside their own tests (`orphans.sh`, confirmed by `grep -rn "onset-timing\|register-mechanism\|spectral-envelope" lib/audio/*.ts | grep -v test` → only a prose mention in `voiced-run.ts:35`). knip lists their constants/types as unused. The contract itself records the state: `contracts/suede-vocal.ts:316` "`lib/audio/register-mechanism.ts` now computes H1-H2 as a pure function ... and nothing calls it from a live take". · Recommendation: delete all six files, or move them to a `lib/audio/experimental/` folder excluded from the build and vitest if the research value matters. · Saves 1,902 lines / 72,930 B and ~1 s of vitest. · Risk: low (test-only consumers); keep the contract row's wording in sync.

**P1 — Generated TypeScript data committed alongside its sources (2.46 MB, 47,907 lines)** · `lib/atlas-data.ts`, `lib/lesson-data.ts`, `lib/singers-data.ts`, `lib/book-data.ts`, `lib/singers-lite.ts` · Each header says "GENERATED FILE — edit content/… and re-run scripts/compile-*.mjs". Sources: `content/atlas` 71,495 B + `content/book` 186,585 B + `content/lessons` 545,047 B + `data/singers` 592,760 B. The outputs are 2.46 MB and dominate `lib/` (4.76 MB of 4.76 MB tracked in lib is 2.46 MB generated). `singers-lite.ts` is additionally a 9-field projection of `singers-data.ts` for two client components (`components/singers/directory.tsx`, `components/range/result-view.tsx`; `app/atlas/page.tsx` is a server component and could read the full set). · Recommendation: add a `prebuild` npm script that runs `compile-singers`, `compile-atlas`, `compile-book`, `compile-lessons` and gitignore the outputs; or, if the build must stay dependency-free, mark them `linguist-generated -diff` in `.gitattributes` so reviews and diffs stop paying for them. · Saves 2,463,943 B per revision. · Risk: medium (Vercel build time +seconds; tests import the generated modules so `prebuild` must run before `vitest` too, e.g. `pretest`).

**P2 — Vendored Clerk/Upstash skills are duplicated via symlinks and lint-swept** · `.agents/skills/**` (72 files, 307,332 B) + `.claude/skills/*` (8 symlinks back into `.agents`) + `skills-lock.json` · No app code imports from `.agents` (`grep -rn "\.agents" app components lib scripts proxy.ts next.config.ts` → none; `@clerk/nextjs` and `@upstash/redis` are imported from node_modules). `skills-lock.json` only pins source hashes. `tsc --noEmit --listFilesOnly` includes none of them (TypeScript skips dot-directories), but `npx eslint .agents` lints 4 files (0 problems), so `npm run lint` does sweep them. knip reports all 8 of those files as unused. · Recommendation: keep if the team actively uses the skills; otherwise delete `.agents/`, `.claude/skills/` and `skills-lock.json`, and either way add `.agents/**` to `globalIgnores` in `eslint.config.mjs`. · Saves 307 KB and 72 files. · Risk: low.

**P2 — Stale planning/handoff documents (about 215 KB) describe work that has shipped** · `.planning/PLAN.md` (54,573 B, 1,227 lines: the warmup sing-along/AudioContext-clock plan; `components/warmups/exercise-player.tsx:413-463` already implements sing-along and call-and-response), `.planning/SPEC.md` (popular-song pages; `app/songs/[slug]/page.tsx` exists), `docs/superpowers/specs/2026-08-13-analyze-tools-design.md` ("Status: approved design, not yet implemented" while `components/analyze/{analyze-client,spectrogram,tone,vocal-load}.tsx` exist), `docs/superpowers/specs/2026-09-03-warmup-routines-design.md` ("shipped in the same PR"), `docs/superpowers/{plans,specs}/2026-09-14-*` (self-marked "Superseded"), `docs/superpowers/plans/2026-08-29-vocal-range-evidence-seo.md` (references a `/private/tmp/...` worktree; `lib/singer-evidence.ts` shipped), `docs/specs/2026-10-25-framework-security.md` (Next is pinned at 16.4.1 in package.json), `docs/handoffs/*` five files (2026-09-05 → 2026-10-26; 2026-09-25 and 2026-10-23 both call 2026-09-25 "the entry point" while 2026-10-26 is newer), `docs/seo/*`, `docs/audits/*` (completed audit reports). · Recommendation: delete `.planning/` and move finished handoffs/specs/audits to a `docs/archive/` folder or the PR descriptions they belong to; keep `docs/research/*` (cited by `components/warmups/exercises.ts:248`) and the intake plan/spec/doc (in flight: `docs/superpowers/plans/2026-10-25-lead-intake-dormant.md` still has 9 open checkboxes and `lib/intake/` exists). · Saves ~215 KB and a misleading "entry point" chain. · Risk: low.

**P2 — Six icon/glyph files with byte-identical wrappers and eight duplicated icon names** · `components/songs/icons.tsx` (130 lines), `components/warmups/icons.tsx` (90), `components/recorder/icons.tsx` (97), `components/landing/glyphs.tsx` (130), `components/pro/glyphs.tsx` (96), `components/v2-glyph.tsx` (34) · `diff components/songs/icons.tsx components/warmups/icons.tsx` shows lines 1-37 (the `Svg` wrapper, `IconPlay`) identical and `IconMinus`, `IconPlus`, `IconMic`, `IconArrowLeft` identical; `landing/glyphs.tsx` and `pro/glyphs.tsx` share an identical 18-line `base()`. Name collisions across files: `IconPlay`×3, `IconMic`×3, `IconStop`, `IconPause`, `IconPlus`, `IconMinus`, `IconMetronome`, `IconArrowLeft` ×2 each. `recorder/icons.tsx` uses a different 16×16 filled style. · Recommendation: one `components/icons.tsx` (24-box stroke set) absorbing songs+warmups, one `components/glyphs.tsx` absorbing landing+pro; restyle recorder onto the shared set when the recorder page is next touched. · Saves ~105 lines now (~200 with recorder). · Risk: low; all importers are in-room (`imp()` listing in section 2).

**P2 — Test duplication: a 50-line hand-rolled hooks runner copied into four files, two identical cap-controls tests, six copies of the same mock preamble** · `components/ear/mic-interruption.test.tsx`, `components/breath/sustain-interruption.test.tsx`, `components/breath/breath-cue-drill-interruption.test.tsx`, `components/tools/metronome-lifecycle.test.tsx` (`grep -rl "Effects did not settle"`); `components/breath/cap-controls.test.tsx` vs `components/ear/cap-controls.test.tsx` (70 lines each, `diff` after room-name substitution = 2 lines; each is a single-entry `describe.each`); `vi.mock("@/components/prepaint")` + `vi.mock("@/lib/free-cap")` preamble in 6 files. · Recommendation: `tests/hooks-harness.ts` (saves ~150 lines), merge the two cap-controls files into one two-entry `describe.each` (saves 68), a `tests/mock-free-cap.ts` helper (saves ~100). · Saves ~320 lines. · Risk: low.

**P2 — Freshness tests pin content hashes and dates, forcing churn on every wording change** · `lib/singer-page-freshness.test.tsx:48-55` pins six sha256 fingerprints and `lastModified: "2026-10-27"`; `lib/singer-evidence.ts:330` `SINGER_PAGE_REVISED = "2026-10-27"`; `lib/singer-editorial-routes.test.tsx:153-186`; `public/ai-instructions-sitemap.xml` carries a hand-edited `<lastmod>2026-10-27</lastmod>` asserted by `lib/ai-instructions-page.test.ts`. The pin comment itself records "re-pinned for punctuation only (em dashes out of the shared template); no content change". · Recommendation: keep the invariant (lastmod must move when content moves) but derive the fingerprint from the data revision rather than pinning hashes in the test, and generate `ai-instructions-sitemap.xml` from `app/sitemap.ts` instead of hand-editing. · Saves recurring churn, not lines. · Risk: low; SEO agents' lane for the lastmod semantics.

**P3 — Comment volume: 19.8 % of non-blank lines, with 34 dated and 117 history-style lines** · see section 5 for the top-15 tables and the 10 stale spot checks (`vitest.config.mts` worktree story, `.github/workflows/ci.yml` "Canvas and the mic hook are not unit-tested" while 5 mic/use-pitch tests exist, `docs/superpowers/specs/2026-08-13-*` status line, dual "entry point" handoffs, `lib/llms-txt.ts:4-11` history of a deleted public file, `lib/organization.ts` six-date changelog, `lib/singers.ts` three dated re-check paragraphs, `lib/audio/latency.ts:60-75` a constant whose own comment says the measurement "was the rig", `lib/app-store.ts` retired-slug history, `app/page.tsx:117` audit history). · Recommendation: move dated verification logs into PR descriptions or a `docs/decisions.md`, keep the "why" paragraph, drop the "what it used to be" paragraph. · Risk: none.

**P3 — Small orphans** · `public/apple-touch-icon-precomposed.png` (10,440 B, md5-identical to `public/apple-touch-icon.png` and `app/apple-icon.png`; no reference to "precomposed" anywhere), `public/the-measured-voice.txt` + `public/the-voice-atlas.txt` (239 B; written by `scripts/build-*-pdf.mjs:535/582`, linked from nothing), `scripts/port-voice-lessons.mjs` (8,060 B; its own header: "one-way port, run once ... don't run it after a lesson has been edited here"), `scripts/audit-technique.mjs` (4,454 B; referenced by nothing), `assets/suede-mark-400.png` (135,254 B; only read by `scripts/build-icons.mjs:41`), `lib/query-ownership.ts` (153 lines; only `lib/query-ownership.test.tsx` imports it). · Recommendation: delete the first four; move `assets/` to the brand-assets repo its comment says it came from; move `query-ownership.ts` next to its test or into `tests/`. · Saves ~160 KB. · Risk: low.

## Dead/unused table

Method: `orphans.sh` (every non-test module in `lib/ components/ contracts/`, grep for `from "@/<path>"`, `./<name>`, `../x/<name>` across `app components lib contracts scripts e2e proxy.ts next.config.ts`), cross-checked with `npx -y knip@5 --reporter compact` (log: `scratchpad/knip.log`) and a loose basename grep.

| File | Lines | Non-test importers | Test importers | Verdict |
|---|---|---|---|---|
| `lib/audio/onset-timing.ts` | 288 | 0 | 1 | **Dead.** Delete with `onset-timing.test.ts` (286). |
| `lib/audio/register-mechanism.ts` | 337 | 0 | 1 | **Dead.** Contract row says "nothing calls it from a live take". Delete with test (323). |
| `lib/audio/spectral-envelope.ts` | 333 | 0 | 1 | **Dead.** Delete with test (335). |
| `lib/query-ownership.ts` | 153 | 0 | 1 | Test-only SEO register; move beside its test. |
| `components/prepaint.testing.ts` | 104 | 0 | 10 | Test support by design; move to `tests/`. |
| `lib/audio/breath-fixture.ts` | 182 | 0 (e2e: `e2e/breath-gate.mjs`) | 1 | Keep (e2e fixture). |
| `lib/audio/voice-fixture.ts` | 171 | 0 (e2e: `vibrato-drill.mjs`, `breath-gate.mjs`) | 3 | Keep (e2e fixture). |
| `components/account/clerk-shell-off.tsx` | 14 | 0 by import; aliased in `next.config.ts:19` | 1 | Keep (build-time alias). |
| `contracts/{glossary,practice-parity,suede-progress,suede-vocal}.ts` | 108/186/313/957 | 0 | 1-5 | Keep: their tests serialize them to the JSON consumed by the iOS/Android/GuitarHub repos (`contracts/README.md`). |

knip unused exports (52 values, 60 types; full list in `scratchpad/knip.log`). Spot-verified 20 by `grep -rlw` outside the defining file and outside tests:

| Symbol | File | Non-test refs | Status |
|---|---|---|---|
| `restoreBackup`, `BackupError`, `BACKUP_MIN_INTERVAL_MS` | `lib/account-backup.ts:132` | 0 | dead (restoreBackup is ~60 lines) |
| `daySeconds`, `localDayOf`, `RECORDER_SEC`, `RANGE_TEST_SEC` | `lib/programs.ts` | 0 | dead exports |
| `xpForSession`, `WARMUP_MODES` | `lib/progress.ts` | 0 | un-export |
| `mergeTallies`, `accuracyOf`, `MIN_SCORED_SEC` | `lib/analytics.ts` | 0 | dead |
| `powerSpectrum`, `BREATH_FFT_SIZE`, `BREATH_SPLIT_HZ` | `lib/audio/breath-detect.ts` | 0 | un-export |
| `listDevices`, `subscribeAudioPrefs`, `DEFAULT_DEVICE_ID` | `lib/audio/devices.ts:182` | 0 | dead |
| `breadcrumbListJsonLd` | `lib/page-jsonld.ts:25` | 0 | dead |
| `analyzeHold` | `components/warmups/vibrato-feedback.ts:119` | 0 | dead |
| `useLogEarSession`, `ScoreChip` | `components/ear/session.tsx:456,149` | 0 | dead |
| `GuidedCapNote` | `components/learn/module-practice.tsx:50` | 0 | dead |
| `midiToStripX`, `STRIP_LOW`, `STRIP_HIGH` | `components/range/piano-strip.tsx` | 0 | un-export |
| `subscribeWarmupPrefs` | `components/warmups/prefs.ts` | 0 | dead |
| `useLocalDay` | `components/programs/use-program.ts` | 0 | dead |
| `clientKey` | `lib/rate-limit.ts` | 0 | un-export |
| `SyncRefusedError`, `SYNC_NETWORK_ERROR` | `lib/sync.ts` | 0 (1 test) | un-export |
| `isPlainObject`, `isBoundedString`, `isFiniteNumber`, `isActivityType`, `isDayKey`, `isValidNotes`, `isValidStreak`, `isValidAchievementId` | `lib/progress-shape.ts` | 0 | internal validators; un-export |
| `hasSomethingToSave` (`components/account/save-prompt.tsx:18`), `rangeOverlap` (`lib/singers.ts`) | re-exports | 3 | false positive: remove the re-export only |
| `isCalendarDay` (`lib/programs.ts`), `outputLagSec` (`lib/audio/latency.ts`) | used inside own module | 1 | false positive: un-export, keep |

knip also lists 48 "unused files": the `.agents`/`.claude` skill templates (8, real), `e2e/*.mjs` and `e2e/audits/*.mjs` (false positives: run by CI `ci.yml` and `e2e/run.mjs:40-46` dynamic import), `scripts/*.mjs` (false positives: run by hand/CI; except `audit-technique.mjs` and `port-voice-lessons.mjs`, see P3), `marketing/**/render.mjs` (real, with the PNGs).

## Duplication clusters table

| Cluster | Files (lines) | What each does | Overlap | Recommendation | Lines saved |
|---|---|---|---|---|---|
| Room icons | `components/songs/icons.tsx` (130), `components/warmups/icons.tsx` (90), `components/recorder/icons.tsx` (97) | 24×24 stroke icons for songs; same for warmups; 16×16 filled icons for recorder | songs/warmups: identical 31-line `Svg` wrapper + identical `IconPlay`, `IconMinus`, `IconPlus`, `IconMic`, `IconArrowLeft`; recorder re-implements Play/Pause/Stop/Mic in another style | merge songs+warmups into `components/icons.tsx`; migrate recorder when touched | ~85 now, ~180 total |
| Glyphs | `components/landing/glyphs.tsx` (130), `components/pro/glyphs.tsx` (96), `components/v2-glyph.tsx` (34) | room glyphs; Pro-perk glyphs; one animated campaign glyph | identical 18-line `base()` wrapper in landing/pro | merge landing+pro into `components/glyphs.tsx`; keep v2-glyph | ~20 |
| cap-controls tests | `components/breath/cap-controls.test.tsx` (70), `components/ear/cap-controls.test.tsx` (70), `components/warmups/cap-controls.test.tsx` (95) | same 4 assertions for the breath room; for the ear room; different assertions for warmups cards | breath vs ear differ in 2 lines; both already use a one-entry `describe.each` | one file, two-entry `describe.each`; keep warmups | 68 |
| session-summary | `components/warmups/session-summary.tsx` (489), `components/songs/session-summary.tsx` (455) | ladder diagnosis + daily-three next step; song grade + take review | share imports only (`liveStreak`, `ProCrescendoNudge`, `useProResultOnLeave`, `ResultCard`), and the "saved card: streak + tomorrow" block | keep; optionally lift the saved/streak card into `components/practice/` | ~40 |
| routines | `components/breath/routines.ts` (422), `components/warmups/routines.ts` (341), `components/ear/routines.ts` (195) | catalogue + seconds arithmetic + `recommend*` + `needsMic` per room | parallel shape (`*ById`, `*Seconds`, `*Minutes`, `recommend*`, `sizeToAllowance`), no shared code | keep; a generic `Routine<Step>` helper could absorb the by-id/seconds/minutes trio | ~60 |
| result surfaces | `components/songs/result-card.tsx` (237; `ResultCard`, `ShareableResult` used by 3 rooms), `components/practice/results-screen.tsx` (399; used by 5 rooms), `components/range/result-view.tsx` (1,053; range only) | already the shared layer | none duplicated; `result-view.tsx` is simply large (178 comment lines) | keep | 0 |
| prepaint | `lib/prepaint.ts` (293), `lib/prepaint-config.ts` (27), `components/prepaint.tsx` (99), `components/prepaint.testing.ts` (104) | inline script + rules; config for the layout; React half; test support | layered by design, each documents the other | keep; move `.testing.ts` to `tests/` | 0 |
| og | `lib/og.ts` (159), `lib/og-cards.ts` (209); tests `og-url.test.ts`, `legacy-og-image.test.ts` with no same-named module | sitewide card + `withCanonicalOpenGraph`; per-page card text/versions | none | keep | 0 |
| singers | `lib/singers-data.ts` (12,944 gen.), `lib/singers-lite.ts` (9,113 gen.), `lib/singers.ts` (228), `lib/singers-core.ts` (173), `lib/singers-analysis.ts` (125) | full dataset; 9-field projection for client bundles (2 client importers); server facade; data-free helpers; derived stats | **singers-lite duplicates 9 of singers-data's fields for all 636 singers** (163 KB) purely to keep blurbs out of client bundles; `app/atlas/page.tsx` imports lite although it is a server component | keep the projection (bundle-size reason is valid) but generate it at build (`prebuild`) instead of committing; have `atlas/page.tsx` use `SINGERS` | 9,113 committed lines |
| progress | `lib/progress.ts` (748), `lib/progress-shape.ts` (500), `lib/progress-cloud.ts` (161), `lib/progress-cloud-fit.ts` (50) | client store; server-safe validators; cloud pause state; size fitting | `progress.ts` re-exports shape; 8 validator helpers exported but unused outside | keep; un-export the 8 helpers | ~8 |
| pro | `lib/pro.ts` (704), `lib/pro-shared.ts` (185), `lib/pro-signal.ts` (48), `lib/pro-key.ts` (106), `lib/pro-inventory.ts` (148); `pro-entitlement.test.ts` (238) and `pro-checkout-recovery.test.ts` (96) have no same-named module (they test `pro.ts`/`pro-shared.ts`/`app/api/entitlement`) | client store; isomorphic types+pricing; result signal; HMAC key (server); marketing counts | none | keep; rename the two tests after what they test | 0 |
| generated data vs sources | `lib/{atlas,lesson,book,singers}-data.ts` + `singers-lite.ts` (2,463,943 B) vs `content/**` (803,127 B) + `data/singers/**` (592,760 B) | compiled outputs vs markdown/JSON sources | both committed; the outputs are 1.8× the sources | `prebuild` generation or `.gitattributes` generated markers | 47,907 committed lines |

## Repo-level bloat table

Bytes from `git ls-files -z <path> | xargs -0 stat -c %s | awk '{s+=$1}'`.

| Path | Bytes | Files | Needed by build/runtime? | Recommendation |
|---|---|---|---|---|
| `content/pdfs/*.pdf` | 6,317,412 | 2 | Runtime yes (`/api/book/pdf` via `outputFileTracingIncludes`); build input no (generated by `scripts/build-*-pdf.mjs`) | Move to Blob storage or Git LFS (P1) |
| `marketing/**` | 2,426,243 | 49 | No | Move out of repo; at least drop the 28 PNGs (2,281,315 B) (P1) |
| `lib/*-data.ts`, `lib/singers-lite.ts` | 2,463,943 | 5 | Build yes, but derivable from `content/` + `data/` | Generate in `prebuild` or mark generated (P1) |
| `.agents/skills/**` + `.claude/skills/*` symlinks + `skills-lock.json` | 307,332 + 307 + 1,989 | 72 + 8 + 1 | No (no imports; tsc skips dot-dirs; eslint lints 4 files) | Keep only if used; add to eslint ignores (P2) |
| `docs/**` | 187,621 | 20 | No | Archive ~153 KB of shipped/superseded handoffs, plans, specs, audits; keep `docs/research/*` (cited from code) and the in-flight intake docs (P2) |
| `.planning/PLAN.md`, `.planning/SPEC.md` | 54,573 + 6,346 | 2 | No; both describe shipped work | Delete (P2) |
| `assets/suede-mark-400.png` | 135,254 | 1 | No; only `scripts/build-icons.mjs:41` reads it | Move to brand-assets repo (P3) |
| `public/apple-touch-icon-precomposed.png` | 10,440 | 1 | No; md5 `727e7149…` identical to `apple-touch-icon.png` and `app/apple-icon.png`; nothing references "precomposed" | Delete (P3) |
| `public/the-measured-voice.txt`, `public/the-voice-atlas.txt` | 79 + 160 | 2 | No; written by the PDF scripts, linked from nothing | Delete and drop the two `writeFile` lines (P3) |
| `public/ai-instructions.html` + `ai-instructions-sitemap.xml` | 5,799 + 199 | 2 | Yes: `vercel.json` rewrite `/ai-instructions`, `app/robots.ts:71`, footer link, IndexNow workflow | Keep; generate the sitemap's lastmod instead of hand-editing |
| `public/79cdb9d5873525c71a296b9d7c494bf9.txt` | 32 | 1 | Yes: IndexNow key file read by `.github/workflows/indexnow.yml:54` and `proxy.test.ts` | Keep |
| `public/shot-01/02/05-*.png` | 269,970 | 3 | Yes: all three referenced by `components/landing/ios-band.tsx:8,13,18`; 03/04 never existed in git (App Store numbering) | Keep |
| `public/founder-portrait.jpg` | 165,442 | 1 | Yes: `components/landing/hero-split.tsx` | Keep (not re-encoded here; image lane) |
| `public/audio/piano/*.mp3` | ~1,600,000 | 23 | Yes (piano tool) | Keep |
| `app/legacy-share-card/[...path]/route.ts` | 2,174 | 1 | Yes: six `beforeFiles` rewrites in `next.config.ts:116-131` redirect old OG-image URLs here | Keep; retire once scrapers have refreshed (needs decision) |
| `scripts/port-voice-lessons.mjs` | 8,060 | 1 | No; documented one-shot ("don't run it after a lesson has been edited here") | Delete; `content/lessons/README.md:97` already records provenance (P3) |
| `scripts/audit-technique.mjs` | 4,454 | 1 | No; referenced by nothing | Delete or wire into `compile-singers` (P3) |
| `docs/research/singeo-pitch-track.py` | 3,067 | 1 | No; cited by `docs/research/singeo-warmup-parameters.md` which `components/warmups/exercises.ts:248` cites | Keep with its doc |
| `e2e/**` | 475,807 | 38 | CI yes (`ci.yml` runs every file; `e2e/run.mjs` loads `audits/`) | Keep |
| `package-lock.json` | 277,590 | 1 | Yes | Keep |
| `tests/fixtures/*.json` | 5,304 | 2 | Test yes (`lib/intake/core.test.ts`) | Keep |

Total tracked: 22,436,451 B. Hard bloat ≈ 3.10 MB (13.8 %); plus derivable generated TS 2.46 MB (11.0 %); plus runtime-needed-but-derivable PDFs 6.32 MB (28.2 %). Untracked on disk: `node_modules` 732 MB, `.next` 509 MB (both ignored).

## Test and comment bloat tables

### Tests

| Metric | Value |
|---|---|
| Test files | 250 (`components` 113, `lib` 106, `app` 18, `contracts` 5, `scripts` 3, `e2e` 3, root 2) |
| Unit-test lines | 44,677; e2e 9,271 |
| Handwritten source lines (excl. generated data) | 100,383 → unit tests are 44.5 %, with e2e 53.7 % |
| Test files with no same-named source module | 75 of 250 (cross-cutting SEO/route tests such as `lib/singer-page-*.test.tsx`, `lib/on-page-*.test.tsx`; and misnamed ones: `lib/pro-entitlement.test.ts`, `lib/pro-checkout-recovery.test.ts`, `lib/og-url.test.ts`, `lib/legacy-og-image.test.ts`) |
| Tests using `renderToStaticMarkup` string matching | 99 files |
| Test files containing a 2026 date literal | 49 (mostly fixture inputs; harmless) |

Tests over 800 lines:

| File | Lines | `it(` count |
|---|---|---|
| `lib/programs.test.ts` | 1,623 | 86 (17 `describe` blocks) |
| `lib/voice-lessons.test.tsx` | 1,170 | 62 |
| `lib/progress.test.ts` | 896 | — |
| `components/songs/lib.test.ts` | 878 | — |
| `lib/audio/pitch-fft.test.ts` | 871 | — |

Pins that force churn:

| Pin | Where | Effect |
|---|---|---|
| 6 sha256 page fingerprints + `lastModified: "2026-10-27"` | `lib/singer-page-freshness.test.tsx:48-55` | any shared-template wording change → re-pin 6 hashes and bump `SINGER_PAGE_REVISED` (`lib/singer-evidence.ts:330`); comment admits a re-pin "for punctuation only" |
| `SINGER_PAGE_REVISED` date format and ordering | `lib/singer-editorial-routes.test.tsx:153-186` | same constant, second test |
| `<lastmod>2026-10-27</lastmod>` hand-edited | `public/ai-instructions-sitemap.xml`, asserted by `lib/ai-instructions-page.test.ts:18` | manual bump every edit of `ai-instructions.html` |
| `OG_CARD_RENDER_REVISION = "2026-10-15-paper"` | `lib/og.ts:43`, format-checked by `lib/og.test.ts:125` | fine (format only) |
| Copy-string assertions ≥40 chars | `components/can-you-sing/verdict.test.tsx` 20, `components/range/result-view.test.ts` 17, `components/pro/pro-client.test.tsx` 16, `lib/book-pages.test.tsx` 14, `components/programs/today-card.test.tsx` 13, `lib/song-page.test.ts` 12, `lib/guides.test.ts` 12, `components/warmups/warmups-client.test.tsx` 12 | every copy edit touches a test (copy lane) |

Duplicated test code:

| Duplicate | Files | Lines |
|---|---|---|
| Hand-rolled hooks runner (`vi.hoisted` block ending "Effects did not settle") | `components/ear/mic-interruption.test.tsx:6-55`, `components/breath/sustain-interruption.test.tsx:6-56`, `components/breath/breath-cue-drill-interruption.test.tsx`, `components/tools/metronome-lifecycle.test.tsx` | 4 × ~50 = ~200, ~150 removable |
| cap-controls breath vs ear | `components/breath/cap-controls.test.tsx`, `components/ear/cap-controls.test.tsx` | 68 removable |
| `vi.mock("@/lib/free-cap")` + `vi.mock("@/components/prepaint")` preamble | `components/songs/mic-gate.test.tsx`, `components/breath/cap-controls.test.tsx`, `components/progress/progress-client.test.tsx`, `components/warmups/warmups-client.test.tsx`, `components/ear/cap-controls.test.tsx`, `components/practice/free-cap.test.tsx` | 6 × ~20, ~100 removable |
| Tests of dead modules | `lib/audio/{onset-timing,register-mechanism,spectral-envelope}.test.ts` | 944 removable with the modules |

### Comments

Method: `comment-ratio.awk` over non-test `app/ components/ lib/` `.ts/.tsx`, excluding the five generated data files; a line counts as a comment when it starts (after whitespace) with `//`, `/*` or `*`; blank lines excluded. Full per-file data: `scratchpad/comment-ratio.tsv`.

Totals: 15,857 comment lines vs 64,053 code lines (19.8 %). Test files: 4,596 vs 33,958 (11.9 %).

Top 15 by ratio (files with ≥40 comment lines):

| File | Comment | Code | Ratio |
|---|---|---|---|
| `lib/audio/frame-clock.ts` | 41 | 8 | 0.84 |
| `lib/audio/latency.ts` | 63 | 35 | 0.64 |
| `app/robots.ts` | 43 | 26 | 0.62 |
| `lib/organization.ts` | 64 | 40 | 0.61 |
| `lib/chart-colors.ts` | 65 | 42 | 0.61 |
| `lib/audio/f0-trace.ts` | 48 | 36 | 0.57 |
| `components/prepaint.tsx` | 51 | 41 | 0.55 |
| `lib/og.ts` | 80 | 67 | 0.54 |
| `lib/audio/register-mechanism.ts` (dead) | 162 | 143 | 0.53 |
| `components/songs/types.ts` | 71 | 66 | 0.52 |
| `lib/audio/spectral-envelope.ts` (dead) | 155 | 150 | 0.51 |
| `components/account/save-state.ts` | 40 | 39 | 0.51 |
| `lib/pro-inventory.ts` | 65 | 70 | 0.48 |
| `lib/audio/voiced-run.ts` | 78 | 89 | 0.47 |
| `components/range/pitch-meter-hint.ts` | 42 | 49 | 0.46 |

Top 15 by absolute comment lines:

| File | Comment | Code | Ratio |
|---|---|---|---|
| `lib/programs.ts` | 557 | 1,049 | 0.35 |
| `components/songs/lib.ts` | 415 | 631 | 0.40 |
| `components/songs/song-player.tsx` | 382 | 1,305 | 0.23 |
| `lib/audio/pitch.ts` | 266 | 428 | 0.38 |
| `components/warmups/exercise-player.tsx` | 253 | 1,121 | 0.18 |
| `components/warmups/exercises.ts` | 247 | 822 | 0.23 |
| `lib/pro.ts` | 241 | 413 | 0.37 |
| `components/pro/pro-client.tsx` | 205 | 1,309 | 0.14 |
| `lib/progress.ts` | 196 | 503 | 0.28 |
| `lib/audio/vibrato.ts` | 191 | 272 | 0.41 |
| `lib/lesson-practice.ts` | 184 | 478 | 0.28 |
| `lib/audio/breath-detect.ts` | 179 | 368 | 0.33 |
| `components/range/result-view.tsx` | 178 | 810 | 0.18 |
| `lib/progress-shape.ts` | 173 | 283 | 0.38 |
| `lib/audio/register-mechanism.ts` (dead) | 162 | 143 | 0.53 |

Dated/history markers: 34 comment lines contain a 2025/2026 date; 117 contain "used to / no longer / formerly / replaced / before this"; 12 cite a PR number. A path checker (`stale-paths.sh`) found **0** comments citing a repo path that no longer exists, so the stale ones are stale by state, not by reference. Ten spot checks:

| # | Location | Why stale |
|---|---|---|
| 1 | `vitest.config.mts:10-24` | 9-line story about `**/.claude/worktrees/**` running "three stale copies of the suite"; no such directory exists in this checkout (`ls .claude/worktrees` → none) |
| 2 | `.github/workflows/ci.yml` (Test step) | "Canvas and the mic hook are not unit-tested" — `lib/audio/mic*.test.ts` (4 files) and `lib/audio/use-pitch-analyse.test.ts` exist; `lib/audio` has 22 test files |
| 3 | `docs/superpowers/specs/2026-08-13-analyze-tools-design.md:4` | "Status: approved design, not yet implemented" — `components/analyze/*` ships it |
| 4 | `docs/handoffs/2026-09-25-sing-3.1-state.md:3`, `2026-10-23-…:3` | both name 2026-09-25 "the entry point"; `2026-10-26-funnel-polish.md` is newer and calls itself "the running record" |
| 5 | `lib/llms-txt.ts:4-11` | eight lines about a `public/llms.txt` that was deleted on 2026-08-21 and the bug it had |
| 6 | `lib/organization.ts:14-28,38-42,61-66` | six dated verification entries (2026-08-26, 08-27, 09-13, 09-14, 09-25, 10-09): a changelog inside a constant |
| 7 | `lib/singers.ts:127-141` | three "Checked / Re-checked" paragraphs (2026-08-02, 08-27, 10-13) |
| 8 | `lib/audio/latency.ts:61-75` | `MEASURED_ONSET_LAG_SEC = 0.2` whose own comment says most of the figure "was the rig, not the input chain" and to "re-measure before relying on it"; it is still used at `latency.ts:95` |
| 9 | `lib/app-store.ts:11-15` | explains a retired `suede-studio-voice` slug that is no longer anywhere in the repo |
| 10 | `app/page.tsx:117-119`, `lib/og.ts:82-87`, `components/site-footer.tsx:88-91` | "audit 2026-08-02 found…", "a production sweep on 2026-08-28 found eight such pages…", "the course used to live on GuitarHub" — history of fixed states, now enforced by tests (`lib/og.test.ts`) |

Also stale by content: `contracts/suede-vocal.ts:316` ships a correction history ("This row used to say the iOS app reports…") into the JSON consumed by three other repos, and `lib/audio/register-mechanism.ts:21-25` argues with a `vocal-integration-spec.md` that is not in this repo.

### Dependencies

| Package | Used by | Verdict |
|---|---|---|
| `@clerk/nextjs`, `@upstash/redis`, `stripe`, `next`, `react`, `react-dom` | 9 / 1 / 7 files; framework | keep |
| `@tailwindcss/postcss`, `tailwindcss` | `postcss.config.mjs`, `app/globals.css` | keep |
| `@types/node`, `@types/react`, `@types/react-dom`, `typescript` | `tsc --noEmit` in CI | keep |
| `eslint`, `eslint-config-next` | `eslint.config.mjs`, `npm run lint` | keep |
| `playwright` | `e2e/*.mjs`, `scripts/{audit-*,build-*}.mjs`, `marketing/**/render.mjs`, CI | keep |
| `vitest` | 259 files | keep |
| `server-only` (not declared) | imported by `lib/{og-cards,pro-key,rate-limit,redis,singer-editorial,singer-evidence,stripe}.ts`; present only transitively via `@clerk/nextjs` | add as an explicit dependency (knip "unlisted") |
| `postcss` (not declared) | `postcss.config.mjs`; transitive via `@tailwindcss/postcss`/`next` | acceptable |

Lockfile: root `dependencies`/`devDependencies` equal package.json exactly (no extras, none missing); 518 packages, 447 dev-only; no package in the lock is introduced by the vendored skills (they are plain files; the `.agents/.../templates/nextjs-basic-auth/package.json` is not a workspace).

## Safe-to-delete list

Each entry: path, and the grep that proves nothing outside it (and its own tests) references it.

1. `lib/audio/onset-timing.ts`, `lib/audio/onset-timing.test.ts` — `grep -rln "onset-timing" app components lib contracts scripts e2e proxy.ts next.config.ts | grep -v '\.test\.'` → (none).
2. `lib/audio/register-mechanism.ts`, `lib/audio/register-mechanism.test.ts` — same grep → only prose mentions in `lib/audio/voiced-run.ts:35` and `contracts/suede-vocal.{ts,json}` (a note saying nothing calls it).
3. `lib/audio/spectral-envelope.ts`, `lib/audio/spectral-envelope.test.ts` — same grep → only `docs/handoffs/2026-09-23-ship-loop.md:68`.
4. `public/apple-touch-icon-precomposed.png` — `grep -rn "precomposed" app components lib scripts public --include=*.ts --include=*.tsx --include=*.mjs --include=*.html` → (none); md5 identical to `public/apple-touch-icon.png`.
5. `public/the-measured-voice.txt`, `public/the-voice-atlas.txt` — `grep -rln "the-measured-voice.txt\|the-voice-atlas.txt" --exclude-dir=node_modules --exclude-dir=.git .` → only `scripts/build-book-pdf.mjs:535`, `scripts/build-atlas-pdf.mjs:582` (the writers; drop those two lines).
6. `scripts/port-voice-lessons.mjs` — `grep -rl "port-voice-lessons" .` → `content/lessons/README.md:97` and `docs/handoffs/2026-09-23-ship-loop.md:85` (prose only); the script's header says it must not be re-run.
7. `scripts/audit-technique.mjs` — `grep -rl "audit-technique" --exclude-dir=node_modules --exclude-dir=.git .` → (none besides itself).
8. `.planning/PLAN.md`, `.planning/SPEC.md` — `grep -rl "\.planning" app components lib scripts e2e .github` → (none); both plans are implemented (`components/warmups/exercise-player.tsx:413-463`, `app/songs/[slug]/page.tsx`).
9. `marketing/social/assets/**/slide-*.png`, `marketing/social/assets/fb-cover-1640x720.png` — `grep -rn "marketing/" app components lib next.config.ts .github` → only `scripts/build-icons.mjs:31,96` (writes `avatar-512.png`, not these); each PNG is regenerated by the sibling `render.mjs`.
10. Unused exports confirmed dead (0 refs outside file and tests): `restoreBackup`/`BackupError` (`lib/account-backup.ts`), `daySeconds`/`localDayOf`/`RECORDER_SEC`/`RANGE_TEST_SEC` (`lib/programs.ts`), `mergeTallies`/`accuracyOf` (`lib/analytics.ts`), `listDevices`/`subscribeAudioPrefs` (`lib/audio/devices.ts`), `breadcrumbListJsonLd` (`lib/page-jsonld.ts`), `analyzeHold` (`components/warmups/vibrato-feedback.ts`), `useLogEarSession`/`ScoreChip` (`components/ear/session.tsx`), `GuidedCapNote` (`components/learn/module-practice.tsx`), `subscribeWarmupPrefs` (`components/warmups/prefs.ts`), `useLocalDay` (`components/programs/use-program.ts`) — proof: `grep -rlw <symbol> app components lib contracts scripts e2e | grep -v <file> | grep -v '\.test\.'` → 0 for each.

## Needs-a-decision list

| Path | Probable bloat because | Plausible reason to keep |
|---|---|---|
| `content/pdfs/*.pdf` (6.3 MB) | build outputs of `scripts/build-*-pdf.mjs`; every regeneration adds 6.3 MB of history | served at runtime by `/api/book/pdf` through `outputFileTracingIncludes`; Vercel's build image has no Chrome to regenerate them |
| `lib/{atlas,lesson,book,singers}-data.ts`, `lib/singers-lite.ts` (2.46 MB) | generated from `content/` and `data/`, both also committed | zero-dependency build; tests import them directly; a `prebuild`/`pretest` hook is a workflow change |
| `marketing/**` (markdown part, 118 KB) | launch-kit prose, not product | the carousel brief and quote verifier (`verify-quotes.mjs`) read `lib/book-data.ts`, so they want to live near the data |
| `.agents/skills/**`, `.claude/skills/*`, `skills-lock.json` (309 KB) | nothing imports them; knip and eslint see them as unused files | agent sessions in this repo use the Clerk/Upstash skills; `skills-lock.json` pins their provenance |
| `docs/handoffs/*`, `docs/superpowers/{plans,specs}/*`, `docs/seo/*`, `docs/audits/*` (~153 KB) | describe shipped or superseded work; two files disagree on the "entry point" | the single squashed commit means git history is gone, so these are the only narrative record; move to `docs/archive/` rather than delete |
| `docs/research/*` (19 KB) | research notes | `components/warmups/exercises.ts:248` cites `singeo-warmup-parameters.md` as the source of its timing constants; keep |
| `docs/intake-purchase-core.md`, `docs/superpowers/{plans,specs}/2026-10-25-lead-intake-*` | plan has 9 open checkboxes | in-flight: `lib/intake/*` and `app/api/webhooks/stripe/route.ts` exist and are dormant by env flag; keep |
| `assets/suede-mark-400.png` (135 KB) | only `scripts/build-icons.mjs` reads it | it is the icon source of truth; its comment says it was copied from `suede-brand-assets`, where it could live instead |
| `app/legacy-share-card/[...path]/route.ts` + six rewrites in `next.config.ts` | redirect shim for OG image URLs retired at the 2026-10-15 restyle | scrapers may still hold the old URLs; retire after a cache cycle |
| `lib/query-ownership.ts` (153 lines) | only its test imports it | it is an SEO decision register the test enforces against pages; move beside the test or into `tests/` |
| `lib/singers-lite.ts` specifically | 9-field duplicate of `singers-data.ts` | keeps 613 KB of prose out of two client bundles; the right fix is generation, not deletion |
| `public/ai-instructions.html` + `ai-instructions-sitemap.xml` | static HTML outside the app router with a hand-edited lastmod | deliberately served by a `vercel.json` rewrite and submitted to IndexNow; keep, but generate |
| `components/warmups/session-summary.tsx` vs `components/songs/session-summary.tsx` | same name, same imports | different domains; only the streak card is shareable |
| Tests `lib/pro-entitlement.test.ts`, `lib/pro-checkout-recovery.test.ts`, `lib/og-url.test.ts`, `lib/legacy-og-image.test.ts` | no module of that name | they test `lib/pro.ts`, `lib/pro-shared.ts`, route metadata and `app/legacy-share-card`; rename rather than delete |
| `lib/audio/latency.ts:75` `MEASURED_ONSET_LAG_SEC` | its own comment says the measurement was mostly the rig | still feeds `MODELLED_ONSET_LAG_SEC` arithmetic at line 95; re-measure or drop (audio lane) |

Scratch artifacts from this audit (all under `/tmp/claude-0/-home-user/f42fa408-4574-5c8b-b322-b364a2b633e8/scratchpad/`): `knip.log` (full knip output), `orphans.tsv`, `orphans.sh`, `comment-ratio.awk`, `comment-ratio.tsv` (per-file comment/code counts), `stale-paths.sh`, `stale-paths.tsv`.
