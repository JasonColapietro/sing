/**
 * The browser suites CI runs, one per "Browser (<suite>)" job, as a runner you
 * can call by hand against the same kind of server:
 *
 *   npm run build && npm start -- --port 3100     # in another shell
 *   node e2e/suite.mjs <suite> [baseUrl] [--executable=path]
 *
 * The base URL defaults to SING_BASE_URL, then http://127.0.0.1:3100; the
 * browser build to SING_BROWSER_EXECUTABLE, else each script's Chrome channel.
 * Every command runs even after an earlier one failed, so one run yields every
 * suite's evidence, and the exit status is non-zero when any failed. Output is
 * teed into browser-results/<label>.log. Under GitHub Actions each result is a
 * line in the step summary and each failure an ::error annotation carrying the
 * log's FAIL lines and its tail, so a red job reads from the checks view.
 */
import { spawn } from "node:child_process";
import { appendFileSync, createWriteStream, mkdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

export const DEFAULT_BASE_URL = "http://127.0.0.1:3100";
/** A command gets this long before SIGTERM, then ten more seconds before SIGKILL. */
export const COMMAND_TIMEOUT_MS = 12 * 60 * 1000;
const KILL_GRACE_MS = 10_000;
const SERVER_WAIT_MS = 60_000;
const RESULTS = "browser-results";

const json = (name) => `--json=${RESULTS}/${name}.json`;
/** A script that takes the base URL and the --executable flag. */
const journey = (label, script, ...args) => ({ label, script, args, executable: true });
/** A script that takes the base URL only. */
const plain = (label, script, ...args) => ({ label, script, args, executable: false });
const cls = (label, ...args) => journey(label, "e2e/cls.mjs", ...args);

/**
 * The stored states the prerender cannot show (e2e/README.md, "Layout
 * shift"), each on the routes it reshapes. program-detail and
 * program-foundations are /programs?program=<id> deep links (cls.mjs
 * DEEP_LINKS); each finished program has its own pre-paint size, so each is
 * measured on /programs and its own view; saved-range loads the singer and
 * song pages whose header action and verdict a saved range swaps in.
 */
const STATE_ROUTES = {
  capped: "warmups,breath,ear-training,songs,breath-deeplink-box,warmups-deeplink-routine,ear-deeplink-routine",
  program: "programs,program-detail,program-foundations,warmups,progress,warmups-deeplink-routine",
  "program-capped": "programs,program-detail,program-foundations,warmups,breath,ear-training",
  "rest-day": "programs,program-detail,warmups,progress",
  finished: "programs,program-detail,warmups,progress",
  "finished-high-notes": "programs,program-high-notes",
  "finished-mix": "programs,program-mix",
  "finished-foundations": "programs,program-foundations",
  "finished-recovery": "programs,program-recovery",
  "finished-vibrato": "programs,program-vibrato",
  "saved-range": "singer-adele,singer-celine-dion,song-someone-like-you",
};

/** The rooms' own deep links (e2e/cls.mjs DEEP_LINKS). */
const DEEP_LINK_ROUTES =
  "breath-deeplink-box,breath-deeplink-routine,warmups-deeplink-exercise,warmups-deeplink-routine,ear-deeplink-routine";

/** Each state on a phone and a desktop. */
const stateRuns = (states) =>
  states.flatMap((state) =>
    ["mobile-375", "desktop-1280"].map((viewport) =>
      cls(
        `layout-shift-${state}-${viewport}`,
        `--viewport=${viewport}`,
        `--state=${state}`,
        `--route=${STATE_ROUTES[state]}`,
        json(`layout-shift-${state}-${viewport}`),
      ),
    ),
  );

export const SUITES = {
  journeys: [
    journey("checkout-recovery", "e2e/checkout-recovery.mjs"),
    plain("share-cards", "scripts/audit-share-cards.mjs"),
    journey("navigation", "e2e/navigation.mjs"),
    journey("navigation-inputs", "e2e/navigation-inputs.mjs"),
    journey("progress-reset", "e2e/progress-reset.mjs"),
    journey("recorder-recovery", "e2e/recorder-recovery.mjs"),
    journey("voice-tabs", "e2e/voice-tabs.mjs"),
    journey("mic-refusal", "scripts/audit-mic-gate.mjs"),
    journey("programs", "e2e/programs.mjs", json("programs")),
    journey("song-first-practice", "e2e/song-first-practice.mjs"),
    journey("songs-modes", "e2e/songs-modes.mjs"),
    journey("song-visit-unlock", "e2e/song-visit-unlock.mjs"),
  ],
  "mobile-audit": [journey("mobile-audit", "e2e/run.mjs", "--viewport=mobile-375", json("mobile-audit"))],
  "desktop-audit": [journey("desktop-audit", "e2e/run.mjs", "--viewport=desktop-1280", json("desktop-audit"))],
  audio: [
    journey("mic-preferences", "e2e/mic-preferences.mjs"),
    journey("mic-startup", "e2e/mic-startup.mjs"),
    journey("ear-mic-interruption", "e2e/ear-mic-interruption.mjs"),
    journey("ear-keyboard", "e2e/ear-keyboard.mjs"),
    journey("mic-release", "e2e/mic-release.mjs"),
    journey("pitch-precision", "e2e/pitch-precision.mjs", json("pitch-precision")),
    journey("breath-gate", "e2e/breath-gate.mjs", json("breath-gate")),
    journey("vibrato-drill", "e2e/vibrato-drill.mjs", json("vibrato-drill")),
    journey("song-loop-scoring", "e2e/song-loop-scoring.mjs"),
    journey("warmup-timing", "scripts/audit-warmup-timing.mjs"),
  ],
  // Split in two because the whole set is 25 browser launches: this half
  // holds every route as a newcomer, the returning singer, and the states a
  // singer mid-program carries; the other holds every finished program.
  "layout-shift": [
    cls("layout-shift", "--viewport=mobile-375"),
    // A plain returning singer (a saved range and a practice history, no cap
    // or program state), which the fresh run above never seeds.
    cls("layout-shift-returning", "--returning", "--viewport=mobile-375", json("layout-shift-returning-mobile-375")),
    // /singers on a tall desktop window, where the section after its chart is
    // on the first screen when the chart mounts (0.128 at 1440x1300).
    cls("layout-shift-singers-tall", "--viewport=desktop-1440-tall", "--route=singers-directory", json("layout-shift-singers-tall")),
    // A room's own deep links loaded cold on a desktop (the runs above cover
    // a phone); the pre-paint script holds the front page back until the room
    // reads its address (lib/prepaint.ts data-sing-deeplink).
    cls("layout-shift-deeplinks-desktop-1280", "--viewport=desktop-1280", `--route=${DEEP_LINK_ROUTES}`, json("layout-shift-deeplinks-desktop-1280")),
    cls("layout-shift-deeplinks-returning-desktop-1280", "--returning", "--viewport=desktop-1280", `--route=${DEEP_LINK_ROUTES}`, json("layout-shift-deeplinks-returning-desktop-1280")),
    ...stateRuns(["capped", "program", "program-capped", "rest-day", "saved-range"]),
  ],
  "layout-shift-finished": stateRuns([
    "finished",
    "finished-high-notes",
    "finished-mix",
    "finished-foundations",
    "finished-recovery",
    "finished-vibrato",
  ]),
};

/** The argv `node` runs for a command. */
export function commandArgv({ script, args, executable }, { baseUrl, executablePath }) {
  return [script, baseUrl, ...(executable && executablePath ? [`--executable=${executablePath}`] : []), ...args];
}

/**
 * The log's FAIL and error lines (with twelve lines of context each, sixty at
 * most) and then its last fifteen lines, escaped for a workflow command.
 */
export function annotationBody(log) {
  const lines = log.replace(/\n$/, "").split("\n");
  const picked = [];
  let context = 0;
  for (const line of lines) {
    if (/^(FAIL|not ok)|Error/.test(line)) {
      picked.push(line);
      context = 12;
    } else if (context > 0) {
      picked.push(line);
      context--;
    }
  }
  return [...picked.slice(0, 60), "...", ...lines.slice(-15)]
    .map((line) => `${line.replace(/%/g, "%25").replace(/\r/g, "%0D")}%0A`)
    .join("");
}

function runCommand(command, options) {
  const argv = commandArgv(command, options);
  const logPath = `${RESULTS}/${command.label}.log`;
  const log = createWriteStream(logPath);
  console.log(`\n> node ${argv.join(" ")}`);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, argv, { stdio: ["ignore", "pipe", "pipe"] });
    for (const stream of [child.stdout, child.stderr]) {
      stream.on("data", (chunk) => {
        process.stdout.write(chunk);
        log.write(chunk);
      });
    }
    const term = setTimeout(() => child.kill("SIGTERM"), COMMAND_TIMEOUT_MS);
    const kill = setTimeout(() => child.kill("SIGKILL"), COMMAND_TIMEOUT_MS + KILL_GRACE_MS);
    const finish = (ok) => {
      clearTimeout(term);
      clearTimeout(kill);
      log.end(() => resolve(ok));
    };
    child.on("error", (error) => {
      log.write(`${error.stack ?? error}\n`);
      finish(false);
    });
    child.on("close", (code, signal) => finish(code === 0 && !signal));
  });
}

/** Resolves once the server answers, or throws after a minute. */
export async function waitForServer(baseUrl) {
  const deadline = Date.now() + SERVER_WAIT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {
      // Not up yet.
    }
    await sleep(500);
  }
  throw new Error(`${baseUrl} did not become ready within ${SERVER_WAIT_MS / 1000} seconds.`);
}

/** Runs every command of a suite; returns the labels that failed. */
export async function runSuite(name, { baseUrl, executablePath }) {
  const commands = SUITES[name];
  if (!commands) throw new Error(`Unknown browser suite: ${name} (one of ${Object.keys(SUITES).join(", ")})`);
  mkdirSync(RESULTS, { recursive: true });
  await waitForServer(baseUrl);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  const failed = [];
  for (const command of commands) {
    const ok = await runCommand(command, { baseUrl, executablePath });
    const line = ok ? `- PASS: ${command.label}` : `- FAIL: ${command.label} (see browser-results artifact)`;
    if (summary) appendFileSync(summary, `${line}\n`);
    if (!ok) {
      failed.push(command.label);
      if (summary) {
        console.log(`::error title=FAIL: ${command.label}::${annotationBody(readFileSync(`${RESULTS}/${command.label}.log`, "utf8"))}`);
      }
    }
  }
  console.log(`\n${name}: ${commands.length - failed.length} of ${commands.length} passed`);
  for (const label of failed) console.log(`  FAIL: ${label} (${RESULTS}/${label}.log)`);
  return failed;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const argv = process.argv.slice(2);
  const bare = argv.filter((a) => !a.startsWith("--"));
  const flag = argv.find((a) => a.startsWith("--executable="));
  const name = bare[0];
  if (!name || !SUITES[name]) {
    console.error(`usage: node e2e/suite.mjs <${Object.keys(SUITES).join("|")}> [baseUrl] [--executable=path]`);
    process.exit(2);
  }
  const failed = await runSuite(name, {
    baseUrl: (bare[1] ?? process.env.SING_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, ""),
    executablePath: flag ? flag.slice("--executable=".length) : process.env.SING_BROWSER_EXECUTABLE || null,
  });
  process.exit(failed.length ? 1 : 0);
}
