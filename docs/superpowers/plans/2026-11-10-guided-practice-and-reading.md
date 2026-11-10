# More Guided Practice and More Reading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 Pro exercise packs, 5 Pro programs, 5 book chapters and about 40 glossary terms to sing.suedeai.ai, with every published count derived and tested.

**Architecture:** Everything is data in the existing systems. Packs are appended to `PRO_PACKS` in `components/warmups/exercises.ts` (they become Pro routines through `PRO_ROUTINES` automatically). Programs are appended to `PROGRAMS` in `lib/programs.ts` and only link to ids rooms already run. Chapters are markdown in `content/book/` compiled into `lib/book-data.ts`. Glossary terms are entries in `lib/glossary.ts`. No new rooms, scoring, routes or framework code.

**Tech Stack:** Next.js 16.4.1 (read `node_modules/next/dist/docs/` before any framework change), React 19, TypeScript, vitest, Node e2e scripts with Chromium.

**Spec:** `docs/superpowers/specs/2026-11-10-guided-practice-and-reading-design.md`

## Global Constraints

- No songs work of any kind. No price, plan, Stripe or free-limit change (`FREE_DAILY_SEC` 300, `FREE_WEEKS` 1, 3 free chapters per book).
- The app scores pitch against a target and measures vibrato rate on a single hold. No copy may say or imply it hears register, loudness, strain, tone or words.
- Belt, low-note and stamina content stays inside book chapters 1, 4, 6 and 17: stop on pain or hoarseness, no pushing air for volume, no grit or rasp taught.
- No padding: no two exercises in `ALL_EXERCISES` may share the same step pattern, `noteDur`, `glide`, `ladder` and `gapSec`.
- Paid prose contains no em dashes.
- Never hand-edit `lib/*-data.ts`; edit `content/`, run `scripts/compile-*.mjs`.
- Every count on a marketing surface comes from `lib/pro-inventory.ts` and is re-derived by `lib/pro-inventory.test.ts`. If a pack ships fewer than 8 exercises, the count follows the data.
- Published content stays indexable; paid-content shells keep their existing exclusions.
- Existing program ids, day counts and rest-day indexes must not move (saved progress is a list of day indexes).
- Commits: run `bash scripts/git-identity.sh` once; no AI trailers. Branch `guided-practice-and-reading`.

## Review Focus

1. A singer with saved progress in `mix-4w` or `measured-voice-12w` loads the new build: their program card, day and streak are unchanged. (Task 3 keeps the existing calendar snapshot test and adds the new programs to it.)
2. A free singer opens a new Pro pack routine or day 8 of a new program: they get the existing Pro wall, never audio. (Task 2 and Task 3 tests; Task 7 browser check.)
3. A singer with a narrow measured range (an octave) opens `leaps` or `low-notes`: exercises too wide for the range are flagged by `tooWideForRange` as existing wide exercises are, and the routine still runs. (Task 2 test.)
4. A free singer works week 1 of each new program: every day is free content, 90 to 300 capped seconds. (Existing test in `lib/programs.test.ts` covers all Pro programs; Task 3 must pass it unchanged.)
5. A finished new program card must not shift layout on load. (Task 3 adds each new program to the pre-paint sizes and the CLS states.)

---

### Task 1: Baseline

**Files:** none changed.

- [ ] **Step 1:** `npm ci`
- [ ] **Step 2:** `npm test` — expected: all pass. Record the count.
- [ ] **Step 3:** `npm run lint && npm run build` — expected: clean.
- [ ] **Step 4:** If anything fails before any change, stop and report it; do not fix unrelated failures inside this plan.

### Task 2: Five Pro packs

**Files:**
- Modify: `components/warmups/exercises.ts` (append to `PRO_PACKS`)
- Modify: `lib/pro-inventory.ts` (`PRO_EXERCISES`, `PRO_PACK_COUNT`)
- Test: `components/warmups/new-packs.test.ts` (create)
- Possibly modify: any test that pins the pack list or count (`components/warmups/exercises.test.ts`, `routines.test.ts`, `lib/pro.test.ts`, `lib/guides.test.ts`, `lib/glossary.test.ts`, `lib/daily-three.test.ts`, `contracts/suede-vocal.ts` and its JSON). Update the expectation only where it restates the catalogue; never weaken a safety assertion.

**Interfaces:**
- Produces pack ids `runs`, `low-notes`, `long-phrases`, `leaps`, `clear-words`; each is also a routine id through `PRO_ROUTINES`. Exercise ids are prefixed by pack: `runs-*`, `low-*`, `phrase-*`, `leap-*`, `words-*`. Task 3 uses these ids.
- Pack names: "Riffs and runs", "Low notes", "Long phrases", "Leaps and intervals", "Clear words".

- [ ] **Step 1: Write the failing test** in `components/warmups/new-packs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ALL_EXERCISES, EXERCISES, PRO_PACKS } from "./exercises";
import { PRO_ROUTINES, routineById } from "./routines";

const NEW = ["runs", "low-notes", "long-phrases", "leaps", "clear-words"];
const ROOT = 60;
const shape = (e: (typeof ALL_EXERCISES)[number]) =>
  JSON.stringify([e.buildSteps(ROOT).map((s) => s.map((m) => m - ROOT)), e.noteDur ?? null, !!e.glide, e.ladder ?? "up", e.gapSec ?? null]);

describe("the 2026-11 Pro packs", () => {
  it("adds five packs after the original three", () => {
    expect(PRO_PACKS.map((p) => p.id)).toEqual(["belt-prep", "head-voice-builder", "mix", ...NEW]);
  });
  it("gives each new pack six to eight exercises with its own id prefix", () => {
    const prefix: Record<string, string> = { runs: "runs-", "low-notes": "low-", "long-phrases": "phrase-", leaps: "leap-", "clear-words": "words-" };
    for (const id of NEW) {
      const pack = PRO_PACKS.find((p) => p.id === id)!;
      expect(pack.exercises.length, id).toBeGreaterThanOrEqual(6);
      expect(pack.exercises.length, id).toBeLessThanOrEqual(8);
      for (const e of pack.exercises) expect(e.id.startsWith(prefix[id]), e.id).toBe(true);
    }
  });
  it("has no two exercises anywhere with the same shape", () => {
    const seen = new Map<string, string>();
    for (const e of ALL_EXERCISES) {
      const s = shape(e);
      expect(seen.get(s), `${e.id} duplicates ${seen.get(s)}`).toBeUndefined();
      seen.set(s, e.id);
    }
  });
  it("keeps every new exercise Pro and every new pack a Pro routine", () => {
    for (const id of NEW) {
      expect(routineById(id)?.pro, id).toBe(true);
      expect(PRO_ROUTINES.some((r) => r.id === id)).toBe(true);
      for (const e of PRO_PACKS.find((p) => p.id === id)!.exercises) expect(EXERCISES.some((f) => f.id === e.id)).toBe(false);
    }
  });
  it("claims nothing the app cannot hear", () => {
    const banned = /\b(strain|safe|safely|healthy|register detected|we hear|the app hears|measures your (tone|volume|loudness|diction|words))\b/i;
    for (const id of NEW) for (const e of PRO_PACKS.find((p) => p.id === id)!.exercises)
      expect(banned.test(`${e.title} ${e.desc} ${e.tip}`), e.id).toBe(false);
  });
  it("keeps the low and loud drills off the top of the range", () => {
    for (const e of PRO_PACKS.find((p) => p.id === "low-notes")!.exercises) expect(e.rangeCap?.to ?? 1, e.id).toBeLessThanOrEqual(0.6);
  });
});
```

If the duplicate-shape test fails on two *existing* exercises, scope `seen` to compare each new exercise against all others only, and note the pre-existing pair in the commit message.

- [ ] **Step 2:** `npx vitest run components/warmups/new-packs.test.ts` — expected: FAIL on the pack-id list.
- [ ] **Step 3: Write the five packs.** Each exercise uses only existing `WarmupExercise` fields. Content brief per pack (the implementer chooses exact notes, `noteDur`, tier and tip):
  - `runs`: pentatonic and blues-scale cells of 3 to 7 notes, up and down, a turn, a fall, a triplet cell; slow `noteDur` (0.4 to 0.5) versions first, quick (0.2 to 0.3) last.
  - `low-notes`: descending five, descending triad, low hold, octave drop and settle, glide down a fifth; all `ladder: "down"` or capped `LOWER_HALF_OF_RANGE` / `LOWER_MIDDLE_OF_RANGE`. Tips say stop if the sound turns to gravel you did not choose; no fry taught beyond the existing `fry-onset`.
  - `long-phrases`: one-breath patterns of growing length (5-note scale twice, then three times; 9-note scale; scale plus held final with `noteDur` 0.8+), a slow arpeggio chain. Tips name the breath plan; the desc states the app scores the pitch, not the breath.
  - `leaps`: fourth, fifth, sixth, octave, tenth up and back, and the same falling; staccato versions with `STACCATO_GAP_SEC`. Wide ones are tier "advanced".
  - `clear-words`: consonant-vowel syllables on moving pitch (for example "ta-ka", "la-ga", "mini-mini"), repeated-note patter at quick `noteDur`. Each desc ends by saying the app scores the pitch and the words are yours to judge.
- [ ] **Step 4:** Update `PRO_EXERCISES` and `PRO_PACK_COUNT` in `lib/pro-inventory.ts` to the real totals.
- [ ] **Step 5:** `npm test` — expected: all pass. Fix catalogue-restating expectations found in the "Possibly modify" list; regenerate `contracts/suede-vocal.json` by the command in `contracts/README.md` if its test byte-compares the pack list.
- [ ] **Step 6:** `node scripts/audit-warmup-timing.mjs` — expected: no new failures.
- [ ] **Step 7: Commit** `git commit -m "Warmups: five new Pro packs"`.

### Task 3: Five Pro programs

**Files:**
- Modify: `lib/programs.ts` (five `Program` constants, appended to `PROGRAMS` after `MEASURED_VOICE`)
- Modify: `lib/program-ids.ts` if it lists ids
- Modify: `lib/pro-inventory.ts` (`PRO_PROGRAM_NAMES`; the `PLAN_ROWS` "Programs" row follows the counts)
- Modify: `lib/prepaint-config.ts`, `app/globals.css`, `e2e/cls.mjs` only as far as a finished/running program card needs a per-program size (follow how `mix-4w` is handled)
- Modify: `e2e/programs.mjs` (open each new program; free singer meets the Pro wall on day 8)
- Test: `lib/programs.test.ts`

**Interfaces:**
- Consumes: pack and exercise ids from Task 2; existing routines `quick`, `cooldown`, breath sets and drills, `range`, `recorder`, `ear`.
- Produces: program ids and names, in this order: `belt-6w` "Belt in 6 weeks" (6), `head-voice-4w` "Head voice in 4 weeks" (4), `runs-4w` "Riffs and runs in 4 weeks" (4), `low-notes-3w` "Low notes in 3 weeks" (3), `long-phrases-4w` "Longer phrases in 4 weeks" (4). All `pro: true`. Task 4 attaches chapters to them.

- [ ] **Step 1: Change and add tests** in `lib/programs.test.ts`:
  - "has unique ids and four to six programs" becomes four to eleven, and asserts `PROGRAMS.map(p => p.id)` ends with the five new ids in the order above.
  - In "keeps every program's calendar where saved progress expects it", keep the two existing assertions byte-for-byte and add `toHaveLength(weeks * 7)` plus a pinned `rests(id)` array for each new program (write the arrays once the calendars exist; they are the snapshot from then on).
  - New test "opens and closes each new program on a range test warmed up the same way": for each new id, day 1 and the last non-rest day both contain `{ kind: "range" }`, and the items before `range` on those two days are deep-equal.
  - New test "ends each working day of the new programs on the cool-down": every Pro day (index >= 7) with items ends with `routine("cooldown")`, as Mix does.
  - New test "states what is scored and what is not": each new program's `measures` matches `/scores|scored/i` and `/yours to judge|cannot hear/i`; `belt-6w` and `low-notes-3w` `measures` or `finished` match `/\bdoctor\b/i` only in the site's existing referral wording (reuse the constant the existing doctor test checks).
- [ ] **Step 2:** `npx vitest run lib/programs.test.ts` — expected: FAIL (ids missing).
- [ ] **Step 3: Write the five programs** with the existing helpers (`day`, `rest`, `week`, `routine`, `exercise`, `drill`, `breath`, `range`, `recorder`, `ear`). Rules already enforced by existing tests and binding here: Pro days total 10 to 20 minutes; week 1 uses free exercises only and 90 to 300 capped seconds per day; a rest day in every week, none on day 1; a warmup before every range test. Shape per program: week 1 free on-ramp from free exercises that preview the skill; middle weeks alternate two or three day types built on the pack; final day is the check-in. `belt-6w` introduces `belt-prep` in week 2 and holds volume work to `rangeCap`-limited drills until week 4. `long-phrases-4w` pairs `long-phrases` with breath drills (`box`, `farinelli`) and uses `clear-words` twice a week from week 3. `runs-4w` uses `clear-words` once a week.
- [ ] **Step 4:** Update `PRO_PROGRAM_NAMES`; add pre-paint/CLS entries following `mix-4w`.
- [ ] **Step 5:** `npm test` — expected: all pass, including the unchanged free-week and 10-to-20-minute tests.
- [ ] **Step 6: Commit** `git commit -m "Programs: five new Pro programs"`.

### Task 4: Five book chapters

**Files:**
- Create: `content/book/24-belting.md`, `25-head-voice.md`, `26-riffs-and-runs.md`, `27-low-notes.md`, `28-longer-phrases.md` (frontmatter `title`, `part: "Skill programs"`, `order` 24 to 28, `summary`)
- Regenerate: `lib/book-data.ts` via `node scripts/compile-book.mjs`; PDF via `node scripts/build-book-pdf.mjs`
- Modify: `lib/pro-inventory.ts` (`BOOKS[0].chapters`, `.words`, `.pdfMb` if it changed), `contracts/suede-vocal.json` (regenerate), `lib/programs.ts` (`chapters` on each new program: weeks 1 to N, the chapter's slug and exact title)
- Test: existing `lib/pro-inventory.test.ts`, `lib/programs.test.ts` (title held to book data), `lib/singer-reading-copy.test.tsx` (no em dashes), `contracts/suede-vocal.test.ts`

- [ ] **Step 1:** Write each chapter at 1,300 to 1,700 words in the book's voice: what the skill is physically, what the program does week by week, what the app scores and what stays the singer's ear, when to stop, a closing "Try this". Cross-reference chapters 1, 4, 6, 17 rather than restating them. No em dashes. None is a free chapter.
- [ ] **Step 2:** `node scripts/compile-book.mjs` — expected: no problems reported, 28 chapters.
- [ ] **Step 3:** Add `chapters` to the five programs; update inventory literals; regenerate the contract per `contracts/README.md` (decide the `version` by its rule and record the change in that README's changelog).
- [ ] **Step 4:** `node scripts/build-book-pdf.mjs`; confirm the PDF opens and has the five new chapters (render page count with `pdfinfo` or read it).
- [ ] **Step 5:** `npm test` — expected: all pass.
- [ ] **Step 6: Commit** `git commit -m "Book: five skill-program chapters"`.

### Task 5: Glossary terms

**Files:**
- Modify: `lib/glossary.ts` (about 40 entries, domain `voice` or `music`, in existing sections or one new section "Technique and practice")
- Regenerate: `contracts/glossary.json`
- Modify: `lib/pro-inventory.ts` (`GLOSSARY_COUNT`)
- Test: `lib/glossary.test.ts`, `contracts/glossary.test.ts`, `lib/glossary-publishing.test.tsx`

- [ ] **Step 1:** Add a test to `lib/glossary.test.ts`: `SING_GLOSSARY_TERMS.length` is at least 75, and every term added in this task appears (case-insensitive) in at least one of: the new chapters' text, a new exercise's title/desc/tip, a new program's tagline/measures. Keep the list of new terms as an exported array `TERMS_2026_11` in the test file.
- [ ] **Step 2:** Run it — expected: FAIL.
- [ ] **Step 3:** Write the entries by the file's rule: one sentence of definition, no advice, `where` and `href` naming a live surface (the pack on `/warmups#pro-packs`, a program on `/programs`, a chapter). Candidates: belt, call, twang, head voice, falsetto flip, riff, run, melisma, turn, pentatonic scale, blues scale, triplet, interval names (fourth, fifth, sixth, octave, tenth), leap, scoop, staccato, legato, phrase, breath mark, sustain, tessitura of a phrase, chest resonance, vocal fry, onset, release, diction, consonant, vowel, patter, articulation, tempo, rep, check-in, cool-down, rest day. Skip any already defined.
- [ ] **Step 4:** Regenerate `contracts/glossary.json`; update `GLOSSARY_COUNT`.
- [ ] **Step 5:** `npm test` — expected: all pass.
- [ ] **Step 6: Commit** `git commit -m "Glossary: terms for the new packs, programs and chapters"`.

### Task 6: Surfaces that state the counts

**Files:**
- Modify as needed: `components/pro/*` copy that hard-codes pack or program names, `app/changelog` data (new entry, version bumped by the changelog's own convention), `lib/llms-txt.ts`, homepage Pro teaser, `app/sitemap.ts` only if glossary terms or programs have per-item URLs
- Test: `lib/pro-inventory.test.ts`, `lib/llms-txt.test.ts`, `lib/copy-conventions.test.ts`, route metadata tests

- [ ] **Step 1:** `grep -rn "19 pro\|3 packs\|three packs\|two programs\|2 programs\|23 chapters\|50 chapters\|103,088\|42 terms" app components lib --include=*.ts --include=*.tsx` — every hit either reads from `lib/pro-inventory.ts` already or is changed to.
- [ ] **Step 2:** Add the changelog entry: what was added, in counts taken from the inventory.
- [ ] **Step 3:** `npm test && npm run lint && npm run build` — expected: clean.
- [ ] **Step 4: Commit** `git commit -m "Pro surfaces: counts and changelog for the new content"`.

### Task 7: Whole-site verification

**Files:** none, unless a failure needs a fix.

- [ ] **Step 1:** `npm run build`, then `npx next start --port 3100` with Stripe and Clerk env vars unset.
- [ ] **Step 2:** Run every suite: `SING_BROWSER_EXECUTABLE=<chromium> node e2e/suite.mjs <suite>` for each suite the file lists. Expected: pass. `checkout-recovery` may time out on reload under the local Chromium (known; passes in CI): report it, do not chase it.
- [ ] **Step 3:** Browser check with Playwright against :3100: for each of the 5 packs, open its routine as Pro (the repo's e2e Pro fixture) and confirm the first exercise renders targets and the run completes with the fake-mic fixture the e2e scripts use; as a free singer confirm the Pro wall. For each of the 5 programs, open `/programs?program=<id>`, confirm day 1 lists items with working links and day 8 shows the Pro lock. Screenshot each program page at 375px and 1280px and look at them.
- [ ] **Step 4:** Independent read: a fresh reviewer reads the 40 exercises' copy, the 5 programs' copy and the 5 chapters against the Global Constraints (claims, safety, padding, em dashes) and lists violations; fix and re-run `npm test`.
- [ ] **Step 5:** Push the branch, open a PR, confirm CI is green. Do not merge or deploy without the owner's word.

### Task 8: iPhone (separate plan)

Not in this plan. After Task 7 merges, write `docs/superpowers/plans/` in Suede-AI/suede-voice for: a seed file for the 5 packs and their routines, the 5 chapters in `Resources/book.json` (and Android's `assets/book/book.json` if the owner wants parity), and the rebuilt PDF. It needs Xcode to test.
