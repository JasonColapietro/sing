# Developer workflow audit

Scope: package.json scripts, `.github/workflows/*.yml`, `vercel.json`, `next.config.ts`, `proxy.ts`, `eslint.config.mjs`, `vitest.config.mts`, `tsconfig.json`, `.gitignore`, `.env.example`, `scripts/**`, `e2e/**`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, `skills-lock.json`, `.agents/skills`, README "Before pushing", `docs/handoffs/*`, `docs/superpowers/*`, `.planning/*`.
Repo: `/home/user/sing` at `384574e` (branch `fleet-pass-4`, shallow clone, depth 1). Read-only; nothing in the repo was modified. All measured runs are below under "Measured results". CI timings come from GitHub (`gh run view`) for the last six `CI` runs.

**Bottom line: tsc, lint, vitest (3454 tests) and the node:test file are all green on this tree.** The workflow's problems are cost and reproducibility, not correctness: an uncached Chromium install that swings from 17 s to 582 s per job, a browser matrix that only exists as 100 lines of bash inside YAML, no CI on `main` itself, three content compilers with no staleness guard, and ~400 KB of agent-era residue that nothing links to.

---

## Top findings

### **P1 — Chromium install is uncached and is the single biggest cost on the CI critical path** · `.github/workflows/ci.yml` (step "Install full Chromium") · effort **S**

Evidence (run 40552668972, the latest green run, 18.2 min wall):

| job | npm ci | Install full Chromium | Run browser suite | job total |
|---|---|---|---|---|
| journeys | 10 s | **582 s** | 295 s | 15.1 min |
| desktop-audit | 8 s | **341 s** | 112 s | 8.0 min |
| audio | 11 s | 17 s | 525 s | 9.4 min |
| mobile-audit | 11 s | 18 s | 118 s | 2.7 min |
| layout-shift | 9 s | 22 s | 816 s | 14.4 min |

The step is run cold in every one of the five matrix jobs:

```yaml
      - name: Install full Chromium
        shell: bash
        run: |
          mkdir -p browser-results
          npx playwright install --with-deps --no-shell chromium 2>&1 | tee browser-results/browser-install.log
```

The same command took 17 s in one job and 582 s in another in the same run, so the variance is the CDN, not the work. `npm ci` is cached (`cache: 'npm'`) but the ~150 MB browser is not. Recommendation: add `actions/cache` on `~/.cache/ms-playwright` keyed on the resolved Playwright version (`hashFiles('package-lock.json')`), run `npx playwright install-deps chromium` every time (apt, fast) and `npx playwright install chromium` only on a cache miss. Expected: the journeys job drops from 15 min to ~6 min and the run's critical path from ~18 min to ~15 min (then bounded by layout-shift, see next).

### **P1 — No CI runs on `main`; production deploys from a ref the gate never saw** · `.github/workflows/ci.yml`, `vercel.json`, `README.md` "Deploy" · effort **S**

```yaml
on:
  pull_request:
```

is the only trigger. `vercel.json` kills every non-production build (`"ignoreCommand": "[ \"$VERCEL_ENV\" != \"production\" ] && exit 0 || exit 1"`) and README says "Pushing `main` deploys it". The workflow's own comment is accurate but incomplete:

```yaml
# The pull_request event tests GitHub's synthetic merge commit, so re-running
# after a squash merge would re-test the same tree at full cost.
```

That holds only if `main` has not moved since the PR's last push. A PR merged after another PR lands, or any direct push to `main`, deploys to sing.suedeai.ai without tsc/lint/test/build having run on that tree. The run list shows PRs merging in quick succession (two "Keep processing Pro checkout sessions" runs cancelled by a third within minutes), which is exactly the window. Recommendation: either add `push: { branches: [main] }` running the `checks` job only (2.9 min, no browsers) so the deployed commit always has a green static check, or turn on "Require branches to be up to date before merging" in branch protection (cannot be verified from the repo). The first is three lines and self-documenting.

### **P2 — Three of the four content compilers have no staleness guard; a stale `lib/*-data.ts` would ship silently** · `scripts/compile-singers.mjs`, `scripts/compile-atlas.mjs`, `scripts/compile-book.mjs`, `lib/voice-lessons.test.tsx` · effort **S–M**

The pattern already exists for one compiler:

```
scripts/compile-lessons.mjs:4:  * Usage: node scripts/compile-lessons.mjs [content/lessons] [--check]
scripts/compile-lessons.mjs:6:  * `--check` writes nothing and fails if lib/lesson-data.ts is stale, which is
lib/voice-lessons.test.tsx:141:    const run = spawnSync(process.execPath, ["scripts/compile-lessons.mjs", "--check"], {
```

The other three have no `--check` (`grep -n -- --check scripts/compile-*.mjs` hits only compile-lessons), no npm script, no `prebuild` hook, and no CI step. They write 613 KB (`singers-data.ts`), 845 KB (`atlas-data.ts`) and 201 KB (`book-data.ts`) of committed TypeScript from `data/singers/*.json`, `content/atlas/*.md` and `content/book/*.md`. Every PR that edits a batch file relies on the author remembering to re-run the compiler.

Measured: I copied `scripts/`, `data/singers`, `content/{atlas,book}` and the four outputs into the scratchpad and re-ran all three compilers; every output was byte-identical to the committed file (`in sync: lib/singers-data.ts, singers-lite.ts, book-data.ts, atlas-data.ts`). So this is a latent risk, not a live bug. The git history is depth 1 here so I could not check whether it has ever drifted.

Recommendation: port the `--check` flag and the `spawnSync(...,"--check")` test to the other three (the compile-lessons implementation is ~10 lines), or add one `npm run compile` that runs all four plus `npm run compile:check` that CI calls. Same for `scripts/build-icons.mjs` (writes 7 committed PNG/ICO files from `assets/`; no check).

### **P2 — The CI browser matrix exists only as bash inside YAML; nobody can run "what CI runs" locally** · `.github/workflows/ci.yml` (lines ~150–240), `README.md` "Before pushing", `e2e/README.md`, `package.json` · effort **M**

README says:

> Before pushing, run what CI runs:
> ```bash
> npx tsc --noEmit
> npm run lint
> npm test
> npm run build
> ```
> Browser checks run against a running server (default `http://localhost:3000`): `npm run e2e`, plus `e2e:mobile`, `e2e:pitch`, `e2e:vibrato`, `e2e:programs` and `e2e:breath`.

CI additionally runs **49 browser commands** (27 explicit `run_check` lines plus an 11-state × 2-viewport loop) across five jobs, with flags that no npm script carries (`--executable`, `--json`, `--returning`, `--state=`, `--route=`, `--viewport=desktop-1440-tall`). 16 of the 20 journey files in `e2e/` and all three browser audits in `scripts/` have no npm script at all (see orphan table). The only way to reproduce a red `journeys` job is to copy the `case "$SING_SUITE"` block out of the YAML. The local scripts also target a different server: `e2e/README.md` opens with `npm run dev          # in another shell`, while CI runs `npm start -- --hostname 127.0.0.1 --port 3100` against the production build artifact, and e2e/README itself says CLS "needs a production build to mean anything".

Recommendation: move the `case` block into a checked-in runner (`e2e/suite.mjs <journeys|mobile-audit|desktop-audit|audio|layout-shift> [baseUrl] [--executable=]`) that the workflow calls with one line per matrix entry and a developer calls with `npm run e2e:suite -- journeys`. The `run_check` function, the `GITHUB_STEP_SUMMARY`/`::error` annotations and the `timeout 12m` wrapper all move with it and become unit-testable (the repo already does this for `audit-mic-gate.mjs` via `scripts/audit-mic-gate.test.mjs`). Then README's "run what CI runs" can be literally true.

### **P2 — `layout-shift` is one 14-minute serial job that the matrix could split for free** · `.github/workflows/ci.yml` (`layout-shift` case) · effort **S**

816 s of pure suite time: 3 explicit `cls.mjs` runs plus the 22-run state loop, each launching a browser and loading up to every route template. `strategy.fail-fast: false` and `matrix.suite` already exist, so adding `layout-shift-states-a` / `layout-shift-states-b` entries (or a `--states=` slice flag) halves the wall time with no new infrastructure. After the Chromium cache (P1) this job becomes the critical path.

### **P2 — Node and action versions disagree between the two workflows and nothing pins Node for the repo** · `.github/workflows/ci.yml`, `.github/workflows/indexnow.yml`, (missing) `.nvmrc`, `package.json` · effort **S**

```yaml
# ci.yml
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          # Matches the Vercel production runtime (24.x). There is no .nvmrc or
          # engines field to read; if prod moves, move this with it.
          node-version: '24'
```
```yaml
# indexnow.yml
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
```

This container runs Node 22.22.0; `package.json` has no `engines`; there is no `.nvmrc`. The ci.yml comment already names the fix. Recommendation: add `.nvmrc` containing `24`, `"engines": { "node": ">=24" }`, and `node-version-file: .nvmrc` in both workflows; bump indexnow.yml's actions to v5 so Dependabot-style drift stops being a two-file edit.

### **P2 — `scripts/deploy-prod.sh` builds twice, uploads a working tree, and `vercel redeploy` makes its whole guard unnecessary** · `scripts/deploy-prod.sh`, `README.md` "Deploy" · effort **S**

```bash
echo "✓ tree clean and at origin/main ($(git rev-parse --short HEAD))"
npm run lint
npx tsc --noEmit
npx next build
vercel --prod --scope "$SCOPE" --yes
```

`vercel --prod` without `--prebuilt` uploads the source and Vercel builds it again, so the local `next build` (~40 s–1 min) is thrown away; lint and tsc re-prove what CI already proved on the merged PR. The script's documented purpose is narrow — "reach for this only when you need to force a rebuild — e.g. after changing a NEXT_PUBLIC_* env var" — and its 30-line guard exists because on 2026-07-30 it "was run from a worktree four commits behind main and silently dropped the Pro cloud-sync routes". `vercel redeploy <url> --scope …` (or the dashboard's Redeploy button) rebuilds the exact commit of the current production deployment from git, so there is no working tree to be stale and no local build to run. Recommendation: replace the body with the redeploy call and keep the file name so README's instruction still works; delete the guard. The Vercel git integration remains the real deploy path; this script is not redundant with it, only with `vercel redeploy`.

### **P3 — `npm test` runs two test runners because one file imports `node:test` instead of `vitest`** · `package.json`, `vitest.config.mts`, `scripts/indexnow-submit.test.mjs` · effort **S** (3 lines)

```json
"test": "vitest run && node --test scripts/indexnow-submit.test.mjs",
```
```ts
      // 2026-10-09: a node:test file, which vitest reports as "No test suite
      // found". `npm test` runs it with `node --test` after vitest instead.
      "scripts/indexnow-submit.test.mjs",
```
```js
import { test } from "node:test";
import assert from "node:assert/strict";
```

Vitest exports a `test(name, fn)` with the same signature and `node:assert/strict` works unchanged under it. Change line 1 to `import { test } from "vitest"`, delete the exclude entry and the `&& node --test …`. Nothing else in the repo uses `node:test`. The 12 tests take 0.1 s either way; the cost is a second runner, a second reporter format in CI logs, and a config comment that will outlive the reason.

### **P3 — `scripts/audit-technique.mjs` is the only check on published prose about real people and nothing runs it** · `scripts/audit-technique.mjs` · effort **S**

Zero references in package.json, workflows, README, docs or other scripts. It is pure Node (no Playwright), runs in 80 ms, and passes today (`no blocking problems`). Its BLOCK list (hedged claims, health/legal words, awards, years, long quotations, career biography) is not duplicated in vitest — the only test file matching those words (`lib/singer-page-search-intent.test.tsx:94`) has "reported" in a fixture string. Recommendation: wrap it in a vitest spec the way `scripts/audit-mic-gate.test.mjs` wraps its CLI, so a batch edit that adds "reportedly" or a surgery mention fails `npm test`.

### **P3 — Browser audits are split arbitrarily between `scripts/` and `e2e/`, and one of them overlaps an e2e audit module that CI already runs twice** · `scripts/audit-mic-gate.mjs`, `scripts/audit-share-cards.mjs`, `scripts/audit-warmup-timing.mjs`, `e2e/audits/80-states.mjs` · effort **S–M**

CI's `journeys` suite runs `node scripts/audit-share-cards.mjs` and `node scripts/audit-mic-gate.mjs` interleaved with `node e2e/*.mjs`; the `audio` suite runs `node scripts/audit-warmup-timing.mjs`. All three are Playwright journeys. README's table says `scripts/` holds "Content compilers, audits, Stripe setup, deploy" and `e2e/` holds "Playwright browser journeys and audits", so the split is by history, not kind. `audit-mic-gate.mjs` ("what a practice room shows when the microphone is refused") and `e2e/audits/80-states.mjs` check A ("Microphone refusal on the eight practice rooms") test the same behaviour; 80-states runs in both `mobile-audit` and `desktop-audit`. They are not identical — audit-mic-gate adds the 375×667 tab-bar occlusion check and the "two role=alert nodes" rule, and has a unit test of its own CLI — so this is "decide which is the keeper and fold the unique checks in", not "delete one". Moving the three files to `e2e/` is a rename.

### **P3 — ~400 KB of agent-era residue; nothing a human or tool reads points at most of it** · `.planning/`, `docs/handoffs/`, `docs/superpowers/`, `.agents/skills/`, `skills-lock.json` · effort **S**

Per-path verdicts in the residue table below. Headline facts: `.planning/` (61 KB) holds two plans that have both shipped (SPEC → `app/can-you-sing` + `lib/pop-songs.ts`; PLAN → `components/warmups/timeline.ts`, `lib/audio/latency.ts`, sing-along/call-and-response in `exercise-player.tsx`) and has zero checkbox progress marks and zero inbound references. `docs/superpowers/specs/2026-08-13-analyze-tools-design.md` says "Status: approved design, not yet implemented" while `app/analyze/` and `components/analyze/` exist. `docs/handoffs/` has two files that each call themselves "the entry point" (2026-09-25 and 2026-10-26); `AGENTS.md`, `CLAUDE.md` and `README.md` link to none of them, so a fresh session finds them only by `ls`. Of the eight vendored skills in `.agents/skills/` (307 KB, 70 files — they are consumed: all eight appear in this session's skill list), four target features the code does not use: `clerk-orgs` (50 KB; 0 hits for `useOrganization|OrganizationSwitcher|orgId`), `clerk-webhooks` (23 KB; 0 `verifyWebhook|svix`), `clerk-backend-api` (36 KB; 0 `clerkClient`), `upstash-ratelimit-js` (16 KB; `@upstash/ratelimit` is not in package.json — `lib/rate-limit.ts` is in-process).

### **P3 — Dead config entries and one hook that does not fire where it claims to** · `vitest.config.mts`, `.gitignore`, `.claude/settings.json`, `scripts/git-identity.sh` · effort **S**

- `vitest.config.mts` excludes `**/.claude/worktrees/**`; `.claude/` contains only `settings.json`. The 12-line comment explaining the exclude is longer than the directory's existence.
- `.gitignore` ignores `.suede-graph-flo-xr/` and `.suede-team/` ("Agent-team ledgers"); neither exists.
- `scripts/git-identity.sh` says ".claude/settings.json runs this at the start of every Claude Code session" and `scripts/git-hooks/commit-msg` says it is "Installed by scripts/git-identity.sh". In this cloud session it did not run: `git config core.hooksPath` is unset, `user.name` is `Claude`, `commit.gpgsign` is `true`, and `.git/hooks` holds only samples. So the attribution-stripping hook is active only in sessions where SessionStart hooks execute; a human clone never gets it either (there is no `prepare` script). `.claude/settings.json` also sets `"attribution": { "commit": "", "pr": "", "sessionUrl": false }`, which is the harness-native way to get the same result, so the hook is belt-and-braces. Keep both (tiny), but fix the two comments so they say "when SessionStart hooks run".
- `next.config.ts` and `proxy.ts`: **no dead entries found.** Every route the headers/rewrites/redirects name exists (`app/legacy-share-card`, `app/programs/[program]`, `app/api/book/pdf`, `app/singers/{records,genre,voice-type,[slug]}`, `app/songs/[slug]`, `app/warmups`, `app/sign-in`, `app/sign-up`); the `.vercel.app` host redirect, warmup-id redirect, program deep-link rewrite and the public-image cache header are each covered by `next-config.test.ts`; the Clerk matcher is covered by `proxy.test.ts` (6 cases). The `/(api|trpc)(.*)` matcher mentions `trpc`, which the app does not have, but it is Clerk's documented boilerplate and asserted at `proxy.test.ts:57` — harmless. `vercel.json`'s one rewrite (`/ai-instructions` → `/ai-instructions.html`) serves a real static file that `lib/ai-instructions-page.test.ts` reads and holds to the site's metadata set.
- `README.md` table row `contracts/` is fine; there is no row for `tests/`, which holds only two JSON fixtures for `lib/intake` — fine as is.

### Things that are sound (checked, no action)

- **`indexnow.yml`** — four triggers (deployment_status filtered to `success` + env starting with `Production`, repository_dispatch for Vercel's newer events, weekly cron, manual), `cancel-in-progress: false`, and `scripts/indexnow-submit.mjs` reads the *live* sitemaps and refuses to post unless the live key file matches (`refuses to post when the live key file does not match`, `…when the key file is not deployed` — both tested; 12/12 pass). It chunks at the 10,000-URL ceiling. Minor: it resubmits every sitemap URL (~700) on every production deploy plus weekly rather than only changed URLs; IndexNow documents that as a no-op, so acceptable. `public/79cdb9d5873525c71a296b9d7c494bf9.txt` and `public/ai-instructions-sitemap.xml` both exist.
- **`vercel.json`** — `github.silent` stops bot comments; `ignoreCommand` disables previews (ci.yml's header comment documents the consequence correctly); one rewrite, tested.
- **`eslint.config.mjs`, `tsconfig.json`, `.env.example`** — minimal and current; `.env.example` documents every variable `lib/` reads. One correction to a CI comment: the Typecheck step says it is "Not redundant with Build: `next build` only type-checks what the app graph reaches, so scripts/ is invisible to it." But `tsconfig.json`'s `include` lists only `**/*.ts`, `**/*.tsx`, `**/*.mts` (no `.mjs`, despite `allowJs`), and `scripts/` and `e2e/` contain only `.mjs`, so `tsc --noEmit` does not see them either. The step's real extra value over `next build` is the `*.test.ts(x)` files, `next-config.test.ts`, `proxy.test.ts` and `vitest.config.mts`, which the app graph never imports. Worth keeping; worth fixing the comment.
- **Checks-job ordering** — `tsc 15 s → lint 25 s → test 52 s → build 40 s` sequential in one job is ~2.2 min of 2.9; parallel jobs would save ~1.5 min but the run is bounded by browser jobs (8–15 min), so not worth a second `npm ci`. Leave it.

---

## CI vs local matrix

| Check | CI? | README "Before pushing"? | npm script? | Notes |
|---|---|---|---|---|
| `npx tsc --noEmit` | yes — `checks` (15 s) | yes | no (npx) | also implicitly inside `next build` |
| `eslint` | yes — `checks` (25 s) | yes | `npm run lint` | |
| `vitest run` (249 files) | yes — `checks` (52 s incl. below) | yes (`npm test`) | `npm test` | |
| `node --test scripts/indexnow-submit.test.mjs` | yes (inside `npm test`) | yes (implicitly) | `npm test` | second runner, see P3 |
| `next build` | yes — `checks` (40 s) + Vercel on push to main | yes | `npm run build` | CI build artifact feeds the browser jobs; `deploy-prod.sh` builds a third time |
| `e2e/run.mjs --viewport=mobile-375` (9 audit modules) | yes — `mobile-audit` (118 s) | yes, as `npm run e2e:mobile` | `e2e:mobile` | README/e2e README say run against `next dev`; CI runs against `next start` of the prod build on :3100 |
| `e2e/run.mjs --viewport=desktop-1280` | yes — `desktop-audit` (112 s) | no (`npm run e2e` runs all six viewports instead) | `e2e` (superset) | |
| `journeys` suite — 12 commands: checkout-recovery, share-cards, navigation, navigation-inputs, progress-reset, recorder-recovery, voice-tabs, mic-refusal, programs, song-first-practice, songs-modes, song-visit-unlock | yes (295 s) | no | only `e2e:programs` | 11 of 12 have no local entry point |
| `audio` suite — 10 commands: mic-preferences, mic-startup, ear-mic-interruption, ear-keyboard, mic-release, pitch-precision, breath-gate, vibrato-drill, song-loop-scoring, warmup-timing | yes (525 s) | partially (`e2e:pitch`, `e2e:vibrato`, `e2e:breath`) | 4 of 10 (`e2e:pitch`, `e2e:vibrato`, `e2e:breath`, `audit:warmup`) | |
| `layout-shift` suite — 25 × `e2e/cls.mjs` | yes (816 s) | no | none | documented only in `e2e/README.md` "Layout shift" |
| `compile-lessons.mjs --check` | yes (via `lib/voice-lessons.test.tsx`) | no | none | |
| `compile-singers / compile-atlas / compile-book` staleness | **no** | no | none | P2 |
| `build-icons.mjs`, `build-book-pdf.mjs`, `build-atlas-pdf.mjs` | no (by hand, outputs committed) | no | none | PDFs are 6.3 MB committed binaries |
| `audit-technique.mjs` | **no** | no | none | P3 |
| Playwright browser cache | **no** | — | — | P1 |
| CI on push to `main` | **no** | — | — | P1 |
| Vercel preview deploy on PR | no (deliberately, `vercel.json`) | — | — | documented in ci.yml header |
| `stripe:setup`, `pro-key.mjs` | no (ops) | yes (README "Going live", "Pro keys") | `stripe:setup` only | correct: these touch Stripe |
| `deploy-prod.sh` | no (manual) | yes (README "Deploy") | none | P2 |
| IndexNow submission | separate workflow, after prod deploy | no | none | sound |

---

## Orphaned scripts and journeys

"Who runs it" was established by grepping each basename against `package.json`, `.github/workflows/*.yml`, `README.md`, `e2e/README.md`, `docs/**`, `.planning/**`, and every other file in the repo (excluding `node_modules`, `.next`, `.agents`).

| Path | What it does | Who runs it | Verdict |
|---|---|---|---|
| `scripts/audit-technique.mjs` | Regex audit of singer `technique` prose for hedges, health/legal words, awards, dates, quotations, biography. 80 ms, no deps. | **nothing** | **Orphan.** Wrap in a vitest spec (P3). |
| `scripts/port-voice-lessons.mjs` | One-way port of lesson bodies from the GuitarHub repo; header says "don't run it after a lesson has been edited here". | nothing (mentioned once in `docs/handoffs/2026-09-23-ship-loop.md`) | **Delete** — a one-shot migration whose re-run is destructive; the header's provenance note can live in `content/lessons/README` or the compile-lessons header. |
| `scripts/build-book-pdf.mjs` | Two-pass Chromium render of the paid book to `content/pdfs/the-measured-voice.pdf` (1.0 MB committed). | by hand after `compile-book` | Keep; document in README or add `npm run build:pdfs`. No staleness check possible short of re-rendering. |
| `scripts/build-atlas-pdf.mjs` | Same for the atlas → `content/pdfs/the-voice-atlas.pdf` (5.3 MB committed). Imports `build-book-pdf.mjs`. | by hand | Keep; same note. |
| `scripts/build-icons.mjs` | Renders favicon/icon/apple-icon/manifest PNGs from `assets/`; 7 committed outputs. | by hand (referenced in `app/manifest.ts` comment) | Keep; add `--check` or accept drift risk (icons change rarely). |
| `scripts/compile-singers.mjs` | `data/singers/*.json` → `lib/singers-data.ts` + `lib/singers-lite.ts`. Validates, dedupes, warns. | by hand; `compile-atlas` requires it first | Keep; **add `--check` + test** (P2). |
| `scripts/compile-atlas.mjs` | `content/atlas/*.md` + `data/singers` → `lib/atlas-data.ts`. `ASSIGN` is imported by `lib/atlas-data.test.ts`. | by hand | Keep; **add `--check` + test** (P2). |
| `scripts/compile-book.mjs` | `content/book/*.md` → `lib/book-data.ts`. | by hand | Keep; **add `--check` + test** (P2). |
| `scripts/compile-lessons.mjs` | `content/lessons/**` → `lib/lesson-data.ts`; has `--check`. | by hand; `--check` via vitest | Keep; the model for the other three. |
| `scripts/singer-slugs.mjs` + `.test.mjs` | Reserved static slugs under `/singers`; imported by `compile-singers`. | vitest (2 tests) | Keep. |
| `scripts/audit-mic-gate.mjs` + `.test.mjs` | Playwright: mic-refusal message visible in every room, no duplicate `role=alert`, not under the phone tab bar. | CI `journeys` as `mic-refusal`; vitest runs its 12 CLI tests | Keep; move to `e2e/`; reconcile with `80-states` check A (P3). |
| `scripts/audit-share-cards.mjs` | Checks legacy `/…/opengraph-image` URLs route to the versioned card. | CI `journeys` as `share-cards` | Keep; move to `e2e/`. |
| `scripts/audit-warmup-timing.mjs` | Playwright + synthetic voice: silent mic scores 0, aligned ≥ 90, 350 ms late ≤ 65. ~55 s. | CI `audio`; `npm run audit:warmup` | Keep; move to `e2e/`; rename script to `e2e:warmup` for consistency. |
| `scripts/indexnow-submit.mjs` + `.test.mjs` | IndexNow submitter; 12 node:test tests. | `indexnow.yml`; `npm test` (second runner) | Keep; convert test to vitest (P3). |
| `scripts/stripe-setup.mjs` | Idempotent Stripe product/price/portal provisioning. | `npm run stripe:setup`; README | Keep. |
| `scripts/pro-key.mjs` | Regenerate a purchaser's Pro key. | README (3 mentions), by hand | Keep. |
| `scripts/deploy-prod.sh` | Guarded `vercel --prod` after local lint/tsc/build. | README "Deploy", by hand | **Replace body with `vercel redeploy`** (P2). |
| `scripts/git-identity.sh` | Sets repo-local git identity, disables signing, points `core.hooksPath` at `scripts/git-hooks`. | `.claude/settings.json` SessionStart (did not fire in this session) | Keep; fix comment. |
| `scripts/git-hooks/commit-msg` | awk filter stripping `Co-Authored-By: …Claude`, `Claude-Session:`, "Generated with Claude Code", bare session links. Enforces nothing else (no conventional-commit rule). | installed only by the above | Keep (986 bytes); note it is redundant with `.claude/settings.json` `attribution`. |
| `e2e/run.mjs` + `e2e/audits/*.mjs` (9 modules) + `e2e/lib/harness.mjs` | The UI/UX audit (contrast, tap targets, layout, semantics, keyboard, runtime, preferences, states, self-test). | CI `mobile-audit`, `desktop-audit`; `npm run e2e`, `e2e:mobile`; `e2e/run.test.mjs`, `routes.test.mjs` in vitest | Keep. |
| `e2e/routes.mjs` | Route-per-template list and discovery. | imported by run/cls; `routes.test.mjs` | Keep. |
| `e2e/cls.mjs` + `cls.test.mjs` | CLS per route/state/viewport; 26 vitest tests validate the seeds. | CI `layout-shift` (25 invocations) | Keep; **shard** (P2). No npm script — add `e2e:cls`. |
| `e2e/chromium-lifecycle.mjs` | CDP-attach helper so visibility belongs to Chromium. | imported only by `breath-gate.mjs` | Keep (library). |
| `e2e/lib/audit-fixtures.mjs` | Template paths + fake sitemap for the three e2e unit tests. | vitest | Keep. |
| `e2e/programs.mjs`, `pitch-precision.mjs`, `vibrato-drill.mjs`, `breath-gate.mjs` | Journeys with npm scripts. | CI + `e2e:programs/pitch/vibrato/breath` | Keep. |
| `e2e/checkout-recovery.mjs`, `navigation.mjs`, `navigation-inputs.mjs`, `progress-reset.mjs`, `recorder-recovery.mjs`, `voice-tabs.mjs`, `song-first-practice.mjs`, `songs-modes.mjs`, `song-visit-unlock.mjs`, `mic-preferences.mjs`, `mic-startup.mjs`, `ear-mic-interruption.mjs`, `ear-keyboard.mjs`, `mic-release.mjs`, `song-loop-scoring.mjs` (15 files, 190 KB) | Journeys. | **CI only** — no npm script, no README mention (4 of them are described in `e2e/README.md`) | Keep, but give them a single local entry point (P2 runner). Nothing here is unrun — every journey file is in the CI matrix. |

Net: **two true orphans** (`audit-technique.mjs`, `port-voice-lessons.mjs`); **no e2e journey is unrun by CI**; **15 journeys plus the CLS suite are unrunnable locally without reading YAML.**

---

## Test cost

Unit suite, measured on this container (`vitest run`, Node 22.22, vitest 4.1.10):

| Metric | Value |
|---|---|
| Test files | 249 (248 passed, 1 skipped: `lib/account-backup.test.ts`, needs Upstash creds and says so) |
| Tests | 3462 (3454 passed, 8 skipped: 5 account-backup, 3 `lib/intake/outbox.test.ts` gated on a binary) |
| Wall time | **68.2 s** (`real 1m9.5s` incl. startup); transform 18.3 s, import 65.4 s, tests 87.75 s summed across workers |
| `node --test scripts/indexnow-submit.test.mjs` | 0.15 s, 12 tests |
| CI "Test" step | 52 s (Node 24, ubuntu-latest) |
| Files with ≤ 2 tests | 22 of 249 (7 with exactly 1) |
| Test files by dir | lib 81, lib/audio 22, components/songs 17, components/warmups 13, components/recorder 11, components/progress 10, components/practice 10 |

Slowest 10 files (per-file wall, from the JSON reporter):

| ms | tests | file | note |
|---|---|---|---|
| 16,166 | 30 | `lib/audio/pitch-fft.test.ts` | DSP over 162k frames (per handoff); 18.5 % of summed time |
| 14,816 | 17 | `lib/audio/breath-detect.test.ts` | synthetic scenes through the detector |
| 5,837 | 20 | `lib/on-page-headings.test.tsx` | renders many pages to static markup |
| 4,489 | 63 | `lib/singer-page-search-intent.test.tsx` | " |
| 4,418 | 129 | `lib/on-page-seo.test.tsx` | " |
| 3,390 | 10 | `lib/audio/pitch-precision.test.ts` | |
| 2,792 | 62 | `lib/voice-lessons.test.tsx` | includes the `compile-lessons --check` spawn |
| 2,258 | 26 | `e2e/cls.test.mjs` | |
| 1,813 | 10 | `components/ear/lib.test.ts` | |
| 1,487 | 38 | `lib/keyword-title-alignment.test.tsx` | |

Time by directory: `lib/audio` 35.1 s, `lib` 32.9 s, everything else < 3.3 s each. The two audio files alone are 31 s of 87.75 s summed (35 %); they are also the files whose rigor matters most, so the sensible move is not to trim them but to keep them off the critical path: vitest already parallelises across files, which is why the wall is 68 s and not 88 s. Candidates to merge: the 22 one-or-two-test files cost ~5–40 ms each in test time but ~50–100 ms each in import/transform (the suite spends 65 s importing); merging the seven single-test files into their sibling spec would be cosmetic. The `on-page-*` SEO renders (14.7 s across three files) each re-render overlapping page sets — sharing one rendered-page cache across them would be the one real saving (~8 s). Not urgent: 68 s is a fine unit-suite wall for 3,454 tests.

Browser suites (from CI, run 40552668972): mobile-audit 118 s, desktop-audit 112 s, journeys 295 s, audio 525 s, layout-shift 816 s = **31 min of browser time** across 5 parallel jobs, 18.2 min wall including the uncached Chromium installs. Of the last six CI runs: 2 success, 2 cancelled (superseded), 2 failure — both failures in browser jobs (`audio` once alone; `mobile-audit` + `audio` + `desktop-audit` once), never in `checks`. Whether those were real regressions or flakes needs the browser-results artifacts; the commits that followed suggest real fixes.

---

## Agent-era residue

| Path | Bytes | Consumed by | Verdict |
|---|---|---|---|
| `.agents/skills/upstash-redis-js/` | 101,019 | Claude Code (listed in this session's skills); `@upstash/redis` is a real dependency | **Keep** |
| `.agents/skills/clerk-setup/` | 18,364 | Claude Code; Clerk is installed and configured in `proxy.ts` | **Keep** |
| `.agents/skills/clerk-nextjs-patterns/` | 25,549 | Claude Code; matches `proxy.ts`/route handlers | **Keep** |
| `.agents/skills/clerk-custom-ui/` | 36,915 | Claude Code; 3 files use `useSignIn/useSignUp/appearance=` | **Keep** |
| `.agents/skills/clerk-orgs/` | 49,963 | Claude Code; **0** uses of `useOrganization|OrganizationSwitcher|orgId` | **Delete** (`npx skills remove clerk-orgs`); re-add if orgs ever land |
| `.agents/skills/clerk-webhooks/` | 23,385 | Claude Code; **0** `verifyWebhook|svix`; the only webhook route is Stripe's | **Delete** — the dormant lead-intake spec mentions Clerk events but is "activation on hold" |
| `.agents/skills/clerk-backend-api/` | 35,890 | Claude Code; **0** `clerkClient` | **Delete** |
| `.agents/skills/upstash-ratelimit-js/` | 16,247 | Claude Code; `@upstash/ratelimit` **not in package.json** (`lib/rate-limit.ts` is in-process) | **Delete** — it can only mislead an agent into reaching for a package the project rejected |
| `skills-lock.json` | 1,989 | the `skills` CLI that installs the above | **Keep**, trimmed to the four kept skills |
| `.claude/settings.json` | 307 | Claude Code (SessionStart hook + `attribution`) | **Keep** |
| `scripts/git-identity.sh` + `scripts/git-hooks/commit-msg` | 2,142 | the SessionStart hook, when it fires (it did not in this session) | **Keep**; fix the "every session" claim |
| `AGENTS.md` / `CLAUDE.md` | 1,217 / 11 | every agent session; `next dev` rewrites the first block | **Keep**; this is the right place to add one line pointing at the handoffs entry point if handoffs stay |
| `PRODUCT.md` | 2,597 | design-review agents; cites one superpowers spec | Keep (outside lane) |
| `.planning/SPEC.md` | 6,346 | **nothing** — popular-song pages shipped (`app/can-you-sing`, `lib/pop-songs.ts`) | **Delete** |
| `.planning/PLAN.md` | 54,573 | **nothing** — warmup sing-along/latency work shipped (`components/warmups/timeline.ts`, `lib/audio/latency.ts`); 0 `[x]`/`[ ]` marks, dated 2026-08-23 | **Delete** (git keeps it); or move to `docs/superpowers/plans/` if design history is wanted in one place |
| `docs/superpowers/specs/2026-08-13-analyze-tools-design.md` | 7,870 | nothing links; status line "not yet implemented" is false (`app/analyze` exists) | Keep as history, **fix status line** |
| `docs/superpowers/specs/2026-09-03-warmup-routines-design.md` | 6,021 | `PRODUCT.md` cites it | **Keep** |
| `docs/superpowers/{specs,plans}/2026-09-14-voice-curriculum-ownership*.md` | 15,041 | self-marked "Superseded in part" | Keep as history or collapse to the superseding handoff section |
| `docs/superpowers/plans/2026-08-29-vocal-range-evidence-seo.md` | 14,963 | nothing links | Keep as history |
| `docs/superpowers/{specs,plans}/2026-10-25-lead-intake-dormant*.md` | 10,478 | `lib/intake/` exists; plan has unchecked boxes; "activation on hold" | **Keep** — the one live plan |
| `docs/handoffs/2026-09-05-practice-parity.md` | 3,170 | the next handoff | Archive (fold the three "shipped" bullets into the next file's history) |
| `docs/handoffs/2026-09-23-ship-loop.md` | 30,077 | 2026-09-25 cites it for slice history | Keep as history |
| `docs/handoffs/2026-09-25-sing-3.1-state.md` | 8,494 | claims "This is the entry point for the next session"; 2026-10-23 says it "stays the entry point" | **Conflicts with 2026-10-26**; pick one |
| `docs/handoffs/2026-10-23-pitch-fft-autocorrelation.md` | 17,323 | nothing links | Keep as history (it is the design record for `lib/audio/pitch-fft.ts`) |
| `docs/handoffs/2026-10-26-funnel-polish.md` | 29,920 | "the running record; update it at each milestone" | **Keep** as the current entry point; add a `docs/handoffs/README.md` (or one line in `AGENTS.md`) naming it so the ritual has a stable address |
| `.gitignore` lines `.suede-graph-flo-xr/`, `.suede-team/` | — | nothing (dirs absent) | Delete the two lines |
| `vitest.config.mts` exclude `**/.claude/worktrees/**` + its 12-line comment | — | nothing (dir absent) | Delete |

Handoff ritual verdict: **still useful, currently unaddressed.** Each file is a genuine session-to-session record (the 2026-10-23 one is the only place the FFT-autocorrelation measurements live), but with five files, two self-declared entry points, and no link from `AGENTS.md`, a new session has to guess. The fix is an index, not deletion: keep the newest as entry point, link it from `AGENTS.md`, and let older files be history. `.planning/` is the opposite case — two finished plans with no reader — and should go.

---

## Measured results

All run in this container after `npm ci` (Node 22.22.0, npm 10.9.4), sequentially, on the tree at `384574e`. Nothing in the repo was written except tool caches (`tsconfig.tsbuildinfo`, `node_modules/.vite`).

| Command | Result | Wall |
|---|---|---|
| `npx tsc --noEmit` | **exit 0**, no output | 35.4 s (user 40.2 s) |
| `npm run lint` (`eslint`) | **exit 0**, no warnings printed | 50.7 s (user 1m19.9s) |
| `npx vitest run` | **exit 0** — 248 files passed, 1 skipped; 3454 tests passed, 8 skipped | 69.5 s (vitest-reported 68.20 s) |
| `node --test scripts/indexnow-submit.test.mjs` | **exit 0** — 12/12 pass | 0.15 s |
| `node scripts/audit-technique.mjs data/singers` (orphan, read-only) | **exit 0** — "no blocking problems" | 0.08 s |
| compile-singers / compile-book / compile-atlas re-run in scratchpad copy | all four outputs **byte-identical** to committed `lib/*-data.ts` | ~3 s |
| `npm run build` | not run (another agent's lane); a `.next/` from another agent's build and a `next-server` process were present during measurement | — |

CI reference (GitHub, run 40552668972, PR "Third fleet pass…", success, 18.2 min wall): checks 2.9 min (tsc 15 s, lint 25 s, test 52 s, build 40 s, artifact 13 s); browser jobs 2.7 / 8.0 / 9.4 / 14.4 / 15.1 min, of which Chromium install 18 / 341 / 17 / 22 / 582 s.

Skipped-test reasons, for the record: `lib/account-backup.test.ts` — "SKIPPED without credentials, which is how CI sees it - a suite that silently needs secrets is worse than one that says it is skipping"; `lib/intake/outbox.test.ts` — `const run = binary && cli ? it : it.skip` (needs an external binary). Both are honest, intentional skips.
