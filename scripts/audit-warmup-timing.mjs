/**
 * Independent audit of the warmup player's timing and scoring alignment.
 *
 * Usage: npm run dev, then
 *   node scripts/audit-warmup-timing.mjs [baseUrl]   # default http://localhost:3000
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
 *   2. A voice aligned to the scored window scores well. The bound here is
 *      55, not higher, and that number is a measurement, not a hedge: probing
 *      the live cents readout during an aligned synthetic take (2026-08-23)
 *      showed the voice reading ~200 ms behind the target at every note
 *      boundary, of which scoreLagSec's model compensates ~95 ms. The
 *      residual ~100 ms is input-chain latency the model does not carry
 *      (stream buffering, and the median window's actual flip behaviour at
 *      transitions), and it caps an aligned take in this rig at roughly
 *      65-75% — before dev-server load jitter, which measured as a 43% vs
 *      67% spread on identical takes. Best-of-two reps absorbs the jitter;
 *      55 is the floor that survives it. If this check starts failing, the
 *      compensation regressed; if it starts passing near 100, the residual
 *      got fixed — raise the bound.
 *   3. The same voice 250 ms late scores materially lower, and at least 20
 *      points under the aligned take. Without this differential, check 2
 *      would pass against a scorer that ignored timing altogether.
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
const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const VIEW = { width: 1280, height: 900 };

/** The ladder these checks assume: range 48–72 starts the walk at MIDI 52. */
const ROOT = 52;
/** five-note-scale at 1x, mirroring buildSegments: noteDur 0.5, gap 0.08. */
const NOTE_DUR = 0.5;
const NOTE_GAP = 0.08;
const OFFSETS = [0, 2, 4, 5, 7, 5, 4, 2, 0];

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

async function startExercise(page, title) {
  await page
    .locator("button", { has: page.locator("h3", { hasText: title }) })
    .first()
    .click();
}

/**
 * Sing the five-note pattern from the synthetic voice, starting `delaySec`
 * after the call, on the given root — the ladder climbs a semitone per rep,
 * so rep 2 is sung at ROOT + 1. Frequencies and spacing mirror buildSegments
 * exactly, so a delay of ~0 sung at "Your turn" is an aligned take.
 */
async function singPattern(page, delaySec, root = ROOT) {
  await page.evaluate(
    ([delay, root, noteDur, gap, offsets]) => {
      const { ctx, osc, gain } = window.__voice;
      const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
      const t0 = ctx.currentTime + delay;
      offsets.forEach((o, i) => {
        const t = t0 + i * (noteDur + gap);
        osc.frequency.setValueAtTime(freq(root + o), t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.setValueAtTime(0, t + noteDur);
      });
    },
    [delaySec, root, NOTE_DUR, NOTE_GAP, OFFSETS],
  );
}

async function readRepScore(page, timeout) {
  const pill = page.locator("text=/Rep score \\d+%/").first();
  await pill.waitFor({ state: "visible", timeout });
  const text = await pill.textContent();
  return Number(/Rep score (\d+)%/.exec(text ?? "")[1]);
}

/* ---------------------------------------------- 1. silence scores nothing */

console.log("\n1. a silent mic scores nothing, guide at full");
{
  const { ctx, page } = await freshPage({ mode: "sing-along", guidePct: 100, click: true });
  await startExercise(page, "Sustained hold");
  // The voice's gain stays at 0: nobody sings. The first unsung rep shows the
  // pill; the second ends the session without logging anything.
  const silentPill = page.locator("text=No sound picked up").first();
  let pillShown = true;
  try {
    await silentPill.waitFor({ state: "visible", timeout: 40_000 });
  } catch {
    pillShown = false;
  }
  check("the first unsung rep says so on screen", pillShown);

  // Nothing was ever sung, so the walk exits back to the library.
  let backAtLibrary = true;
  try {
    await page
      .locator("text=Pick an exercise")
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
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
  await startExercise(page, "Five-note scale");

  // Rep 1: sing when the scored window opens.
  await page.locator("h2", { hasText: "Your turn" }).waitFor({ state: "visible", timeout: 20_000 });
  await singPattern(page, 0.05);
  const rep1 = await readRepScore(page, 20_000);

  // Check 4 rides the same session: between one rep pill and the next, the
  // only oscillators created are the next rep's two count-in clicks. A guide
  // leaking past level 0 would add a pattern's worth (each guide note is an
  // oscillator plus its shimmer).
  await page.locator("text=Rep 2").first().waitFor({ state: "visible", timeout: 5_000 });
  const c1 = await page.evaluate(() => window.__oscCount);
  // Rep 1's "Your turn" can still be on screen when the Rep 2 pill lands, so
  // wait for the heading to flip back to "Listen" before arming on the next
  // "Your turn" — firing on the stale heading sings a rep early.
  await page.locator("h2", { hasText: "Listen" }).waitFor({ state: "visible", timeout: 20_000 });
  await page.locator("h2", { hasText: "Your turn" }).waitFor({ state: "visible", timeout: 20_000 });
  await singPattern(page, 0.05, ROOT + 1); // rep 2 sits one rung up the ladder
  await page.locator("text=Rep 3").first().waitFor({ state: "visible", timeout: 20_000 });
  const rep2Text = await page.locator("text=/Rep score \\d+%/").first().textContent();
  const rep2 = Number(/Rep score (\d+)%/.exec(rep2Text ?? "")[1]);
  const c2 = await page.evaluate(() => window.__oscCount);

  // Best of two: an identical take measured 43% and 67% across runs purely
  // from load jitter, so one rep is not a stable measurement of alignment.
  alignedScore = Math.max(rep1, rep2);
  check("best aligned rep scores at least 55", alignedScore >= 55,
    `reps scored ${rep1}% and ${rep2}%`);

  console.log("\n4. the guide is silent at level zero");
  check("one rep to the next schedules only the two count-in clicks",
    c2 - c1 === 2, `oscillators created: ${c2 - c1}`);
  await ctx.close();
}

/* --------------------------------------------- 3. a late voice scores low */

console.log("\n3. the same voice 250 ms late scores materially lower");
{
  const { ctx, page } = await freshPage({ mode: "sing-along", guidePct: 0, click: true });
  await startExercise(page, "Five-note scale");
  await page.locator("h2", { hasText: "Your turn" }).waitFor({ state: "visible", timeout: 20_000 });
  await singPattern(page, 0.3);
  const lateScore = await readRepScore(page, 20_000);
  check("late take scores at most 70", lateScore <= 70, `scored ${lateScore}%`);
  check(
    "and at least 20 points under the aligned take",
    alignedScore !== null && alignedScore - lateScore >= 20,
    `aligned ${alignedScore}% vs late ${lateScore}%`,
  );
  await ctx.close();
}

await browser.close();
console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) FAILED.`);
process.exit(failed === 0 ? 0 : 1);
