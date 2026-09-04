/**
 * Interactive states: mic gate, empty states, and affordances.
 *
 * Four checks, in order:
 *   A. Microphone refusal on the eight practice rooms (route.mic) — the
 *      highest-value check here, because every room opens the mic through
 *      the same lib/audio/mic.ts + use-pitch.ts pair, so a defect found on
 *      one room is a defect on all eight.
 *   B. Empty/first-run containers, on every route.
 *   C. Disabled controls that look identical to enabled ones, on every route.
 *   D. Destructive-sounding controls with no confirmation signal, on every
 *      route.
 *
 * B/C/D run first, against the page exactly as run.mjs navigated it. A runs
 * last and does its own fresh navigation (see checkMicRefusal) — doing that
 * first would leave B/C/D reading a page this module had already reloaded
 * and clicked through, instead of the room's actual first-visit state.
 */
import { DESCRIBE } from "../lib/harness.mjs";

export const id = "states";
export const title = "Interactive states: mic gate, empty states, and affordances";

/**
 * Every route gets B/C/D; only `route.mic` adds the microphone probe (gated
 * inline in run(), not here) — there's no route.kind this module skips
 * entirely, so this stays unconditional.
 */
export function appliesTo() {
  return true;
}

// Confirmed against source, not guessed: every one of the eight rooms shows
// one of these two strings on a cold `!listening` mount (studio, warmups,
// songs, recorder, analyze and breath all say "Enable microphone"; range
// says "Start free range test"). ear-training shows neither until a mic-based
// game is opened — see openEarTrainingGame below.
//
// /warmups and /range can each start the mic from more than one card: every
// exercise tile on /warmups calls the same pitch.start() as the gate card's
// own button (components/warmups/warmups-client.tsx), and /range's "Retake
// test" button (shown only when a range is already saved) calls the same
// begin() as "Start free range test". This probe presses whichever of those
// is the one card guaranteed to be on screen on a cold visit — the gate
// card's button, or the always-present primary CTA — a real card a real
// visitor presses, not every alternate entry point. That's enough: the
// alert-detection below queries the live DOM for wherever role="alert"
// actually lands, rather than assuming a fixed position, so it stays correct
// no matter which of a room's cards triggered the failure.
const MIC_START_RE = /enable microphone|start free range test/i;

// Every string lib/audio/mic.ts's micErrorMessage() can return contains one
// of these action phrases ("try again", "Plug one in", "Pick a different
// input", "check it isn't disabled…"). Built from that table, not guessed.
const NEXT_ACTION_RE =
  /try again|retry|plug\b.*\bin\b|pick a different|continue without|check (your|it)|allow (the )?mic/i;

const EMPTY_CONTAINER_SELECTOR =
  "ul, ol, table, tbody, [role='list'], [role='grid'], [role='table'], [role='listbox'], [role='feed']";

// A page with one systemic issue (e.g. every disabled Button styled the same
// broken way) shouldn't produce dozens of near-identical findings that drown
// out everything else this module and its siblings report.
const MAX_FINDINGS_PER_CHECK = 6;

export async function run(ctx) {
  const findings = [];

  await safely(findings, "empty-state sweep", () => checkEmptyStates(ctx, findings));
  await safely(findings, "disabled-affordance sweep", () => checkDisabledAffordances(ctx, findings));
  await safely(findings, "destructive-action sweep", () => checkDestructiveActions(ctx, findings));
  if (ctx.route.mic) {
    await safely(findings, "mic-refusal probe", () => checkMicRefusal(ctx, findings));
  }

  return findings;
}

/**
 * run.mjs treats a thrown error from `run()` as one opaque "rig problem" for
 * the whole route and keeps none of the findings collected before the throw
 * (see the try/catch around `audit.run(ctx)`). Four independent sub-checks
 * share this file only because they share a route loop — one of them hitting
 * an unexpected page shape shouldn't cost the other three their findings.
 */
async function safely(findings, label, fn) {
  try {
    await fn();
  } catch (err) {
    findings.push({
      severity: "minor",
      summary: `${label} did not complete`,
      detail: String((err && err.message) || err),
    });
  }
}

/**
 * B. Empty / first-run states.
 *
 * A list/grid/table with no element children and no text of its own reads to
 * a visitor as either "nothing here yet" or "this is broken" — there's no way
 * to tell which without a message. Scoped to semantic list/grid/table roles
 * on purpose: a generic "any div with zero children" sweep would flag every
 * spacer and icon-slot div in the layout, which is noise, not a finding.
 */
async function checkEmptyStates(ctx, findings) {
  const empties = await ctx.page.evaluate((selector) => {
    const out = [];
    document.querySelectorAll(selector).forEach((el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      if (el.getAttribute("aria-hidden") === "true") return;
      if (el.children.length > 0) return;
      if ((el.textContent || "").trim().length > 0) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return; // not actually rendered, not a UI state

      // The container itself has nothing to say by definition (that's why
      // it's a candidate) — any explanation has to live in a sibling instead.
      const parent = el.parentElement;
      const siblingText = parent
        ? Array.from(parent.children)
            .filter((c) => c !== el)
            .map((c) => (c.textContent || "").trim())
            .filter(Boolean)
            .join(" ")
        : "";
      const hasCta = parent ? !!parent.querySelector("a[href], button") : false;

      out.push({
        selector: window.__describe(el),
        hasMessage: siblingText.length > 0,
        hasCta,
        snippet: siblingText.slice(0, 100),
      });
    });
    return out;
  }, EMPTY_CONTAINER_SELECTOR);

  for (const c of empties.slice(0, MAX_FINDINGS_PER_CHECK)) {
    if (!c.hasMessage) {
      findings.push({
        severity: "major",
        summary: "Empty container with no content and no explanatory copy",
        detail: `${c.selector} renders with zero children and no sibling text nearby — a visitor sees a blank region with nothing telling them whether that's by design.`,
        selector: c.selector,
      });
    } else if (!c.hasCta) {
      findings.push({
        severity: "minor",
        summary: "Empty state has a message but no call-to-action",
        detail: `Nearby text: "${c.snippet}" — no link or button nearby for a visitor to act on it.`,
        selector: c.selector,
      });
    }
  }
}

/**
 * C. Disabled affordances — the static half only.
 *
 * Comparing a disabled control's computed style against an enabled sibling
 * of the same tag needs no interaction, so it runs on every route. The
 * brief's other half — "does a control that triggers async work show
 * aria-busy/a spinner while it runs" — needs actually pressing the control to
 * observe, and this module presses exactly one kind of button on purpose
 * (the mic gate, in checkMicRefusal). Most buttons on a marketing, account or
 * checkout-adjacent page are one press from a real side effect (navigation,
 * a Stripe redirect, a sign-in flow), which is out of bounds for a sweep that
 * has to run unattended across every route kind. Even where this module does
 * press a button, the getUserMedia rejection below resolves inside the same
 * microtask flush as the click — Chromium doesn't paint between microtasks,
 * so a transient "requesting…" state exists in React's committed tree for a
 * moment that never actually reaches the screen. That's real for this mock;
 * it says nothing about a real permission prompt, which takes human-scale
 * time and would paint the busy state for as long as it's pending.
 */
async function checkDisabledAffordances(ctx, findings) {
  const indistinct = await ctx.page.evaluate(() => {
    const out = [];
    document.querySelectorAll("[disabled], [aria-disabled='true']").forEach((el) => {
      const parent = el.parentElement;
      if (!parent) return;
      // Same tag, same parent: the fairest same-context comparison, and the
      // one the brief specifies. No comparable sibling means no evidence
      // either way, not a pass.
      const sibling = Array.from(parent.children).find(
        (c) =>
          c !== el &&
          c.tagName === el.tagName &&
          !c.hasAttribute("disabled") &&
          c.getAttribute("aria-disabled") !== "true",
      );
      if (!sibling) return;

      const a = getComputedStyle(el);
      const b = getComputedStyle(sibling);
      const indistinguishable =
        a.opacity === b.opacity &&
        a.color === b.color &&
        a.backgroundColor === b.backgroundColor &&
        a.cursor === b.cursor;
      if (indistinguishable) out.push({ selector: window.__describe(el) });
    });
    return out;
  });

  for (const d of indistinct.slice(0, MAX_FINDINGS_PER_CHECK)) {
    findings.push({
      severity: "minor",
      summary: "Disabled control is not visually distinct from an enabled sibling",
      detail: `${d.selector} matches an enabled sibling's opacity, color, background and cursor — nothing on screen marks it as unavailable.`,
      selector: d.selector,
    });
  }
}

/**
 * D. Destructive actions — static only, never clicked.
 *
 * On /recorder, "Delete {take}" is a real per-browser recording; on
 * /progress, "Erase everything" is the whole practice history. Pressing
 * either to see what happens would destroy the thing this probe is auditing.
 * So this checks only what the brief names — aria-haspopup, an adjacent
 * cancel/confirm control, a title, aria-describedby, or (added here) the
 * control already being disabled/gated — all readable from the resting DOM.
 *
 * That static-only scope has a real blind spot, seen on /recorder's take
 * list: pressing the trash icon there sets a local "armed" flag that swaps in
 * a "Delete take? This can't be undone." message plus Delete/Keep buttons —
 * a genuine two-step confirm, but none of it exists in the DOM before that
 * first press, and the trigger carries no aria-haspopup or aria-expanded
 * naming what it discloses. This check will flag that control. The finding
 * below is worded as "no confirmation signal at rest", not "no confirmation
 * exists" — the first is what this probe actually verified.
 */
async function checkDestructiveActions(ctx, findings) {
  const unconfirmed = await ctx.page.evaluate(() => {
    const destructiveRe = /delete|remove|clear|reset|erase/i;
    const confirmHintRe = /cancel|undo|are you sure|confirm/i;
    const out = [];
    document.querySelectorAll("button, [role='button'], a[href]").forEach((el) => {
      const label = (el.getAttribute("aria-label") || el.textContent || "").trim();
      if (!label || !destructiveRe.test(label)) return;

      const hasPopup = el.hasAttribute("aria-haspopup") && el.getAttribute("aria-haspopup") !== "false";
      const hasTitle = !!(el.getAttribute("title") || "").trim();
      const hasDescribedBy = !!(el.getAttribute("aria-describedby") || "").trim();
      // A control that starts disabled and needs some other action to arm it
      // (progress-client.tsx's "type erase to confirm" input, for example)
      // is its own confirmation gate even with none of the ARIA signals set.
      const isGated = el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";

      const parent = el.parentElement;
      const siblingConfirm = parent
        ? Array.from(parent.children).some((c) => c !== el && confirmHintRe.test(c.textContent || ""))
        : false;

      if (!hasPopup && !hasTitle && !hasDescribedBy && !isGated && !siblingConfirm) {
        out.push({ selector: window.__describe(el), label });
      }
    });
    return out;
  });

  for (const u of unconfirmed.slice(0, MAX_FINDINGS_PER_CHECK)) {
    findings.push({
      severity: "major",
      summary: "Destructive-sounding control has no confirmation signal at rest",
      detail: `"${u.label}" carries no aria-haspopup, title, aria-describedby, disabled/gated state, or sibling cancel/confirm text in the page as it first renders. If it reveals a confirm step dynamically, that step isn't discoverable before the first press.`,
      selector: u.selector,
    });
  }
}

/**
 * ear-training gates its two mic-based games (Pitch match, Melody echo)
 * behind a picker screen; every other room shows its mic-start button as
 * soon as the page settles. Pitch match is picked because it's first in
 * GAMES (components/ear/ear-training-client.tsx) — Interval ID and Higher or
 * lower need no microphone at all, so pressing their "Play" would never call
 * getUserMedia and the probe would wait out its timeout for nothing.
 *
 * The card is found by intersecting two `.filter()` passes — contains the
 * text "Pitch match" AND contains a "Play"-named button — then taking the
 * last match. Every ancestor of the real card also satisfies both filters
 * (an ancestor's text content includes everything inside it), but document
 * order lists a parent before its children, so `.last()` lands on the
 * innermost element that still satisfies both: the card itself, not the grid
 * wrapping all four of them.
 */
async function openEarTrainingGame(page) {
  // The ear room is a learning path now (components/practice/learn-home.tsx):
  // each game is a row button whose text is its title plus a one-line
  // description. The workout cards above the path are also buttons and also
  // name "Pitch match" in their step strip, so they are excluded by the
  // "N games · ~M min" meta line only a workout card carries.
  const row = page
    .getByRole("button")
    .filter({ hasText: "Pitch match" })
    .filter({ hasNotText: /games\s*·/ })
    .first();
  if ((await row.count().catch(() => 0)) === 0) return false;
  try {
    await row.click({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * A. Microphone refusal.
 *
 * getUserMedia is overridden via addInitScript, which only affects documents
 * loaded *after* it's registered — the page ctx.page already carries is not
 * one of them, it navigated before this function ran, so a fresh navigation
 * is mandatory here, not optional. That reload also drops every global this
 * module's DESCRIBE injects (installProbes/DESCRIBE only ran once, against
 * the page's first document), so window.__describe is re-registered below
 * before anything tries to call it.
 */
async function checkMicRefusal(ctx, findings) {
  const { page, route, baseUrl } = ctx;
  const notes = [];

  await page.addInitScript(() => {
    if (!navigator.mediaDevices) return;
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(Object.assign(new Error("sim"), { name: "NotFoundError" }));
  });

  try {
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle", timeout: 20000 });
  } catch (err) {
    findings.push({
      severity: "minor",
      summary: "Mic-refusal probe could not reload the room",
      detail: String((err && err.message) || err),
    });
    return;
  }
  await page.evaluate(DESCRIBE);

  // Defensive: clearAppState (run.mjs) wipes localStorage on every
  // navigation in this context, including this reload, so the XP record that
  // triggers this modal shouldn't exist. Checked anyway because the brief
  // calls it out by name and the cost of checking is one locator lookup.
  const dismiss = page.locator('button[aria-label="Dismiss"]');
  if ((await dismiss.count().catch(() => 0)) > 0 && (await dismiss.first().isVisible().catch(() => false))) {
    await dismiss.first().click({ timeout: 3000 }).catch(() => {});
    notes.push("Pro upsell modal was open on reload and was dismissed before driving the mic control.");
  }

  if (route.name === "ear-training") {
    const opened = await openEarTrainingGame(page);
    if (!opened) {
      findings.push({
        severity: "minor",
        summary: "Mic-refusal probe could not open a mic-based ear-training game",
        detail: ["Looked for the \"Pitch match\" row in the ear-training path and could not find or click it.", ...notes].join(" "),
      });
      return;
    }
  }

  const micButton = page.getByRole("button", { name: MIC_START_RE }).first();
  if ((await micButton.count().catch(() => 0)) === 0) {
    // Per the brief: a probe that can't find the control reports that fact,
    // not that the room is broken.
    findings.push({
      severity: "minor",
      summary: "Mic-refusal probe could not find the mic-start control",
      detail: [`Looked for a button matching ${MIC_START_RE}.`, ...notes].join(" "),
    });
    return;
  }

  try {
    await micButton.click({ timeout: 5000 });
  } catch (err) {
    findings.push({
      severity: "minor",
      summary: "Mic-refusal probe found the mic-start control but could not click it",
      detail: [String((err && err.message) || err), ...notes].join(" "),
    });
    return;
  }

  // The mocked rejection resolves within a few microtask ticks, but the
  // resulting React state update still needs a real wait — this polls rather
  // than sleeping a fixed amount, and gives up cleanly if nothing shows.
  await page.waitForSelector('[role="alert"]', { timeout: 4000 }).catch(() => {});

  // Filtered to alerts that actually name the microphone: every message
  // lib/audio/mic.ts's micErrorMessage() can produce contains that word, so
  // this can't miss a real refusal, and it can't mistake an unrelated
  // role="alert" elsewhere on the page for a second announcement of this one.
  const alerts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role="alert"]'))
      .filter((el) => /microphone/i.test(el.textContent || ""))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          selector: window.__describe(el),
          text: (el.textContent || "").trim(),
          top: r.top,
          viewportHeight: window.innerHeight,
        };
      });
  });

  const noteSuffix = notes.length ? ` ${notes.join(" ")}` : "";

  if (alerts.length === 0) {
    const micSelector = await micButton.evaluate((el) => window.__describe(el)).catch(() => undefined);
    findings.push({
      severity: "blocker",
      summary: 'Microphone refusal produces no [role="alert"] announcement',
      detail:
        `Forced getUserMedia to reject with NotFoundError, clicked "${micSelector ?? "the mic-start control"}", and waited 4s — no alert-role element mentioning "microphone" appeared.${noteSuffix}`,
      selector: micSelector,
    });
    return; // nothing rendered — the fold and next-action checks below have nothing to examine
  }

  if (alerts.length > 1) {
    findings.push({
      severity: "major",
      summary: `Microphone refusal announces ${alerts.length} times`,
      detail: `role="alert" nodes: ${alerts.map((a) => a.selector).join(", ")} — a screen reader announces each one separately for the same failure.${noteSuffix}`,
      selector: alerts[0].selector,
    });
  }

  // Every duplicate almost certainly carries the same message (same
  // pitch.error value rendered twice), so the fold/next-action checks only
  // need to look at one representative node, not repeat per duplicate.
  const primary = alerts[0];
  const aboveFold = primary.top < 0;
  const belowFold = primary.top > primary.viewportHeight;
  if (aboveFold || belowFold) {
    const offset = Math.round(aboveFold ? -primary.top : primary.top - primary.viewportHeight);
    findings.push({
      severity: "major",
      summary: `Mic refusal message renders ${aboveFold ? "above" : "below"} the fold`,
      detail: `getBoundingClientRect().top = ${Math.round(primary.top)}px in a ${primary.viewportHeight}px-tall viewport — about ${offset}px ${aboveFold ? "above" : "below"} what's visible when it appears.${noteSuffix}`,
      selector: primary.selector,
    });
  }

  if (!NEXT_ACTION_RE.test(primary.text)) {
    findings.push({
      severity: "minor",
      summary: "Mic refusal message names no next action",
      detail: `"${primary.text}" reads as a bare error with nothing to try next (retry, continue without a mic, plug one in, and so on).${noteSuffix}`,
      selector: primary.selector,
    });
  }
}
