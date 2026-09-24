/**
 * Multi-week programs, end to end, on a production build.
 *
 *   npm run build && npm start        # in another shell
 *   node e2e/programs.mjs [baseUrl] [--channel=chrome] [--executable=path] [--json=path]
 *
 * `lib/programs.test.ts` proves the calendar arithmetic with injected sessions
 * and days. This checks the parts only a browser can: that /programs starts a
 * program and shows today's card, that every row on it resolves to a room that
 * opens on the thing named, that a day ticks itself off from the practice log
 * the rooms write (seeded into localStorage here, in the same shape), that the
 * next day waits for the next calendar day and never runs two days in one, and
 * that the page still works with storage blocked.
 *
 * Exits non-zero on the first check that fails.
 */
import pw from "playwright";
import { writeFile } from "node:fs/promises";

const { chromium } = pw;

const argv = process.argv.slice(2);
const flag = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const CHANNEL = flag("channel") ?? "chrome";
const EXECUTABLE = flag("executable");
const JSON_OUT = flag("json");

const PROGRESS_KEY = "suede-sing:progress:v1";
const PROGRAM_KEY = "suede-sing:program:v1";
const PROGRAM_ID = "foundations-2w";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) throw new Error(`${name}: ${detail}`);
}

/** The Today card's state, read off its data attributes. */
async function todayCard(page) {
  const card = page.locator('section[aria-labelledby="program-today-heading"]');
  await card.waitFor({ timeout: 15000 });
  return {
    status: await card.getAttribute("data-status"),
    index: Number(await card.getAttribute("data-program-day")),
    text: (await card.innerText()).replace(/\s+/g, " "),
  };
}

/** Rows on the card: href, title and the sessions that would tick each one. */
async function todayRows(page) {
  return page.$$eval('section[aria-labelledby="program-today-heading"] a[data-program-item]', (as) =>
    as.map((a) => ({
      href: a.getAttribute("href"),
      kind: a.getAttribute("data-program-item"),
      title: a.querySelector(".font-medium")?.textContent ?? "",
      evidence: JSON.parse(a.getAttribute("data-evidence") ?? "[]"),
    })),
  );
}

/** Append sessions to the practice log for `dayOffset` days from today, as the rooms would. */
async function seedSessions(page, evidence, dayOffset = 0) {
  await page.evaluate(
    ({ evidence, dayOffset, key }) => {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const state = JSON.parse(localStorage.getItem(key) ?? "null") ?? {
        xp: 0,
        sessions: [],
        streak: { current: 0, best: 0, lastDay: null },
        range: {},
        rangeHistory: [],
        achievements: [],
      };
      for (const e of evidence) {
        state.sessions.unshift({
          id: `e2e-${Math.random().toString(36).slice(2)}`,
          type: e.type,
          // Now, not noon: a session from before the program started belongs
          // to an earlier run and does not count.
          date: d.toISOString(),
          day,
          durationSec: 60,
          ...(e.detail ? { detail: e.detail } : {}),
          xp: 1,
        });
      }
      localStorage.setItem(key, JSON.stringify(state));
    },
    { evidence, dayOffset, key: PROGRESS_KEY },
  );
}

/** Move the whole record back a day, as if midnight had passed since. */
async function shiftBackADay(page) {
  await page.evaluate(
    ({ progressKey, programKey }) => {
      const back = (day) => {
        const t = Date.parse(`${day}T00:00:00Z`) - 86400000;
        return new Date(t).toISOString().slice(0, 10);
      };
      const backTime = (iso) => new Date(Date.parse(iso) - 86400000).toISOString();
      const program = JSON.parse(localStorage.getItem(programKey));
      program.startedDay = back(program.startedDay);
      if (program.startedAt) program.startedAt = backTime(program.startedAt);
      program.done = program.done.map((d) => ({ ...d, day: back(d.day) }));
      localStorage.setItem(programKey, JSON.stringify(program));
      const progress = JSON.parse(localStorage.getItem(progressKey));
      progress.sessions = progress.sessions.map((s) => ({ ...s, day: back(s.day), date: backTime(s.date) }));
      localStorage.setItem(progressKey, JSON.stringify(progress));
    },
    { progressKey: PROGRESS_KEY, programKey: PROGRAM_KEY },
  );
}

const launch = EXECUTABLE
  ? { executablePath: EXECUTABLE, headless: true }
  : { channel: CHANNEL, headless: true };
const browser = await chromium.launch(launch);
let failed = false;

try {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  // The coach introduces itself once a singer has history, over the page;
  // mark it seen so the seeded log does not put a dialog over the calendar.
  await context.addInitScript(() => {
    try {
      if (!localStorage.getItem("suede-sing:coach-intro:v1")) {
        localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
      }
    } catch {}
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // 1. The list, then a program's calendar, then start it.
  await page.goto(`${BASE}/programs`, { waitUntil: "networkidle" });
  check("list renders", (await page.locator("h1").innerText()).includes("Practice programs"));
  const cards = await page.locator("a", { hasText: /-day calendar/ }).count();
  check("five programs listed", cards === 5, `${cards}`);
  await page.locator("a", { hasText: "See the 14-day calendar" }).click();
  await page.waitForURL(/program=foundations-2w/);
  check("detail view opens", (await page.locator("h2", { hasText: "Foundations in 2 weeks" }).count()) > 0);
  await page.getByRole("button", { name: "Start this program" }).click();

  let card = await todayCard(page);
  check("today card shows day 1", card.status === "todo" && card.index === 0, card.text.slice(0, 120));
  const rows = await todayRows(page);
  check("day 1 has rows", rows.length > 0, rows.map((r) => r.href).join(" "));
  check("rows link relatively", rows.every((r) => r.href.startsWith("/")));

  // 2. Every row opens its room on the thing it names.
  const room = await context.newPage();
  for (const r of rows) {
    const res = await room.goto(`${BASE}${r.href}`, { waitUntil: "networkidle" });
    check(`${r.href} responds`, res?.ok() === true, `${res?.status()}`);
    // The warmups room asks for the mic first, naming what it will start; a
    // breath set opens straight into its runner, headed by its first drill.
    const expected =
      r.kind === "routine" || r.kind === "exercise"
        ? `turn on your mic to start “${r.title}”`
        : r.kind === "breath"
          ? `${r.evidence[0].detail} step 1 of`
          : r.title;
    const body = (await room.locator("body").innerText()).replace(/\s+/g, " ").toLowerCase();
    check(`${r.href} opens on "${expected}"`, body.includes(expected.toLowerCase()));
  }
  await room.close();

  // 3. The log completes the day; the next one waits for tomorrow.
  await seedSessions(page, rows.flatMap((r) => r.evidence));
  await page.reload({ waitUntil: "networkidle" });
  card = await todayCard(page);
  check("day 1 completes from the log", card.status === "done-today" && card.index === 0, card.text.slice(0, 160));
  check("day 2 opens tomorrow", /Day 2, .* opens tomorrow/.test(card.text));

  // 4. The warmups room points at the running program.
  await page.goto(`${BASE}/warmups`, { waitUntil: "networkidle" });
  const entry = page.locator('section[aria-labelledby="program-entry-heading"]');
  await entry.waitFor({ timeout: 15000 });
  check("warmups shows the program card", (await entry.innerText()).toLowerCase().includes("your program: day 1"));

  // 5. Midnight passes: day 2 is today's.
  await shiftBackADay(page);
  await page.goto(`${BASE}/programs`, { waitUntil: "networkidle" });
  card = await todayCard(page);
  check("after midnight, day 2 is today", card.status === "todo" && card.index === 1, card.text.slice(0, 120));

  // 6. Doing day 2 and day 3 today still completes only day 2.
  const day2 = await todayRows(page);
  await seedSessions(page, day2.flatMap((r) => r.evidence));
  // Day 3's rows are read from the calendar, which previews them.
  await page.goto(`${BASE}/programs?program=${PROGRAM_ID}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Day 3:/ }).click();
  const day3 = await page.$$eval("main a[data-program-item]", (as) =>
    as
      .filter((a) => !a.closest('section[aria-labelledby="program-today-heading"]'))
      .flatMap((a) => JSON.parse(a.getAttribute("data-evidence") ?? "[]")),
  );
  check("day 3 preview has rows", day3.length > 0);
  await seedSessions(page, day3);
  await page.reload({ waitUntil: "networkidle" });
  card = await todayCard(page);
  check("no skipping ahead: only day 2 completes today", card.status === "done-today" && card.index === 1, card.text.slice(0, 120));
  check("no page errors", errors.length === 0, errors.join(" | "));
  await context.close();

  // 7. Storage blocked: the page still renders and a program still starts.
  const blocked = await browser.newContext({ viewport: { width: 320, height: 720 } });
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  const bp = await blocked.newPage();
  const blockedErrors = [];
  bp.on("pageerror", (e) => blockedErrors.push(String(e)));
  await bp.goto(`${BASE}/programs?program=recovery-week`, { waitUntil: "networkidle" });
  check("blocked storage: detail renders", (await bp.locator("h2", { hasText: "Recovery week" }).count()) > 0);
  await bp.getByRole("button", { name: "Start this program" }).click();
  card = await todayCard(bp);
  check("blocked storage: today card in memory", card.status === "todo" && card.index === 0);
  await bp.getByRole("button", { name: "Mark day 1 done" }).click();
  card = await todayCard(bp);
  check("blocked storage: mark day done", card.status === "done-today" && card.index === 0);
  check("blocked storage: no page errors", blockedErrors.length === 0, blockedErrors.join(" | "));
  await blocked.close();
} catch (e) {
  failed = true;
  console.error(String(e));
} finally {
  await browser.close();
}

if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify(results, null, 2));
const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} checks passed${failed ? ", then stopped on an error" : ""}`);
process.exit(failed ? 1 : 0);
