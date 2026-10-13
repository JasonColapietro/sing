/**
 * A visible screen nobody is using is not practice either.
 *
 * hidden-time.ts leaves out the time a tab spends hidden. The turn-based ear
 * games and the Breathe-and-sing drill also wait as long as it takes for the
 * next tap, answer or breath, so a phone put down on a visible game kept
 * counting: an idle Pitch match could use up a free singer's whole five
 * minutes and earn XP for it. This clock leaves that out too. Any stretch of
 * more than IDLE_GRACE_MS on a visible screen with no input and no game event
 * counts as IDLE_GRACE_MS; the rest is moved out of the run the same way a
 * hidden stretch is, and that includes the stretch between the last input and
 * the moment the run is logged.
 *
 * Thirty seconds is longer than any of these games asks a singer to go
 * without a tap or a game event: a Pitch match or Melody echo round plays its
 * reference and runs its whole answer window in well under twenty, and its
 * result is itself an event; a breathe-and-sing rep is a breath and a
 * four-second note, and the drill hears both.
 *
 * The arithmetic is pure, so it is tested without a DOM: `start` and
 * `lastActive` are instants on the caller's clock (performance.now()).
 */

/** The longest visible stretch with no input that counts in full. */
export const IDLE_GRACE_MS = 30_000;

export interface ActiveClock {
  /** The run's start, moved forward past every hidden stretch and every idle excess. */
  readonly start: number;
  /** The last input or game event, moved forward past hidden stretches since. */
  readonly lastActive: number;
  /** When the run began or was last restarted: a hidden stretch counts only from here. */
  readonly since: number;
}

/** A run starting now, with the start counting as its first event. */
export function startActiveClock(now: number): ActiveClock {
  return { start: now, lastActive: now, since: now };
}

/**
 * Input or a game event at `now`. A gap since the last one longer than the
 * grace keeps only the grace; the start moves forward by the excess.
 */
export function markActive(
  clock: ActiveClock,
  now: number,
  graceMs: number = IDLE_GRACE_MS,
): ActiveClock {
  const excess = Math.max(0, now - clock.lastActive - graceMs);
  return { ...clock, start: clock.start + excess, lastActive: Math.max(clock.lastActive, now) };
}

/**
 * A hidden stretch of `ms` ending at `now`, reported when the tab comes back.
 * The run moves past it, and so does the idle gap, so the visible minutes on
 * either side of it are added up rather than the hidden ones counted twice.
 * Only the part after the run began is skipped: a game that restarts its
 * clock while the tab is hidden (a mic turning on) never had the earlier part
 * to give back, and skipping it would push the start past `now`.
 */
export function skipHidden(clock: ActiveClock, ms: number, now: number): ActiveClock {
  const skip = Math.max(0, Math.min(ms, now - clock.since));
  return {
    ...clock,
    start: Math.min(clock.start + skip, now),
    lastActive: Math.min(clock.lastActive + skip, now),
  };
}

/**
 * Milliseconds of the run that count as practice at `now`: the time since its
 * start, less hidden stretches and every idle excess, the trailing one up to
 * `now` included.
 */
export function activeElapsedMs(
  clock: ActiveClock,
  now: number,
  graceMs: number = IDLE_GRACE_MS,
): number {
  return Math.max(0, now - markActive(clock, now, graceMs).start);
}

/**
 * The same clock as a mutable handle, for a component that feeds it from
 * event listeners and reads it once, when the run is logged.
 */
export interface ActiveTimer {
  /** Start the run again at `now`, as a replay does. */
  restart(now: number): void;
  /** Input or a game event at `now`. */
  mark(now: number): void;
  /** A hidden stretch of `ms` ending at `now`, reported when the tab comes back. */
  hidden(ms: number, now: number): void;
  /** Milliseconds of practice at `now`, hidden and idle time left out. */
  elapsedMs(now: number): number;
}

export function createActiveTimer(now: number, graceMs: number = IDLE_GRACE_MS): ActiveTimer {
  let clock = startActiveClock(now);
  return {
    restart: (t) => {
      clock = startActiveClock(t);
    },
    mark: (t) => {
      clock = markActive(clock, t, graceMs);
    },
    hidden: (ms, t) => {
      clock = skipHidden(clock, ms, t);
    },
    elapsedMs: (t) => activeElapsedMs(clock, t, graceMs),
  };
}

/** The input that marks a singer as present: a tap, a click or a key. */
export const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

/** The slice of `document` the input tracker listens to. */
export interface ActivitySource {
  addEventListener(type: string, listener: () => void, options?: AddEventListenerOptions): void;
  removeEventListener(type: string, listener: () => void, options?: EventListenerOptions): void;
}

/**
 * Call `onInput` on every tap, click or key press anywhere in the document.
 * Capturing and passive, so a control that stops propagation still counts and
 * scrolling is never held up. Returns the unsubscribe.
 */
export function trackActivity(doc: ActivitySource, onInput: () => void): () => void {
  const listener = () => onInput();
  for (const type of ACTIVITY_EVENTS) {
    doc.addEventListener(type, listener, { capture: true, passive: true });
  }
  return () => {
    for (const type of ACTIVITY_EVENTS) {
      doc.removeEventListener(type, listener, { capture: true });
    }
  };
}
