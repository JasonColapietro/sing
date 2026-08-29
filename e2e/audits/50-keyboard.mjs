/**
 * Keyboard reachability and focus management audit.
 *
 * Everything that moves focus here is a real Playwright key press
 * (`page.keyboard.press`), never `element.focus()` or `element.click()` from
 * inside `page.evaluate`. Both lie in this project: programmatic `.focus()`
 * does not produce `:focus-visible` (so a probe built on it would report
 * "no focus ring" on every element, correctly styled or not), and React's
 * synthetic event system does not see a DOM-level `.click()` (so nothing
 * would open). A single audit driving 60 real key presses per route x
 * viewport is the only way to get a trustworthy answer here.
 */

export const id = "keyboard";
export const title = "Keyboard reachability and focus management";

// 30 routes x 5 viewports run this audit once each. A page with an
// unreachable control at document-order position 400 isn't something this
// budget can prove either way — see `walkExhaustedBudget` below, which keeps
// that case silent instead of guessing.
const MAX_TAB_PRESSES = 60;

// The set the browser itself considers for sequential focus, before the
// per-element narrowing in `isRealStop` below turns "matches this selector"
// into "the browser will actually Tab here." `[tabindex]` is included so
// both `tabindex="0"` (adds a stop) and `tabindex="-1"` (deliberately
// removes one — e.g. this repo's dialog wrappers, which get `tabIndex={-1}`
// so JS can focus them programmatically without Tab ever landing there) show
// up in the raw pool; `isRealStop` drops the negative ones.
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button",
  "input",
  "select",
  "textarea",
  "audio[controls]",
  "video[controls]",
  "details > summary:first-of-type",
  "iframe",
  '[contenteditable=""]',
  '[contenteditable="true"]',
  "[tabindex]",
].join(",");

/**
 * Installed once per route via `page.evaluate(setupKeyboardProbe, selector)`.
 * Everything lives on `window.__kbAudit` so the per-Tab-press calls below can
 * stay cheap (`page.evaluate(() => window.__kbAudit.snapshot())`) instead of
 * re-serializing this whole closure on every keystroke.
 *
 * Deliberately plain function syntax, not a template-literal IIFE string like
 * `harness.mjs` uses for its probes — those get exported and composed
 * elsewhere, so a raw string is worth the double-escaping cost. This probe is
 * private to this one module, so a real function passed straight to
 * `page.evaluate` is simpler and can't develop the kind of `\\s+` escaping
 * bug a hand-written source string invites.
 */
function setupKeyboardProbe(selector) {
  window.__kbAudit = {
    selector,
    // `scope` narrows `candidates()` to an open dialog's own subtree when
    // one is already up at page load (see run() below) — the rest of the
    // page is covered by it and isn't meaningfully testable while it's open.
    scope: document,
    openDialogEl: null,

    isRealStop(el) {
      if (el.hasAttribute("disabled") || el.disabled) return false;
      if (el.closest("fieldset[disabled]")) return false;
      if (el.closest("[inert]")) return false;
      // aria-hidden removes an element from the accessibility tree, and
      // current Chrome also removes it from sequential Tab navigation — so
      // excluding it here matches what a real Tab press actually does.
      if (el.closest('[aria-hidden="true"]')) return false;
      const style = getComputedStyle(el);
      // `visibility` is inherited, so checking the element's own computed
      // value already accounts for a hidden ancestor; no separate closest()
      // walk needed the way aria-hidden requires.
      if (style.visibility === "hidden" || style.display === "none") return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;
      const raw = el.getAttribute("tabindex");
      if (raw !== null && parseInt(raw, 10) < 0) return false;
      return true;
    },

    // Recomputed fresh on every call rather than cached once, so a dialog
    // that opens or closes mid-walk is reflected immediately instead of
    // working off a stale snapshot of the DOM taken before the walk began.
    candidates() {
      const root = window.__kbAudit.scope || document;
      const list = root.querySelectorAll(window.__kbAudit.selector);
      return Array.from(list).filter(window.__kbAudit.isRealStop);
    },

    // Finds a modal/dialog/full-viewport overlay that is ALREADY open —
    // this module never clicks a trigger to open one itself (nothing here
    // uses .click(), see the header comment), both to respect the "drive
    // real keys" scope and because opening something and not restoring it
    // would leak state into whichever audit module runs next against this
    // same page (run.mjs shares one page across every audit for a route).
    findOpenOverlay() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nodes = document.querySelectorAll('[role="dialog"], [aria-modal="true"], .fixed');
      for (const el of nodes) {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const isDialogRole =
          el.getAttribute("role") === "dialog" || el.getAttribute("aria-modal") === "true";
        const intersectsViewport =
          rect.left < vw && rect.right > 0 && rect.top < vh && rect.bottom > 0;
        // Catches the Pro upsell modal / nav drawer pattern even without
        // role=dialog: `fixed inset-0 z-[70]`-style overlays that swallow
        // the page beneath them.
        const isFullViewportFixed =
          style.position === "fixed" &&
          rect.width >= vw * 0.9 &&
          rect.height >= vh * 0.9 &&
          intersectsViewport;
        if (isDialogRole || isFullViewportFixed) return el;
      }
      return null;
    },

    // "open" only when the tracked dialog is still mounted, unhidden, and
    // sized — so a dialog that legitimately closes itself mid-walk reads as
    // "closed" rather than falsely flagging every subsequent Tab press as an
    // "escape" from something that no longer exists.
    dialogState() {
      const el = window.__kbAudit.openDialogEl;
      if (!el) return "none";
      if (!document.body.contains(el)) return "closed";
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return "closed";
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return "closed";
      return "open";
    },

    // Whole-document scan, independent of dialog scope — a stray positive
    // tabindex is a bug wherever it lives, including on something currently
    // hidden behind an overlay.
    positiveTabindexEls() {
      const out = [];
      for (const el of document.querySelectorAll("[tabindex]")) {
        const n = parseInt(el.getAttribute("tabindex"), 10);
        if (Number.isFinite(n) && n > 0) out.push(`${window.__describe(el)} (tabindex=${n})`);
      }
      return out;
    },

    snapshot() {
      const active = document.activeElement;
      const isBody = !active || active === document.body;
      const cands = window.__kbAudit.candidates();
      // -1 when activeElement isn't one of our tabbable candidates — either
      // <body> or something outside the current scope/selector.
      const idx = active ? cands.indexOf(active) : -1;
      const rect = active ? active.getBoundingClientRect() : null;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const offscreen = rect
        ? rect.bottom <= 0 || rect.top >= vh || rect.right <= 0 || rect.left >= vw
        : false;
      const dState = window.__kbAudit.dialogState();
      const insideDialog =
        dState === "open"
          ? window.__kbAudit.openDialogEl === active || window.__kbAudit.openDialogEl.contains(active)
          : null; // null = no dialog currently confirmed open, not "contained"
      return {
        describe: isBody ? "<body>" : window.__describe(active),
        tag: active ? active.tagName.toLowerCase() : null,
        isBody,
        idx,
        // Only ever asked of a real element a real Tab press just landed on
        // — see the header comment on why .focus()-driven checks lie here.
        focusVisible: active && !isBody ? active.matches(":focus-visible") : false,
        rect: rect ? { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom } : null,
        offscreen,
        scrollY: window.scrollY,
        insideDialog,
      };
    },
  };
}

export async function run(ctx) {
  const { page, route, viewport } = ctx;
  const findings = [];

  await page.evaluate(setupKeyboardProbe, FOCUSABLE_SELECTOR);

  // ---- Rule 1c: any positive tabindex at all -------------------------------
  const positiveTabindex = await page.evaluate(() => window.__kbAudit.positiveTabindexEls());
  if (positiveTabindex.length > 0) {
    findings.push({
      severity: "minor",
      summary: `${positiveTabindex.length} element(s) use a positive tabindex — almost always a bug`,
      detail:
        positiveTabindex.slice(0, 10).join("; ") +
        (positiveTabindex.length > 10 ? `, and ${positiveTabindex.length - 10} more` : ""),
      selector: positiveTabindex[0],
    });
  }

  // ---- Rule 3 setup: is a modal/dialog/overlay already open? --------------
  // Checked before anything else moves focus, and BEFORE computing the
  // expected tab-stop list, so that list is correctly scoped from the start
  // rather than corrected after the fact.
  const dialogDescribe = await page.evaluate(() => {
    const el = window.__kbAudit.findOpenOverlay();
    window.__kbAudit.openDialogEl = el;
    window.__kbAudit.scope = el ?? document;
    return el ? window.__describe(el) : null;
  });
  const dialogOpenAtStart = dialogDescribe != null;
  if (dialogOpenAtStart) {
    findings.push({
      severity: "minor",
      summary: "A modal/dialog was already open when this audit started",
      detail: `${dialogDescribe} was open before any key was pressed on ${route.name}. Keyboard checks below are scoped to its contents; results for the rest of the page are unreliable while it covers it.`,
      selector: dialogDescribe,
    });
  }

  // Rule 4 only means anything from a genuinely untouched page. If the app
  // autofocused something on load (or an earlier-numbered audit module left
  // focus somewhere), "first Tab from page load" no longer describes what
  // we're about to measure, so that check is skipped rather than misreported.
  const startedFromFreshLoad = await page.evaluate(() => document.activeElement === document.body);

  const expectedList = await page.evaluate(() =>
    window.__kbAudit.candidates().map((el) => window.__describe(el))
  );

  // ---- The walk: one pass of real Tab presses feeds rules 1, 2, 4, 5, 6 ---
  const visited = [];
  const seenIdx = new Set();
  let cycleDetected = false;
  let reachedNaturalEnd = false;

  for (let i = 0; i < MAX_TAB_PRESSES; i++) {
    const prev = visited[visited.length - 1] ?? null;
    await page.keyboard.press("Tab");

    let snap = await page.evaluate(() => window.__kbAudit.snapshot());
    // Settle check: only pay for a second round trip when the first read
    // says "offscreen" — this repo sets no scroll-behavior: smooth anywhere
    // (checked in app/globals.css), so there's no animation to wait out, but
    // a scroll container one frame behind focus is still worth a retry
    // before calling it a real miss.
    if (snap.offscreen && !snap.isBody) {
      const before = snap.scrollY;
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      snap = await page.evaluate(() => window.__kbAudit.snapshot());
      snap.scrolledAtAll = snap.scrollY !== before;
    }
    visited.push(snap);

    if (snap.idx >= 0) {
      if (seenIdx.has(snap.idx)) {
        // Landed on something already visited — the tab sequence has
        // cycled (or is stuck). Either way, more presses just repeat data
        // we already have.
        cycleDetected = true;
        break;
      }
      seenIdx.add(snap.idx);
    } else if (snap.isBody && prev) {
      if (prev.idx === expectedList.length - 1) {
        // Tabbed off the last candidate in document order straight to
        // <body> — the normal, expected end of the sequence, not a bug.
        reachedNaturalEnd = true;
        break;
      }
      // Otherwise focus vanished before reaching the last expected control.
      // Rule 5 below reports this specific case; keep walking here in case
      // it's transient (e.g. a closing animation's intermediate frame).
    }
  }

  // ---- Rule 4: skip link ---------------------------------------------------
  if (!dialogOpenAtStart && startedFromFreshLoad && visited.length > 0) {
    const first = visited[0];
    const looksLikeSkipLink = first.tag === "a" && /skip/i.test(first.describe);
    if (!looksLikeSkipLink) {
      findings.push({
        severity: "minor",
        summary: "First focusable element on the page is not a skip-to-content link",
        detail: `Tab #1 from a fresh load landed on ${first.describe}. Many sites legitimately omit a skip link, so this is a suggestion, not a violation.`,
        selector: first.describe,
      });
    }
  }

  // ---- Rule 1a: a visible, interactive control that never received focus --
  const maxIdxReached = seenIdx.size > 0 ? Math.max(...seenIdx) : -1;
  const walkExhaustedBudget = !reachedNaturalEnd && !cycleDetected;
  const unvisitedIdx = [];
  for (let idx = 0; idx < expectedList.length; idx++) {
    // When the walk ran out of presses rather than reaching a natural end or
    // a cycle, only flag gaps inside the range it actually covered — an
    // element past position `maxIdxReached` wasn't skipped, it just wasn't
    // reached yet, and the 60-press cap means we can't tell the difference.
    if (!seenIdx.has(idx) && (!walkExhaustedBudget || idx < maxIdxReached)) {
      unvisitedIdx.push(idx);
    }
  }
  if (unvisitedIdx.length > 0) {
    const names = unvisitedIdx.slice(0, 10).map((idx) => expectedList[idx]);
    findings.push({
      severity: "major",
      summary: `${unvisitedIdx.length} visible, interactive control(s) never received focus during a ${visited.length}-press Tab walk`,
      detail:
        `Skipped in document order: ${names.join("; ")}` +
        (unvisitedIdx.length > 10 ? `, and ${unvisitedIdx.length - 10} more` : "") +
        (walkExhaustedBudget
          ? `. The walk hit its ${MAX_TAB_PRESSES}-press cap before reaching the end of the page, so coverage stops after document-order position ${maxIdxReached}.`
          : ""),
      selector: names[0],
    });
  }

  // ---- Rule 1b: focus order jumping backward relative to DOM order --------
  const idxSeq = visited.filter((s) => s.idx >= 0);
  const backwardJumps = [];
  for (let i = 1; i < idxSeq.length; i++) {
    if (idxSeq[i].idx < idxSeq[i - 1].idx) {
      backwardJumps.push({ from: idxSeq[i - 1], to: idxSeq[i] });
    }
  }
  // A walk that visited every expected control and then cycled back to the
  // first one ends in exactly one backward jump by construction (the wrap
  // from the last control back to the first) — that's correct tab order
  // looping, not a bug. Only strip it when the wrap is clean like that;
  // any other repeat (a partial loop that never covered everything) keeps
  // all of its jumps, since that's a real trap-shaped bug outside a dialog.
  const fullCycleWrap =
    cycleDetected &&
    idxSeq.length > 0 &&
    idxSeq[idxSeq.length - 1].idx === idxSeq[0].idx &&
    seenIdx.size === expectedList.length;
  const realJumps = fullCycleWrap ? backwardJumps.slice(0, -1) : backwardJumps;
  if (realJumps.length > 1) {
    findings.push({
      severity: "minor",
      summary: `Tab order jumps backward relative to DOM order ${realJumps.length} times — usually a stray positive tabindex`,
      detail: realJumps
        .slice(0, 5)
        .map((j) => `${j.from.describe} -> ${j.to.describe}`)
        .join("; "),
      selector: realJumps[0].to.describe,
    });
  }

  // ---- Rule 2: focus visibility --------------------------------------------
  const realVisits = visited.filter((s) => !s.isBody);
  const noFocusVisible = realVisits.filter((s) => !s.focusVisible);
  // app/globals.css styles :focus-visible globally, so a 100% failure rate
  // across a real sample means this run's probe is misreporting, not that
  // every control on the route lost its focus ring — see the header comment.
  // Emitting hundreds of majors in that case would bury the one real signal
  // (the probe is broken) under noise, so this collapses to a single blocker
  // instead. 5 is a floor for "real sample" — below that, a 100% failure
  // rate is as likely to be a sparse page as a broken probe, so individual
  // majors are reported instead.
  if (realVisits.length >= 5 && noFocusVisible.length === realVisits.length) {
    findings.push({
      severity: "blocker",
      summary:
        "The :focus-visible probe matched nothing for any control tabbed to — the rig, not the site, is almost certainly broken",
      detail: `${realVisits.length} real page.keyboard Tab presses landed on real elements on ${route.name} and :focus-visible matched none of them, despite :focus-visible being styled globally in app/globals.css (outline: 2px solid var(--color-rec)). Treat other findings from this audit on this route/viewport with caution until this is investigated.`,
    });
  } else if (noFocusVisible.length > 0) {
    const first = noFocusVisible[0];
    findings.push({
      severity: "major",
      summary: `${noFocusVisible.length} of ${realVisits.length} focused control(s) had no visible focus indicator after a real Tab press`,
      detail: `e.g. ${first.describe} did not match :focus-visible even though it is styled globally. Also affected: ${
        noFocusVisible
          .slice(1, 5)
          .map((s) => s.describe)
          .join("; ") || "(none other)"
      }.`,
      selector: first.describe,
    });
  }

  // ---- Rule 5: focus lost to <body> mid-sequence ---------------------------
  for (let i = 1; i < visited.length; i++) {
    const snap = visited[i];
    const prev = visited[i - 1];
    if (snap.isBody && prev && !prev.isBody && prev.idx !== expectedList.length - 1) {
      const remaining = prev.idx >= 0 ? expectedList.length - 1 - prev.idx : expectedList.length;
      findings.push({
        severity: "major",
        summary: "Focus was lost to <body> mid-sequence while focusable controls remained",
        detail: `Tab #${i + 1} moved focus off ${prev.describe} to <body> instead of the next control, with roughly ${remaining} more candidate(s) still ahead in document order.`,
        selector: prev.describe,
      });
      break; // one clear witness beats a flood from a page that oscillates
    }
  }

  // ---- Rule 6: offscreen focus ---------------------------------------------
  const offscreenMisses = visited.filter((s) => !s.isBody && s.offscreen);
  if (offscreenMisses.length > 0) {
    const details = offscreenMisses.slice(0, 5).map((s) => {
      const pressNum = visited.indexOf(s) + 1;
      const note = s.scrolledAtAll ? "scrolled, but still offscreen" : "no scroll occurred";
      return `tab #${pressNum} focused ${s.describe} at y=${Math.round(s.rect.top)}, viewport height ${viewport.height}, ${note}`;
    });
    findings.push({
      severity: "major",
      summary: `${offscreenMisses.length} focused control(s) landed outside the viewport without being scrolled into view`,
      detail: details.join("; "),
      selector: offscreenMisses[0].describe,
    });
  }

  // ---- Rule 3 continued: trap containment + Escape-to-close ---------------
  if (dialogOpenAtStart) {
    const escapes = visited.filter((s) => s.insideDialog === false);
    if (escapes.length > 0) {
      const first = escapes[0];
      const pressNum = visited.indexOf(first) + 1;
      findings.push({
        severity: "major",
        summary: "Focus escaped the open dialog during Tab navigation",
        detail: `Tab #${pressNum} moved focus to ${first.describe}, outside ${dialogDescribe}. An aria-modal="true" dialog must trap Tab focus inside itself while open.`,
        selector: first.describe,
      });
    }

    await page.keyboard.press("Escape");
    await page.waitForTimeout(50); // let a close transition's unmount settle
    const stillOpen = await page.evaluate(() => window.__kbAudit.dialogState() === "open");
    if (stillOpen) {
      findings.push({
        severity: "minor",
        summary: "Escape did not close the open dialog",
        detail: `${dialogDescribe} was still present and visible after pressing Escape.`,
        selector: dialogDescribe,
      });
    }
  }

  return findings;
}
