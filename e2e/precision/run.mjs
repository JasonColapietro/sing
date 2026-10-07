/**
 * Pitch-precision harness for sing.
 *
 *   npm run build && npm start      # in another shell
 *   node e2e/precision/run.mjs [baseUrl] [--fixture=id,id] [--surface=range,studio,ear]
 *                                        [--rate=44100] [--channels=2]
 *
 * Plays each deterministic fixture from fixtures.mjs into Chrome as a fake
 * microphone, opens each hooked surface, reads the live pitch it publishes on
 * `data-pitch-hz`, and scores the readings against the fixture's true pitch.
 *
 * Exit codes: 0 clean, 1 any unexpected failure, 2 rig error (the probe could
 * not hear the 440 Hz fixture, or the browser would not launch).
 *
 * Conventions shared with e2e/run.mjs: Chrome via `channel: "chrome"` (the
 * bundled headless-shell never signals ready on this machine), a fresh store
 * per page, no sign-in, and only Playwright's locator.click().
 */
import pw from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  FIXTURES,
  SAMPLE_RATE,
  buildFixture,
  centsError,
  getFixture,
  scoreFixture,
  zeroCrossingHz,
} from "./fixtures.mjs";

const { chromium } = pw;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(HERE, "out");
const POLL_MS = 50;

/**
 * Known failures, keyed `${fixtureId}@${surface}` with the reason. A listed
 * failure does not fail the run; a listed entry that passes is reported as an
 * unexpected pass so the map does not rot. Add entries only from an observed
 * run, with the observed numbers in the reason.
 */
export const EXPECTED_FAILURES = Object.freeze({});

/**
 * The hooked surfaces. Button names are the exact strings the components
 * render (components/range/range-test.tsx, components/ui.tsx MicGate,
 * components/ear/session.tsx ShellMicGate).
 */
export const SURFACES = Object.freeze([
  {
    id: "range",
    path: "/range",
    testid: "range-live-pitch",
    discardMs: 500,
    windowMs: 6000,
    async enable(page) {
      await page.getByRole("button", { name: "Start free range test", exact: true }).click();
    },
  },
  {
    id: "studio",
    path: "/studio",
    testid: "studio-live-pitch",
    discardMs: 500,
    windowMs: 8000,
    async enable(page) {
      await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
    },
  },
  {
    id: "ear",
    path: "/ear-training",
    testid: "ear-live-pitch",
    discardMs: 300,
    windowMs: 8000,
    gate: "data-sing-active",
    gateTimeoutMs: 8000,
    async enable(page) {
      // The path renders one <section> per level inside an outer <section>;
      // the level we want contains the "Medium" label and not the "Easy" one.
      const level = page
        .locator("section")
        .filter({ has: page.getByText("Medium", { exact: true }) })
        .filter({ hasNot: page.getByText("Easy", { exact: true }) });
      const row = level.getByRole("button", { name: /^Pitch match\b/ });
      const count = await row.count();
      if (count !== 1) throw new Error(`expected one Medium "Pitch match" row, found ${count}`);
      await row.click();
      await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
    },
  },
]);

export const SKIPPED_SURFACES = Object.freeze([
  {
    id: "recorder",
    reason: "Pro-gated offline take analysis, no live pitch; hooked (recorder-take-median) for manual QA only.",
  },
]);

function parseArgs(argv) {
  const flag = (name) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : null;
  };
  const list = (name) => flag(name)?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
  return {
    base: (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, ""),
    fixtures: list("fixture"),
    surfaces: list("surface"),
    sampleRate: Number(flag("rate") ?? SAMPLE_RATE),
    channels: Number(flag("channels") ?? 1),
  };
}

async function launch(wavPath) {
  return chromium.launch({
    channel: "chrome",
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
      `--use-file-for-fake-audio-capture=${wavPath}%noloop`,
    ],
  });
}

async function freshPage(browser) {
  const context = await browser.newContext({ permissions: ["microphone"], deviceScaleFactor: 1 });
  // Same reason as e2e/run.mjs: a seeded record raises the Pro modal, which
  // swallows every click beneath it.
  await context.addInitScript(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
  });
  return context.newPage();
}

/**
 * Rig probe: can this Chrome hear a fake-capture file at all? Reads the 440
 * fixture through getUserMedia with every voice-processing stage off and
 * checks the zero-crossing pitch of one analyser frame.
 */
async function probeRig(base, wavPath) {
  const browser = await launch(wavPath);
  try {
    const page = await freshPage(browser);
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    const got = await page.evaluate(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new AudioContext();
      await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      ctx.createMediaStreamSource(stream).connect(analyser);
      await new Promise((r) => setTimeout(r, 1000));
      const buf = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buf);
      stream.getTracks().forEach((t) => t.stop());
      const sampleRate = ctx.sampleRate;
      await ctx.close();
      return { frame: Array.from(buf), sampleRate };
    });
    let sum = 0;
    for (const v of got.frame) sum += v * v;
    const rms = Math.sqrt(sum / got.frame.length);
    const hz = zeroCrossingHz(got.frame, got.sampleRate);
    const c = centsError(hz, 440);
    const ok = rms > 0 && c !== null && Math.abs(c) <= 50;
    return { ok, rms, hz, cents: c, sampleRate: got.sampleRate };
  } finally {
    await browser.close();
  }
}

/**
 * Sample `data-pitch-hz` in the page every POLL_MS. Timestamps are in-page
 * performance.now() relative to t0, taken right after the enabling click, so
 * no Node round trip sits inside the timing.
 */
async function sampleSurface(page, surface, t0) {
  return page.evaluate(
    async ({ testid, discardMs, windowMs, gate, gateTimeoutMs, t0, pollMs }) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const q = () => document.querySelector(`[data-testid="${testid}"]`);
      let nodeSeen = false;
      let start = t0;
      if (gate) {
        const deadline = performance.now() + gateTimeoutMs;
        let open = false;
        while (performance.now() < deadline) {
          const el = q();
          if (el) nodeSeen = true;
          if (el?.getAttribute(gate) === "1") { open = true; break; }
          await sleep(pollMs);
        }
        if (!open) return { readings: [], nodeSeen, stop: "gate-never-opened" };
        start = performance.now();
      }
      const readings = [];
      let stop = "window";
      while (performance.now() - start < discardMs + windowMs) {
        const now = performance.now();
        const el = q();
        if (el) nodeSeen = true;
        if (gate && el?.getAttribute(gate) === "0") { stop = "gate-closed"; break; }
        if (now - start >= discardMs) {
          const raw = el?.getAttribute("data-pitch-hz") ?? "";
          const hz = raw === "" ? null : Number(raw);
          readings.push({ t: (now - t0) / 1000, hz: Number.isFinite(hz) && hz > 0 ? hz : null });
        }
        await sleep(pollMs);
      }
      return { readings, nodeSeen, stop };
    },
    {
      testid: surface.testid,
      discardMs: surface.discardMs,
      windowMs: surface.windowMs,
      gate: surface.gate ?? null,
      gateTimeoutMs: surface.gateTimeoutMs ?? 0,
      t0,
      pollMs: POLL_MS,
    },
  );
}

async function runOne(base, fixture, surface, wavPath) {
  const browser = await launch(wavPath);
  try {
    const page = await freshPage(browser);
    await page.goto(`${base}${surface.path}`, { waitUntil: "networkidle", timeout: 45000 });
    await surface.enable(page);
    const t0 = await page.evaluate(() => performance.now());
    const { readings, nodeSeen, stop } = await sampleSurface(page, surface, t0);
    if (!nodeSeen) return { error: `no [data-testid="${surface.testid}"] on the page`, readings, stop };
    if (stop === "gate-never-opened") return { error: `${surface.gate} never became "1"`, readings, stop };
    return { score: scoreFixture(fixture, readings), readings, stop };
  } catch (err) {
    return { error: err.message.split("\n")[0], readings: [] };
  } finally {
    await browser.close();
  }
}

function classify(key, result) {
  const expected = Object.hasOwn(EXPECTED_FAILURES, key);
  if (result.error) return expected ? "expected-fail" : "error";
  if (result.score.pass) return expected ? "unexpected-pass" : "pass";
  return expected ? "expected-fail" : "fail";
}

const fmt = (v, d = 1) => (v === null || v === undefined ? "—" : v.toFixed(d));

function table(rows) {
  const lines = [
    "| fixture | surface | n | voiced % | median ¢ | p95 ¢ | offset s | status | note |",
    "|---|---|---:|---:|---:|---:|---:|---|---|",
  ];
  for (const r of rows) {
    const s = r.score ?? {};
    lines.push(
      `| ${r.fixture} | ${r.surface} | ${s.n ?? r.readings ?? 0} | ${s.voicedRate === undefined ? "—" : (s.voicedRate * 100).toFixed(0)} | ${fmt(s.medianCents)} | ${fmt(s.p95Cents)} | ${fmt(s.offset, 2)} | ${r.status} | ${r.error ?? s.reason ?? ""} |`,
    );
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fixtures = args.fixtures ? args.fixtures.map(getFixture) : FIXTURES;
  const surfaces = args.surfaces ? SURFACES.filter((s) => args.surfaces.includes(s.id)) : SURFACES;
  if (surfaces.length === 0) {
    console.error(`no surface matched --surface=${args.surfaces?.join(",")}; known: ${SURFACES.map((s) => s.id).join(", ")}`);
    process.exit(2);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const encode = { sampleRate: args.sampleRate, channels: args.channels };
  const wavFor = async (id) => {
    const file = path.join(OUT_DIR, `${id}.wav`);
    await writeFile(file, buildFixture(id, encode).wav);
    return file;
  };

  console.log(
    `sing pitch precision — ${fixtures.length} fixtures x ${surfaces.length} surfaces against ${args.base} (${args.sampleRate} Hz, ${args.channels} ch)\n`,
  );

  const probe = await probeRig(args.base, await wavFor("sine-440"));
  console.log(`rig probe: rms=${probe.rms.toFixed(4)} hz=${fmt(probe.hz, 2)} cents=${fmt(probe.cents)} ctx=${probe.sampleRate} Hz`);
  if (!probe.ok) {
    console.error("rig error: Chrome did not hear the 440 Hz fixture. Try --rate=44100 or --channels=2 (see e2e/README.md).");
    await writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify({ probe, rows: [] }, null, 2));
    process.exit(2);
  }

  const rows = [];
  for (const fixture of fixtures) {
    const wavPath = await wavFor(fixture.id);
    for (const surface of surfaces) {
      const key = `${fixture.id}@${surface.id}`;
      const result = await runOne(args.base, fixture, surface, wavPath);
      const status = classify(key, result);
      rows.push({
        key,
        fixture: fixture.id,
        surface: surface.id,
        status,
        expectedReason: EXPECTED_FAILURES[key] ?? null,
        error: result.error ?? null,
        stop: result.stop ?? null,
        score: result.score ?? null,
        readingCount: result.readings.length,
        readings: result.readings,
      });
      console.log(`  ${key}: ${status}${result.error ? ` (${result.error})` : result.score?.reason ? ` (${result.score.reason})` : ""}`);
    }
  }

  const report = {
    base: args.base,
    encode,
    probe,
    skipped: SKIPPED_SURFACES,
    expectedFailures: EXPECTED_FAILURES,
    rows,
  };
  await writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));

  console.log(`\n${table(rows.map((r) => ({ ...r, readings: r.readingCount })))}\n`);
  for (const s of SKIPPED_SURFACES) console.log(`skipped ${s.id}: ${s.reason}`);

  const unexpectedPasses = rows.filter((r) => r.status === "unexpected-pass");
  for (const r of unexpectedPasses) console.warn(`warning: ${r.key} is listed in EXPECTED_FAILURES but passed — remove it`);
  const bad = rows.filter((r) => r.status === "fail" || r.status === "error");
  const counts = rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
  console.log(`\n${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(" ")}  report: ${path.relative(process.cwd(), path.join(OUT_DIR, "report.json"))}`);
  process.exit(bad.length > 0 ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => { console.error(e); process.exit(2); });
}
