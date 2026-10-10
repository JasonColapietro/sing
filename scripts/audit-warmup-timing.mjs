/**
 * Independent audit of the warmup player's timing and scoring alignment.
 *
 * Usage: npm run dev, then
 *   node scripts/audit-warmup-timing.mjs [baseUrl] [--executable=path]
 *
 * baseUrl defaults to http://localhost:3000. Pass `--executable` for a
 * Chromium build this Playwright did not install, e.g.
 * /opt/pw-browsers/chromium-1194/chrome-linux/chrome in a cloud container.
 * A run takes about 55 s.
 *
 * The unit suite can prove the timeline's arithmetic and the scorer's window,
 * but not that the two meet correctly once a real audio clock, a real
 * analyser and a real animation loop run together. This drives a real
 * browser with a synthetic voice — getUserMedia is replaced by an oscillator
 * feeding a MediaStreamDestination, the same rig the audio features have
 * always been verified with — and checks four things:
 *
 *   1. A silent mic scores nothing, even with the guide at full level. This
 *      is the check that fails if the app ever scores its own guide through
 *      the analysis path.
 *   2. A voice aligned to the scored window scores at least 90 (ALIGNED_FLOOR),
 *      best of two reps.
 *   3. The same voice 350 ms late (LATE_SEC) scores at most 65, and at least
 *      30 points under the aligned take. Without this differential, check 2
 *      would pass against a scorer that ignored timing altogether.
 *
 *   Where those bounds come from (measured 2026-10-10, `next dev --webpack`,
 *   headless Chromium 1194, five-note scale at 1x on root E3):
 *
 *   - The take is now armed in the page and starts on the DOM flip to "Sing"
 *     (see armTake). The audit used to wait for the word through Playwright
 *     and then schedule the take; a probe of that path saw the flip 150-520 ms
 *     after the DOM made it, so every "aligned" take was really a random
 *     150-520 ms late. That, not the scorer, is what produced the 43% vs 67%
 *     spread on identical takes the old floor of 55 was set against, and the
 *     same run of this script before the change scored reps of 65%, 4% and a
 *     late take of 2%.
 *   - With in-page arming, rep 1 by start offset after the flip: -250 ms 68%,
 *     -200 ms 85%, -150 ms 89%, -100 ms to +150 ms 99-100%, +200 ms 87-89%,
 *     +250 ms 78-80%, +300 ms 62%, +350 ms 47-51%, +400 ms 38%. Three full
 *     runs of this script scored every aligned rep 100% (six of six) and the
 *     late take 47%, 51% and 51%.
 *   - So the floor of 90 keeps 10 points of margin under every measured
 *     aligned rep and still fails if alignment drifts by more than about
 *     150-200 ms either way: a scoreLagSec or onset-grace regression, or a
 *     timeline that moved the window. The late ceiling of 65 sits 14 points
 *     over the worst late take, and the spread of 30 sits 19 under the
 *     smallest measured one (49).
 *   - The flat top of that curve is centred within about 25 ms of a zero
 *     offset. In this rig, then, scoreLagSec's model already covers the whole
 *     input chain, and the ~105 ms residual the onset grace forgives
 *     (ONSET_GRACE_SEC in components/warmups/scoring.ts, from
 *     MEASURED_ONSET_LAG_SEC and MODELLED_ONSET_LAG_SEC in lib/audio/latency.ts)
 *     does not show up. The 200 ms those constants record was probed through
 *     the old Playwright-armed take, so it probably carries the same arming
 *     latency. This audit does not change them: a real microphone adds input
 *     latency this rig has none of. Re-measure on real hardware before
 *     moving them.
 *
 *   If check 2 starts failing, the compensation or the window regressed. If
 *   check 3 starts failing at the top, the scorer has stopped caring about
 *   timing, or the grace has grown.
 *   4. With the guide level at zero, the only oscillators scheduled from one
 *      rep to the next are the count-in clicks — no pattern tones leak.
 *
 * What this CANNOT cover: a headless browser has no acoustic path from the
 * speakers to the microphone, so it cannot prove that echo cancellation
 * stops a real room from scoring the guide on real speakers. The manual
 * check for that half:
 *
 *   1. In Audio setup, set monitoring to Speakers.
 *   2. In a warmup, set the guide level to 100 and start "Sustained hold".
 *   3. Stay silent through two full reps.
 *   4. Both must read "No sound picked up". A rep score for singing that
 *      never happened means the guide is being scored.
 *
 * Exits non-zero if any check fails.
 */
import pw from "playwright";

const { chromium } = pw;
const argv = process.argv.slice(2);
const flag = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
/** A browser build this Playwright did not install, as in e2e/run.mjs. */
const EXECUTABLE = flag("executable");
const VIEW = { width: 1280, height: 900 };

/** The ladder these checks assume: range 48–72 starts the walk at MIDI 52. */
const ROOT = 52;
/** five-note-scale at 1x, mirroring buildSegments: noteDur 0.5, gap 0.08. */
const NOTE_DUR = 0.5;
const NOTE_GAP = 0.08;
const OFFSETS = [0, 2, 4, 5, 7, 5, 4, 2, 0];

/** Seconds after the flip to "Sing" an aligned take starts, and a late one. */
const ALIGNED_SEC = 0;
const LATE_SEC = 0.35;
/** The bounds checks 2 and 3 hold the measured scores to; see the header. */
const ALIGNED_FLOOR = 90;
const LATE_CEILING = 65;
const MIN_TIMING_SPREAD = 30;

/**
 * Replace getUserMedia with a controllable oscillator voice, and count every
 * oscillator any AudioContext creates (check 4 reads the deltas). Also seed a
 * saved range so the ladder is deterministic, and suppress the coach intro so
 * no overlay covers the cards.
 */
const SYNTH_MIC = `
  window.__oscCount = 0;
  const origOsc = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function () {
    window.__oscCount += 1;
    return origOsc.call(this);
  };
  const md = navigator.mediaDevices;
  if (md) {
    md.getUserMedia = async () => {
      const ctx = new AudioContext();
      const osc = origOsc.call(ctx);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const dest = ctx.createMediaStreamDestination();
      osc.type = "sine";
      osc.frequency.value = 220;
      osc.connect(gain).connect(dest);
      osc.start();
      window.__voice = { ctx, osc, gain };
      return dest.stream;
    };
  }
  // The stage banner is the session dialog's live region; "Sing" is the word
  // it shows from the first animation frame of the scored window.
  const singing = () =>
    [...(document.querySelector('[role="dialog"]')?.querySelectorAll("[aria-live]") ?? [])]
      .some((el) => el.textContent.trim() === "Sing");
  window.__take = null;
  window.__armTake = (delay, root, noteDur, gap, offsets) => {
    const take = { fired: false };
    window.__take = take;
    let was = singing();
    const mo = new MutationObserver(() => {
      const now = singing();
      if (now && !was) {
        mo.disconnect();
        const { ctx, osc, gain } = window.__voice;
        const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
        const t0 = ctx.currentTime + delay;
        offsets.forEach((o, i) => {
          const t = t0 + i * (noteDur + gap);
          osc.frequency.setValueAtTime(freq(root + o), t);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.setValueAtTime(0, t + noteDur);
        });
        take.fired = true;
      }
      was = now;
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
  };
  localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
  localStorage.setItem("suede-sing:progress:v1", JSON.stringify({
    xp: 0, sessions: [], streak: { current: 0, best: 0, lastDay: null },
    range: { lowMidi: 48, highMidi: 72, voiceTypeLabel: "Baritone",
             testedAt: new Date(0).toISOString() },
    rangeHistory: [], achievements: [],
  }));
`;

function prefsInit({ mode, guidePct, click }) {
  return `
    localStorage.setItem("suede-sing:warmup:mode:v1", ${JSON.stringify(mode)});
    localStorage.setItem("suede-sing:warmup:guide:v1", ${JSON.stringify(String(guidePct))});
    localStorage.setItem("suede-sing:warmup:click:v1", ${JSON.stringify(click ? "1" : "0")});
  `;
}

let failed = 0;
function check(label, pass, detail) {
  if (!pass) failed++;
  console.log(`${pass ? "  ok  " : "FAIL  "}${label}${detail ? `  — ${detail}` : ""}`);
}

const browser = await chromium.launch({
  ...(EXECUTABLE ? { executablePath: EXECUTABLE } : {}),
  args: ["--autoplay-policy=no-user-gesture-required"],
});

async function freshPage(prefs) {
  const ctx = await browser.newContext({ viewport: VIEW });
  await ctx.clearPermissions();
  await ctx.addInitScript(SYNTH_MIC + prefsInit(prefs));
  const page = await ctx.newPage();
  await page.goto(`${BASE}/warmups`, { waitUntil: "networkidle" });
  return { ctx, page };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The exercise's row on the room's path. A row is a button whose accessible
 * name opens with the title (then its pills, ladder and stars), so anchoring
 * the name picks it out from the routine cards, whose names open with the
 * routine's, and from "Minor five-note scale". Today's three are links, not
 * buttons, and start at the plan's tempo, so they must not be what this hits.
 */
function pathRow(page, title) {
  return page.getByRole("button", { name: new RegExp(`^${escapeRe(title)}`) });
}

/**
 * Start an exercise from its path row and return the running session: the
 * full-screen player, a dialog labelled with the exercise's title. Every read
 * below is scoped to it.
 */
async function startExercise(page, title) {
  await pathRow(page, title).click();
  const session = page.getByRole("dialog", { name: title, exact: true });
  await session.waitFor({ state: "visible", timeout: 20_000 });
  return session;
}

/**
 * Sing the five-note pattern from the synthetic voice `delaySec` after the
 * next time the stage banner flips to "Sing", on the given root — the ladder
 * climbs a semitone per rep, so rep 2 is sung at ROOT + 1. Frequencies and
 * spacing mirror buildSegments exactly, so a delay of 0 is an aligned take.
 *
 * The take is armed in the page, on a MutationObserver, and must be armed
 * while the banner does not yet say "Sing". Waiting for the word from here and
 * then scheduling the take is what the audit used to do, and Playwright's
 * polling saw the flip 150-520 ms after the DOM made it (probed 2026-10-10),
 * which is a random lateness on every "aligned" take.
 */
async function armTake(page, delaySec, root = ROOT) {
  await page.evaluate(
    ([delay, root, noteDur, gap, offsets]) =>
      window.__armTake(delay, root, noteDur, gap, offsets),
    [delaySec, root, NOTE_DUR, NOTE_GAP, OFFSETS],
  );
}

/** Wait for the armed take to have been scheduled. */
async function takeFired(page, timeout) {
  await page.waitForFunction(() => window.__take?.fired === true, null, { timeout });
}

/** The last rep's result pill, "Rep 67%", as distinct from the "Rep 2" counter. */
const REP_SCORE = /^Rep (\d+)%$/;

async function readRepScore(session, timeout) {
  const pill = session.getByText(REP_SCORE);
  await pill.waitFor({ state: "visible", timeout });
  return Number(REP_SCORE.exec((await pill.textContent())?.trim() ?? "")[1]);
}

/* ---------------------------------------------- 1. silence scores nothing */

console.log("\n1. a silent mic scores nothing, guide at full");
{
  const { ctx, page } = await freshPage({ mode: "sing-along", guidePct: 100, click: true });
  const session = await startExercise(page, "Sustained hold");
  // The voice's gain stays at 0: nobody sings. The first unsung rep shows the
  // pill; the second ends the session without logging anything.
  const silentPill = session.getByText("No sound picked up", { exact: true });
  let pillShown = true;
  try {
    await silentPill.waitFor({ state: "visible", timeout: 40_000 });
  } catch {
    pillShown = false;
  }
  check("the first unsung rep says so on screen", pillShown);

  // Nothing was ever sung, so the walk exits back to the room's home: the
  // session dialog closes and the path row that started it is back.
  let backAtLibrary = true;
  try {
    await session.waitFor({ state: "hidden", timeout: 30_000 });
    await pathRow(page, "Sustained hold").waitFor({ state: "visible", timeout: 5_000 });
  } catch {
    backAtLibrary = false;
  }
  const warmups = await page.evaluate(() => {
    const raw = localStorage.getItem("suede-sing:progress:v1");
    const state = raw ? JSON.parse(raw) : { sessions: [] };
    return state.sessions.filter((s) => s.type === "warmup").length;
  });
  check("the walk exits rather than logging", backAtLibrary && warmups === 0,
    `warmup sessions logged: ${warmups}`);
  await ctx.close();
}

/* ------------------------------- 2 + 4. aligned voice, and no guide at 0 */

console.log("\n2. an aligned voice scores well (guide at 0: the voice is the only sound)");
let alignedScore = null;
{
  const { ctx, page } = await freshPage({ mode: "sing-along", guidePct: 0, click: true });
  const session = await startExercise(page, "Five-note scale");

  // Rep 1: the teach pass ("Listen"), the count-in ("Breathe"), then the take
  // starts on the flip to "Sing", when the scored window opens.
  await armTake(page, ALIGNED_SEC);
  await takeFired(page, 20_000);
  // The result pill only shows outside a scored window, so once it is up the
  // next flip to "Sing" is rep 2's.
  const rep1 = await readRepScore(session, 20_000);
  await armTake(page, ALIGNED_SEC, ROOT + 1); // rep 2 sits one rung up the ladder

  // Check 4 rides the same session: between one rep counter and the next,
  // the only oscillators created are the next rep's two count-in clicks. A
  // guide leaking past level 0 would add a pattern's worth (each guide note is
  // an oscillator plus its shimmer).
  await session.getByText("Rep 2", { exact: true }).waitFor({ state: "visible", timeout: 5_000 });
  const c1 = await page.evaluate(() => window.__oscCount);
  // Sing-along teaches only rep 0, so rep 2 goes straight to its count-in and
  // then its window.
  await takeFired(page, 20_000);
  await session.getByText("Rep 3", { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
  const rep2 = await readRepScore(session, 5_000);
  const c2 = await page.evaluate(() => window.__oscCount);

  // Best of two, as a guard against a dev-server stall landing inside one
  // window. With the take armed in the page, both reps measure the same.
  alignedScore = Math.max(rep1, rep2);
  check(`best aligned rep scores at least ${ALIGNED_FLOOR}`, alignedScore >= ALIGNED_FLOOR,
    `reps scored ${rep1}% and ${rep2}%`);

  console.log("\n4. the guide is silent at level zero");
  check("one rep to the next schedules only the two count-in clicks",
    c2 - c1 === 2, `oscillators created: ${c2 - c1}`);
  await ctx.close();
}

/* --------------------------------------------- 3. a late voice scores low */

console.log(`\n3. the same voice ${Math.round(LATE_SEC * 1000)} ms late scores materially lower`);
{
  const { ctx, page } = await freshPage({ mode: "sing-along", guidePct: 0, click: true });
  const session = await startExercise(page, "Five-note scale");
  await armTake(page, LATE_SEC);
  await takeFired(page, 20_000);
  const lateScore = await readRepScore(session, 20_000);
  check(`late take scores at most ${LATE_CEILING}`, lateScore <= LATE_CEILING, `scored ${lateScore}%`);
  check(
    `and at least ${MIN_TIMING_SPREAD} points under the aligned take`,
    alignedScore !== null && alignedScore - lateScore >= MIN_TIMING_SPREAD,
    `aligned ${alignedScore}% vs late ${lateScore}%`,
  );
  await ctx.close();
}

await browser.close();
console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) FAILED.`);
process.exit(failed === 0 ? 0 : 1);
