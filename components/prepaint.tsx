"use client";

import { useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import { PREPAINT_DEEPLINK_ATTRIBUTE, PREPAINT_GLOBAL, type PrepaintState } from "@/lib/prepaint";

/**
 * The React half of the pre-paint state (lib/prepaint.ts has the script and
 * the rules it follows; app/globals.css has the CSS). A state's words that a
 * newcomer never sees stay out of the server HTML's text (prepaintWords).
 *
 * A component whose layout depends on the free cap or the running program
 * renders, while the page is server-rendered and hydrated, every state's
 * version of that part, each carrying a `data-prepaint-*` marker that the CSS
 * matches against the attributes the inline script put on <html>. From the
 * first render after hydration it renders from the real stores and drops the
 * markers, so the swap changes nothing on screen: the part that stays was
 * already showing, and the parts that go were already display:none.
 *
 * On a client-side navigation the component mounts already "hydrated" and
 * renders the real state straight away, where no inline script runs.
 *
 * One marker outlives hydration by a render: a room's deep link, which the
 * room reads from its address in an effect (deepLinkMarker, at the end).
 */

const noChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * False while rendering the server HTML and hydrating it, true from the first
 * render after hydration and on any client-side mount. Every store read with
 * useSyncExternalStore switches from its server snapshot in that same render,
 * which is what lets a marker come off exactly when the real state arrives.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noChanges, onClient, onServer);
}

/**
 * The markers, only until hydration: spread onto the element whose visibility
 * the pre-paint decides. `plan` is "free", "capped", "not-capped" or
 * "not-pro";
 * `program` and `slot` are documented with their rules in app/globals.css.
 */
export function prepaintMarker(
  hydrated: boolean,
  marker: { plan?: "free" | "capped" | "not-capped" | "not-pro"; program?: string; slot?: string },
): Record<string, string> {
  if (hydrated) return {};
  const out: Record<string, string> = {};
  if (marker.plan) out["data-prepaint-plan"] = marker.plan;
  if (marker.program) out["data-prepaint-program"] = marker.program;
  if (marker.slot) out["data-prepaint-slot"] = marker.slot;
  return out;
}

/**
 * Words that only a pre-paint state shows, never a newcomer: the cap wall's.
 * Every visitor's server HTML carries the wall behind the capped marker, and
 * a reader that runs no script and applies no CSS (the answer-engine crawlers
 * app/robots.ts invites) would otherwise take "that's your 5 free minutes for
 * today … 5:00 of 5:00 used" for the opening of four landing pages. So until
 * hydration the words are an attribute, which app/globals.css paints with
 * `content: attr(data-prepaint-text)`: the element, its box and its line
 * breaks are there from the first paint, the words are not in the HTML's
 * text. From the first render after hydration, and on any client-side mount,
 * they are the plain text, which lays out the same. Like prepaintMarker, it
 * takes the caller's useHydrated().
 */
export function prepaintWords(hydrated: boolean, value: string): ReactNode {
  return hydrated ? value : <span data-prepaint-text={value} />;
}

/**
 * A short piece of text the server cannot know (the free minutes left, the
 * streak named on the cap wall), corrected before the first paint by the
 * script right after it from the value the pre-paint script left on window.
 * The pattern is Next's "preventing flash before hydration" guide's: React
 * keeps the corrected text through hydration (`suppressHydrationWarning`),
 * then renders its own value, which is the same text, from the next render.
 * The script is rendered only into the server HTML: on a client mount it
 * would not run, and React warns about a <script> it creates.
 */
export function PrepaintText({ value, field }: { value: string; field: keyof Pick<PrepaintState, "freeLeft" | "streakClause"> }) {
  const hydrated = useHydrated();
  const id = useId();
  return (
    <>
      <span id={id} suppressHydrationWarning>
        {value}
      </span>
      {!hydrated && (
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=window.${PREPAINT_GLOBAL};if(p)document.getElementById(${JSON.stringify(id)}).textContent=p.${field}}catch(e){}`,
          }}
        />
      )}
    </>
  );
}

/**
 * The rooms that open something straight from their address: the breath
 * room a drill or a set (/breath?drill=box), the ear room a workout
 * (/ear-training?routine=quick), both as a session over the whole room, and
 * the warmups room the mic gate for the routine or exercise a link names
 * (/warmups?routine=morning), retitled for it and scrolled to.
 * lib/prepaint-config.ts lists what each one opens.
 */
export type DeepLinkRoom = "breath" | "warmups" | "ear";

/*
 * A static page cannot read its query, so a room reads its address in an
 * effect after hydration, and only then knows what the link opens. Painted
 * as it was prerendered, the room's front page was on screen for that first
 * second and then went away under a session (CLS 0.85 on a phone for every
 * /breath link), or on /warmups retitled its gate and scrolled there while
 * the cards above it settled (0.11, and 0.51 with a saved range). So when the
 * inline script finds such a link (lib/prepaint.ts data-sing-deeplink), the
 * front page is hidden before the first paint and a screen-tall empty block
 * holds its place, keeping the rail band, the guide and the footer off the
 * first screen; what the link opens then arrives as new content and nothing
 * already painted moves. If the room never reads it (the page's scripts did
 * not run), the inline script takes the token off itself a few seconds after
 * load (lib/prepaint.ts PREPAINT_DEEPLINK_FALLBACK_MS), so the front page the
 * server rendered still shows: the token can delay the page, never blank it.
 *
 * `read` is whether the room has read its address. It is not useHydrated():
 * the stores switch to their real values in the render right after
 * hydration, one render before the effect that reads the address, and the
 * front page has to stay hidden through that render as well.
 */

/**
 * On the wrapper of a room's front page, until the room has read its
 * address: hidden before the first paint when the address holds a link the
 * room will open for this singer.
 */
export function deepLinkMarker(read: boolean, room: DeepLinkRoom): Record<string, string> {
  return read ? {} : { "data-prepaint-deeplink": room };
}

/**
 * The screen-tall block that holds the front page's place. Until the room
 * has read its address it is in the server HTML after the front page and
 * shows only on a deep link's load (app/globals.css). Once read, a room whose
 * link opened a session keeps the same block, now plain, under the session,
 * so the page under the session's full-screen surface does not move either.
 * Empty and out of the accessibility tree: a frame, not content.
 */
export function DeepLinkSlot({ room, read }: { room: DeepLinkRoom; read: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="min-h-screen"
      {...(read ? {} : { "data-prepaint-slot": `deeplink-${room}` })}
    />
  );
}

/**
 * Takes the deep-link attribute off <html> once the room has read its
 * address. It runs after the render that dropped the room's markers, so
 * nothing on screen changes; it is removed so that a later visit to the room
 * by client-side navigation, whose first render carries the markers again
 * until it reads its own address, is never hidden by a link from the first
 * load.
 */
export function useDeepLinkRead(read: boolean): void {
  useEffect(() => {
    if (read) document.documentElement.removeAttribute(PREPAINT_DEEPLINK_ATTRIBUTE);
  }, [read]);
}
