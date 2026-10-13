/**
 * Pre-paint state: what this browser's storage will make a page look like,
 * worked out before the first paint so the server-rendered layout can take
 * that shape from the start.
 *
 * Every page is prerendered, and the two things that most reshape a practice
 * page live only in localStorage: the free plan's daily cap (the practice log
 * plus the Pro entitlement cache) and the running program. The prerender
 * always has a newcomer's empty record, so for a capped singer the rooms used
 * to paint the newcomer's layout and then, at hydration, swap the allowance
 * line for the cap wall and drop the mic gate; for a singer with a program,
 * /programs and /warmups mounted a card above content already on screen. On a
 * 375px phone that was a layout shift of 0.40 to 0.52.
 *
 * `prepaintScript()` is inlined in the root layout's <head>, with the
 * configuration lib/prepaint-config.ts derives from the programs and limits.
 * The parser runs it before it reaches <body>, so the attributes it sets on
 * <html> are there for the first paint:
 *
 *   data-sing-plan     "pro" | "free" | "capped"
 *   data-sing-program  absent with no program, or on another program's own
 *                      view; otherwise a status token ("todo", "done" or
 *                      "finished") and any of "rest", "locked",
 *                      "next-locked", "waits", "book" (the end of
 *                      prepaintState says when each applies)
 *
 * The server HTML carries every state's version of the affected parts, each
 * marked with a `data-prepaint-*` attribute, and app/globals.css shows the one
 * that matches (display:none for the rest, so a hidden part is hidden from
 * assistive technology too). Once React has hydrated, components render from
 * the real stores and drop the markers, so the attributes on <html> never
 * matter after the first render; components/prepaint.tsx has the React half.
 * This module imports nothing, so the React half pulls nothing more into a
 * room's bundle.
 *
 * Everything here is a best guess at what the stores will say, never a source
 * of truth: a wrong guess costs one layout shift at hydration, which is what
 * every load cost before. The one guess it cannot make is a program day the
 * log completes on its own (that needs every room's evidence rules); a day
 * finished in a room that does not save the program record shows as still to
 * do until a page that reads the program saves it.
 *
 * `prepaintState` runs as the inline script's body, through
 * Function.prototype.toString, so it must stay self-contained: no imports,
 * closures or helpers from outside its own body, and no syntax a transpiler
 * might expand into a call to a helper of its own (spread, optional
 * chaining, destructuring, default parameters). prepaint.test.ts runs the
 * script text itself, not only the function.
 */

/**
 * The stores this reads. Restated rather than imported because the modules
 * that own them are client-only, and a server component importing a value
 * from one gets a client reference rather than the string; prepaint.test.ts
 * holds each to its owner.
 */
export const PREPAINT_KEYS = {
  progress: "suede-sing:progress:v1",
  pro: "suede-sing:pro:v2",
  program: "suede-sing:program:v1",
} as const;

/** The activities the free cap counts. Restated from lib/free-cap.ts (client-only); the test compares them. */
export const PREPAINT_CAPPED_TYPES = ["warmup", "ear", "breath", "song"] as const;

export type PlanPrepaint = "pro" | "free" | "capped";

export interface PrepaintState {
  plan: PlanPrepaint;
  /** Space-separated tokens for data-sing-program, or null when no program is running. */
  program: string | null;
  /** The free minutes left today as the allowance line prints them ("3:20"). */
  freeLeft: string;
  /** The cap wall's streak clause (", now 4 days"), or "". */
  streakClause: string;
}

export interface PrepaintConfig {
  keys: { progress: string; pro: string; program: string };
  capSec: number;
  cappedTypes: readonly string[];
  maxSessions: number;
  /** The first program day index past a Pro program's free weeks. */
  freeDays: number;
  /**
   * Per program id: [1 when Pro, number of days, indexes of rest days, 1 when
   * it follows the book (has chapters)].
   */
  programs: Record<string, [number, number, number[], number]>;
}

/**
 * The state the stores hold, as the pages will read it once hydrated:
 * lib/free-cap.ts useFreeCap for the plan, components/programs/use-program.ts
 * for the program (reviveProgress, then reconcileProgress for rest days, then
 * programToday), and components/account/save-state.ts liveStreak.
 *
 * `where` is the page's address (the browser's `location`). It matters on one
 * page: a program's own view, /programs?program=<id> (served from
 * /programs/<id>, see next.config.ts), shows today's card only when that is
 * the running program. Viewing another one, the running program shows nowhere
 * on the page, so the state says no program.
 */
export function prepaintState(
  storage: { getItem(key: string): string | null },
  now: Date,
  c: PrepaintConfig,
  where?: { pathname: string; search: string },
): PrepaintState {
  function read(key: string): unknown {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  function pad(n: number): string {
    return (n < 10 ? "0" : "") + n;
  }
  function dayKey(d: Date): string {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function utcDay(t: number): string {
    const d = new Date(t);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
  }
  // lib/programs.ts isCalendarDay and addDays.
  function isDay(v: unknown): boolean {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const t = Date.parse(v + "T00:00:00Z");
    return !isNaN(t) && utcDay(t) === v;
  }
  function nextDay(day: string): string {
    return utcDay(Date.parse(day + "T00:00:00Z") + 86400000);
  }
  function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
  }

  const today = dayKey(now);
  const yesterdayDate = new Date(now.getTime());
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dayKey(yesterdayDate);

  const pro = read(c.keys.pro);
  const isPro = isObject(pro) && Boolean(pro.active);

  const progress = read(c.keys.progress);
  const sessions = isObject(progress) && Array.isArray(progress.sessions) ? progress.sessions : [];
  let used = 0;
  let kept = 0;
  for (let i = 0; i < sessions.length && kept < c.maxSessions; i++) {
    const s = sessions[i];
    // The sessions sanitizeProgress keeps: an id, a known type and a day.
    if (!isObject(s) || typeof s.id !== "string" || typeof s.type !== "string" || !isDay(s.day)) continue;
    kept++;
    if (s.day === today && c.cappedTypes.indexOf(s.type) >= 0 && typeof s.durationSec === "number" && isFinite(s.durationSec)) {
      used += Math.max(0, Math.round(s.durationSec));
    }
  }
  const capped = !isPro && used >= c.capSec;
  const plan: PlanPrepaint = isPro ? "pro" : capped ? "capped" : "free";
  const left = Math.max(0, c.capSec - used);
  const freeLeft = Math.floor(left / 60) + ":" + pad(left % 60);

  const streak = isObject(progress) && isObject(progress.streak) ? progress.streak : null;
  const current = streak && typeof streak.current === "number" ? streak.current : 0;
  const lastDay = streak && typeof streak.lastDay === "string" ? streak.lastDay : null;
  const live = current > 0 && (lastDay === today || lastDay === yesterday) ? current : 0;
  const streakClause = live > 1 ? ", now " + live + " days" : "";

  let program: string | null = null;
  const record = read(c.keys.program);
  const def =
    isObject(record) && typeof record.programId === "string" && Object.prototype.hasOwnProperty.call(c.programs, record.programId)
      ? c.programs[record.programId]
      : null;
  if (def && isObject(record) && isDay(record.startedDay)) {
    const proProgram = def[0] === 1;
    const length = def[1];
    const rest = def[2];
    const book = def[3] === 1;
    const startedDay = record.startedDay as string;
    // reviveProgress: the longest valid prefix of the done list.
    const done: string[] = [];
    const list = Array.isArray(record.done) ? record.done : [];
    for (let j = 0; j < list.length; j++) {
      const d = list[j];
      if (!isObject(d) || d.index !== done.length || done.length >= length) break;
      const prev = done.length ? done[done.length - 1] : "";
      if (!isDay(d.day) || (d.day as string) <= prev || (d.day as string) < startedDay) break;
      done.push(d.day as string);
    }
    // A finished run singing one fortnight again (lib/programs.ts
    // repeatFortnight) is finished again at `until`, when reviveProgress
    // keeps it: a whole `later` list running to the last day.
    let end = length;
    const until = record.until;
    const later = record.later;
    if (
      typeof until === "number" && Math.floor(until) === until && until > 0 && until < length &&
      done.length <= until && Array.isArray(later) && until + later.length === length
    ) {
      let whole = true;
      for (let k = 0; k < later.length; k++) {
        const d = later[k];
        if (!isObject(d) || d.index !== until + k || !isDay(d.day) || (d.day as string) < startedDay) whole = false;
      }
      if (whole) end = until;
    }
    // reconcileProgress, for the one thing it does without the log: a rest
    // day completes on the first calendar day it is reached.
    while (done.length < end && rest.indexOf(done.length) >= 0) {
      const from = done.length ? nextDay(done[done.length - 1]) : startedDay;
      if (from > today) break;
      done.push(from);
    }
    // programToday, and the cards' paywall and cap rules.
    const tokens: string[] = [];
    if (done.length >= end) {
      tokens.push("finished");
      // The book's program finishes on chapter 19's next steps, its fortnight
      // choices and six check-in readings: a card twice another's height.
      if (book) tokens.push("book");
    } else if (done.length && done[done.length - 1] >= today) {
      const index = done.length - 1;
      tokens.push("done");
      if (rest.indexOf(index) >= 0) tokens.push("rest");
      const next = index + 1;
      if (!isPro && proProgram && next < length && rest.indexOf(next) < 0 && next >= c.freeDays) tokens.push("next-locked");
    } else {
      tokens.push("todo");
      if (!isPro && proProgram && done.length >= c.freeDays) tokens.push("locked");
      else if (capped) tokens.push("waits");
    }
    program = tokens.join(" ");
    // components/programs/programs-client.tsx programIdAt, on /programs.
    let viewing: string | null = null;
    if (where && /^\/programs(?:\/|$)/.test(where.pathname)) {
      viewing = new URLSearchParams(where.search).get("program");
      const segment = /^\/programs\/([^/]+)\/?$/.exec(where.pathname);
      if (viewing === null && segment) viewing = segment[1];
    }
    if (viewing !== null && viewing !== record.programId && Object.prototype.hasOwnProperty.call(c.programs, viewing)) {
      program = null;
    }
  }

  return { plan, program, freeLeft, streakClause };
}

/** Where the values the attributes cannot carry wait for components/prepaint.tsx PrepaintText. */
export const PREPAINT_GLOBAL = "__singPrepaint";

/**
 * The inline script: work the state out, put it on <html>, and leave the two
 * text values for PrepaintText. Any failure leaves the attributes unset,
 * which is the newcomer's layout the server rendered anyway.
 */
export function prepaintScript(config: PrepaintConfig): string {
  return (
    `try{var s=(${prepaintState.toString()})(localStorage,new Date(),${JSON.stringify(config)},location),` +
    `h=document.documentElement;window.${PREPAINT_GLOBAL}=s;h.setAttribute("data-sing-plan",s.plan);` +
    `if(s.program)h.setAttribute("data-sing-program",s.program)}catch(e){}`
  );
}
